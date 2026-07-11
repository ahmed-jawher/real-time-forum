package forum

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

type socketClient struct {
	conn    *websocket.Conn
	writeMu sync.Mutex
}

func (client *socketClient) writeJSON(value interface{}) error {
	client.writeMu.Lock()
	defer client.writeMu.Unlock()
	return client.conn.WriteJSON(value)
}

var (
	userSockets   = make(map[int]*socketClient)
	userSocketsMu sync.RWMutex
)

func ChatHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	cookie, err := r.Cookie("session_id")
	if err != nil {
		http.Error(w, "No active session", http.StatusUnauthorized)
		return
	}
	userID := getUserIDFromSessionID(cookie.Value)

	sender, receiver, err := getChatInfoFromURL(r)
	if err != nil {
		http.Error(w, "Page Not Found", http.StatusNotFound)
		return
	}
	valid, err := accountInfo(sender, receiver, userID)
	if err != nil || !valid {
		http.Error(w, "Page Not Found", http.StatusNotFound)
		return
	}
	Template(w)
}

func accountInfo(sender, receiver, userID int) (bool, error) {
	var senderCount, receiverCount int
	query := "SELECT COUNT(*) FROM accounts WHERE id = ?"
	if err := Accountsdb.QueryRow(query, sender).Scan(&senderCount); err != nil {
		return false, err
	}
	if senderCount == 0 {
		return false, fmt.Errorf("sender account not found")
	}
	if err := Accountsdb.QueryRow(query, receiver).Scan(&receiverCount); err != nil {
		return false, err
	}
	if receiverCount == 0 {
		return false, fmt.Errorf("receiver account not found")
	}
	return receiver != userID && sender == userID, nil
}

func getChatInfoFromURL(r *http.Request) (int, int, error) {
	senderIDStr := r.URL.Query().Get("Sender")
	receiverIDStr := r.URL.Query().Get("Receiver")
	if senderIDStr == "" || receiverIDStr == "" {
		return 0, 0, fmt.Errorf("missing sender or receiver ID")
	}

	senderID, err := strconv.Atoi(senderIDStr)
	if err != nil {
		return 0, 0, fmt.Errorf("invalid sender ID: %w", err)
	}
	receiverID, err := strconv.Atoi(receiverIDStr)
	if err != nil {
		return 0, 0, fmt.Errorf("invalid receiver ID: %w", err)
	}
	return senderID, receiverID, nil
}

func WsConn(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("session_id")
	if err != nil {
		http.Error(w, "No active session", http.StatusUnauthorized)
		return
	}
	userID := getUserIDFromSessionID(cookie.Value)
	if userID == 0 {
		http.Error(w, "Invalid session", http.StatusUnauthorized)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade failed: %v", err)
		return
	}

	client := &socketClient{conn: conn}
	previous := setUserSocket(userID, client)
	if previous != nil {
		_ = previous.conn.Close()
	}

	defer func() {
		removed := removeUserSocket(userID, client)
		_ = conn.Close()
		if removed {
			UpdateOnlineUsers()
		}
	}()

	UpdateOnlineUsers()
	log.Printf("WebSocket connected for user %d", userID)

	for {
		var request WSRequest
		if err := conn.ReadJSON(&request); err != nil {
			if !websocket.IsCloseError(err, websocket.CloseGoingAway, websocket.CloseNormalClosure) {
				log.Printf("WebSocket read failed for user %d: %v", userID, err)
			}
			return
		}

		switch request.Type {
		case "send_message":
			if err := handleSendMessage(client, userID, request.Content); err != nil {
				log.Printf("send_message failed for user %d: %v", userID, err)
				return
			}
		case "notification":
			var content NotificationContent
			if err := decodeWSContent(request.Content, &content); err != nil {
				log.Printf("notification payload failed for user %d: %v", userID, err)
				return
			}
			content.Sender = userID
			UpdateNotification(content.Sender, content.Receiver)
			UpdateUsers([]int{content.Sender, content.Receiver})
		case "load_messages":
			if err := handleLoadMessages(client, userID, request.Content); err != nil {
				log.Printf("load_messages failed for user %d: %v", userID, err)
				return
			}
		}
	}
}

