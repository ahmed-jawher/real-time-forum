package forum

// ---------------------------------------------------------------------------
// Typing-in-progress engine (self-contained).
//
// This file implements the whole "typing in progress" feature end-to-end on
// the server side, independently from the chat/messaging websocket:
//
//   - It owns a DEDICATED websocket endpoint: /typing-ws
//   - It uses a hub goroutine + channels to fan typing events out to the
//     right recipient in real time (Go routines + channels objective).
//   - It forwards the typist's name so the receiver can display who is typing.
//
// Nothing here depends on the messaging code; the only shared helpers used are
// the generic session lookup (getUserIDFromSessionID) and the accounts DB.
// ---------------------------------------------------------------------------

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

func encodeTypingFrame(frame typingOut) ([]byte, error) {
	return json.Marshal(frame)
}

// init wires the dedicated typing endpoint and starts the hub goroutine, so
// the feature registers itself without any change to main.go.
func init() {
	http.HandleFunc("/typing-ws", TypingWsConn)
	go typingHubInstance.run()
}

var typingUpgrader = websocket.Upgrader{
	ReadBufferSize:  512,
	WriteBufferSize: 512,
}

// typingIn is the frame the browser sends us: "I (the session user) am
// start/stop typing to <receiver>".
type typingIn struct {
	Type     string `json:"type"` // "start" | "stop"
	Receiver int    `json:"receiver"`
}

// typingOut is the frame we push to the receiver: who is typing and their name.
type typingOut struct {
	Type   string `json:"type"`   // "start" | "stop"
	Sender int    `json:"sender"` // the user that is typing
	Name   string `json:"name"`   // the typist's display name
}

type typingClient struct {
	userID int
	name   string
	conn   *websocket.Conn
	send   chan []byte
}

// typingRelay carries an already-encoded frame to a specific recipient.
type typingRelay struct {
	receiver int
	payload  []byte
}

// typingHub is the single owner of the connected-clients map. Only its run
// goroutine touches the map, so no mutex is needed: all mutations arrive as
// messages on channels (classic Go concurrency pattern).
type typingHub struct {
	clients    map[int]*typingClient
	register   chan *typingClient
	unregister chan *typingClient
	relay      chan typingRelay
}

var typingHubInstance = &typingHub{
	clients:    make(map[int]*typingClient),
	register:   make(chan *typingClient),
	unregister: make(chan *typingClient),
	relay:      make(chan typingRelay),
}

func (h *typingHub) run() {
	for {
		select {
		case client := <-h.register:
			// One socket per user: replace any previous connection.
			if previous := h.clients[client.userID]; previous != nil {
				close(previous.send)
			}
			h.clients[client.userID] = client

		case client := <-h.unregister:
			if current, ok := h.clients[client.userID]; ok && current == client {
				delete(h.clients, client.userID)
				close(client.send)
			}

		case message := <-h.relay:
			if client, ok := h.clients[message.receiver]; ok {
				// Non-blocking send: never let a slow/dead receiver stall
				// the hub. A dropped typing frame is harmless.
				select {
				case client.send <- message.payload:
				default:
				}
			}
		}
	}
}

// TypingWsConn upgrades the dedicated typing connection, authenticates the
// user from their session cookie, and runs a read pump + write pump goroutine
// pair for the lifetime of the socket.
func TypingWsConn(w http.ResponseWriter, r *http.Request) {
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

	var username string
	if err := Accountsdb.QueryRow(
		"SELECT Username FROM accounts WHERE id = ?", userID,
	).Scan(&username); err != nil {
		log.Printf("typing: failed to load username for user %d: %v", userID, err)
		return
	}

	conn, err := typingUpgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("typing: websocket upgrade failed: %v", err)
		return
	}

	client := &typingClient{
		userID: userID,
		name:   username,
		conn:   conn,
		send:   make(chan []byte, 8),
	}
	typingHubInstance.register <- client
	log.Printf("typing: connected user %d (%s)", userID, username)

	go client.writePump()
	client.readPump()
}

// readPump reads typing frames from the browser and relays them to the
// intended recipient through the hub. It blocks until the socket closes.
func (c *typingClient) readPump() {
	defer func() {
		typingHubInstance.unregister <- c
		_ = c.conn.Close()
	}()

	for {
		var in typingIn
		if err := c.conn.ReadJSON(&in); err != nil {
			return
		}
		if in.Type != "start" && in.Type != "stop" {
			continue
		}

		payload, err := encodeTypingFrame(typingOut{
			Type:   in.Type,
			Sender: c.userID,
			Name:   c.name,
		})
		if err != nil {
			log.Printf("typing: encode failed for user %d: %v", c.userID, err)
			continue
		}

		typingHubInstance.relay <- typingRelay{
			receiver: in.Receiver,
			payload:  payload,
		}
	}
}

// writePump drains the client's send channel to the socket. It ends when the
// hub closes the channel (on unregister/replacement).
func (c *typingClient) writePump() {
	for payload := range c.send {
		if err := c.conn.WriteMessage(websocket.TextMessage, payload); err != nil {
			return
		}
	}
	_ = c.conn.WriteMessage(websocket.CloseMessage, websocket.FormatCloseMessage(
		websocket.CloseNormalClosure, ""))
}
