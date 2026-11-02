package forum

import (
	"database/sql"
	"log"
	"encoding/json"
	"net/http"
)


func NotificationsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == "POST" {
		var request Notifications
		if r.Header.Get("Content-Type") == "application/json" {
			err := json.NewDecoder(r.Body).Decode(&request)
			if err != nil {
				http.Error(w, "Failed to decode JSON request", http.StatusBadRequest)
				return
			}
			ResetNotifications(request.SenderID, request.ReceiverID)
		}
	}else {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}
}

func UpdateNotification(senderId int, receiverId int) {
	// Check if notification already exists
	var numNotifications int
	err := Notificationsdb.QueryRow(`
	  SELECT num_notifications FROM Notifications
	  WHERE sender_id=? AND receiver_id=?`,
		senderId, receiverId).Scan(&numNotifications)

	if err != nil {
		if err == sql.ErrNoRows {
			_, err = Notificationsdb.Exec(`
		INSERT INTO Notifications(sender_id, receiver_id, num_notifications)
		VALUES (?, ?, 1)`,
				senderId, receiverId)
		} else {
			log.Fatal(err)
		}
	} else {
		_, err = Notificationsdb.Exec(`
	  UPDATE Notifications 
	  SET num_notifications=? 
	  WHERE sender_id=? AND receiver_id=?`,
			numNotifications+1, senderId, receiverId)
	}
	if err != nil {
		log.Fatal(err)
	}
}

func GetNumOfNotifications(senderId int, receiverId int) int {
	var numNotifications int
	err := Notificationsdb.QueryRow(`
	  SELECT num_notifications 
	  FROM Notifications
	  WHERE sender_id=? AND receiver_id=?`,
		senderId, receiverId).Scan(&numNotifications)

	if err != nil {
		if err == sql.ErrNoRows {
			return 0
		} else {
			log.Fatal(err)
		}
	}

	return numNotifications
}

func ResetNotifications(senderId int, receiverId int) {
	// Update specific row
	_, err := Notificationsdb.Exec(`
	  UPDATE Notifications
	  SET num_notifications = 0
	  WHERE sender_id = ? AND receiver_id = ?
	`, senderId, receiverId)

	if err != nil {
		log.Fatal(err)
	}
}