func handleSendMessage(client *socketClient, userID int, raw interface{}) error {
	var content SendMessageContent
	if err := decodeWSContent(raw, &content); err != nil {
		return err
	}
	content.Sender = userID
	currentTime := time.Now()

	id, err := AddChat(content.Text, content.Sender, content.Receiver, currentTime)
	if err != nil {
		return err
	}

	response := WSRequest{
		Type: "send_message",
		Content: struct {
			ID        int64     `json:"ID"`
			Receiver  int       `json:"Receiver"`
			Sender    int       `json:"Sender"`
			Text      string    `json:"Text"`
			Timestamp time.Time `json:"Time"`
		}{
			ID:        id,
			Receiver:  content.Receiver,
			Sender:    content.Sender,
			Text:      content.Text,
			Timestamp: currentTime,
		},
	}

	if err := client.writeJSON(response); err != nil {
		return err
	}
	if recipient := getUserSocket(content.Receiver); recipient != nil {
		if err := recipient.writeJSON(response); err != nil {
			log.Printf("message delivery to user %d failed: %v", content.Receiver, err)
		}
	}
	UpdateUsers([]int{content.Sender, content.Receiver})
	return nil
}

func handleLoadMessages(client *socketClient, userID int, raw interface{}) error {
	var content LoadMessagesContent
	if err := decodeWSContent(raw, &content); err != nil {
		return err
	}
	content.Sender = userID

	chatMessages, err := LoadMessages(content.Sender, content.Receiver, content.Scroll)
	if err != nil {
		return err
	}
	messages := make([]interface{}, 0, len(chatMessages))
	for _, message := range chatMessages {
		messages = append(messages, message)
	}

	var receiverInfo RInfo
	if err := Accountsdb.QueryRow(
		"SELECT Username, UserImg FROM accounts WHERE id = ?",
		content.Receiver,
	).Scan(&receiverInfo.RUname, &receiverInfo.RPImg); err != nil {
		return err
	}

	return client.writeJSON(WSResponse{
		Type:  "load_messages",
		RInfo: receiverInfo,
		Data:  messages,
	})
}

func decodeWSContent(raw interface{}, target interface{}) error {
	contentBytes, err := json.Marshal(raw)
	if err != nil {
		return err
	}
	return json.Unmarshal(contentBytes, target)
}

func setUserSocket(userID int, client *socketClient) *socketClient {
	userSocketsMu.Lock()
	previous := userSockets[userID]
	userSockets[userID] = client
	userSocketsMu.Unlock()
	return previous
}

func getUserSocket(userID int) *socketClient {
	userSocketsMu.RLock()
	client := userSockets[userID]
	userSocketsMu.RUnlock()
	return client
}

func removeUserSocket(userID int, client *socketClient) bool {
	userSocketsMu.Lock()
	defer userSocketsMu.Unlock()
	if userSockets[userID] != client {
		return false
	}
	delete(userSockets, userID)
	return true
}

func disconnectUserSocket(userID int) {
	userSocketsMu.Lock()
	client := userSockets[userID]
	delete(userSockets, userID)
	userSocketsMu.Unlock()
	if client != nil {
		_ = client.conn.Close()
	}
}

func socketSnapshot() ([]int, map[int]*socketClient) {
	userSocketsMu.RLock()
	defer userSocketsMu.RUnlock()

	activeUsers := make([]int, 0, len(userSockets))
	clients := make(map[int]*socketClient, len(userSockets))
	for id, client := range userSockets {
		activeUsers = append(activeUsers, id)
		clients[id] = client
	}
	return activeUsers, clients
}

func UpdateUsers(users []int) {
	activeUsers, clients := socketSnapshot()
	for _, id := range users {
		client := clients[id]
		if client == nil {
			continue
		}
		otherUsers := GetOtherUsersData(id, activeUsers)
		if err := client.writeJSON(map[string]interface{}{
			"type":    "activeUsers",
			"Content": otherUsers,
		}); err != nil {
			log.Printf("active user update failed for user %d: %v", id, err)
		}
	}
}

func UpdateOnlineUsers() {
	activeUsers, clients := socketSnapshot()
	for id, client := range clients {
		otherUsers := GetOtherUsersData(id, activeUsers)
		if err := client.writeJSON(map[string]interface{}{
			"type":    "activeUsers",
			"Content": otherUsers,
		}); err != nil {
			log.Printf("online user update failed for user %d: %v", id, err)
		}
	}
}

func GetOtherUsersData(userID int, activeUsers []int) []User {
	rows, err := Accountsdb.Query(
		"SELECT id, Username, UserImg FROM accounts WHERE id != ?",
		userID,
	)
	if err != nil {
		log.Printf("failed to query users: %v", err)
		return nil
	}
	defer rows.Close()

	var friends []User
	var strangers []User
	for rows.Next() {
		var user User
		if err := rows.Scan(&user.UserId, &user.Username, &user.ProfileImg); err != nil {
			log.Printf("failed to scan user: %v", err)
			continue
		}
		user.MessageID, user.LastMessage = GetLastMessage(userID, user.UserId)
		if IsUserActive(user.UserId, activeUsers) {
			user.Status = "Online"
		} else {
			user.Status = "Offline"
		}
		user.Notifications = GetNumOfNotifications(user.UserId, userID)

		if user.LastMessage == "" {
			strangers = append(strangers, user)
		} else {
			friends = append(friends, user)
		}
	}
	if err := rows.Err(); err != nil {
		log.Printf("failed to iterate users: %v", err)
		return nil
	}
	return CombineUsers(friends, strangers)
}

func GetLastMessage(senderID, receiverID int) (int, string) {
	var id int
	var message string
	err := Accountsdb.QueryRow(`
		SELECT id, text FROM chat
		WHERE (Sender = ? AND Receiver = ?) OR (Sender = ? AND Receiver = ?)
		ORDER BY id DESC
		LIMIT 1`,
		senderID,
		receiverID,
		receiverID,
		senderID,
	).Scan(&id, &message)
	if err == sql.ErrNoRows {
		return 0, ""
	}
	if err != nil {
		log.Printf("failed to load last message: %v", err)
		return 0, ""
	}
	if len(message) > 20 {
		message = message[:20] + "..."
	}
	return id, message
}

func IsUserActive(userID int, activeUsers []int) bool {
	for _, id := range activeUsers {
		if id == userID {
			return true
		}
	}
	return false
}

func CombineUsers(friends []User, strangers []User) []User {
	sort.Slice(friends, func(i, j int) bool {
		return friends[i].MessageID > friends[j].MessageID
	})
	sort.Slice(strangers, func(i, j int) bool {
		return strings.ToLower(strangers[i].Username) < strings.ToLower(strangers[j].Username)
	})

	allUsers := make([]User, 0, len(friends)+len(strangers))
	allUsers = append(allUsers, friends...)
	allUsers = append(allUsers, strangers...)
	return allUsers
}

func LoadMessages(sender, receiver, scroll int) ([]Com, error) {
	query := `
		SELECT *
		FROM (
			SELECT * FROM chat
			WHERE (Sender = ? AND Receiver = ?) OR (Receiver = ? AND Sender = ?)
			ORDER BY id DESC
			LIMIT ?
		) sub
		ORDER BY id ASC`

	rows, err := Accountsdb.Query(query, sender, receiver, sender, receiver, scroll+10)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []Com
	for rows.Next() {
		var message Com
		if err := rows.Scan(
			&message.Id,
			&message.Sender,
			&message.Receiver,
			&message.Text,
			&message.Time,
		); err != nil {
			return nil, err
		}
		messages = append(messages, message)
	}
	return messages, rows.Err()
}

func AddChat(text string, sender, receiver int, sentAt time.Time) (int64, error) {
	result, err := Accountsdb.Exec(
		"INSERT INTO chat (Sender, Receiver, Text, Timestamp) VALUES (?, ?, ?, ?)",
		sender,
		receiver,
		text,
		sentAt,
	)
	if err != nil {
		return 0, err
	}
	return result.LastInsertId()
}
