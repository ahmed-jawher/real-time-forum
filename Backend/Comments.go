package forum

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
)

type Payload struct {
	Message      string `json:"message"`
	PostId       int    `json:"postId"`
	Username     string `json:"username"`
	ProfileImage string `json:"profileImage"`
}

type CommentResponse struct {
	CommentId int64 `json:"CommentId"`
}

func CommentHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	user, err := GetUserData(r)
	if err != nil {
		http.Error(w, "Unable to load account", http.StatusUnauthorized)
		return
	}

	var payload Payload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}
	if payload.Message == "" || payload.PostId <= 0 {
		http.Error(w, "Comment text and post are required", http.StatusBadRequest)
		return
	}

	result, err := Commentsdb.Exec(
		"INSERT INTO comments (user_id, userName, post_id, text, ProfileImage) VALUES (?, ?, ?, ?, ?)",
		user.Id,
		user.Username,
		payload.PostId,
		payload.Message,
		user.ProfileImg,
	)
	if err != nil {
		http.Error(w, "Failed to create comment", http.StatusInternalServerError)
		return
	}

	commentID, err := result.LastInsertId()
	if err != nil {
		http.Error(w, "Failed to read comment ID", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(CommentResponse{CommentId: commentID}); err != nil {
		http.Error(w, "Error encoding response", http.StatusInternalServerError)
	}
}

func CommentLikeHandle(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	user, err := GetUserData(r)
	if err != nil {
		http.Error(w, "Unable to load account", http.StatusUnauthorized)
		return
	}

	var request Request
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}
	if request.Type != "Like" && request.Type != "Dislike" {
		http.Error(w, "Invalid reaction type", http.StatusBadRequest)
		return
	}

	tx, err := Commentsdb.Begin()
	if err != nil {
		http.Error(w, "Failed to update reaction", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	delta := -1
	if request.Checked {
		delta = 1
	}
	if _, err := tx.Exec(
		"UPDATE comments SET C"+request.Type+" = MAX(C"+request.Type+" + ?, 0) WHERE comment_id = ?",
		delta,
		request.ID,
	); err != nil {
		http.Error(w, "Failed to update reaction", http.StatusInternalServerError)
		return
	}

	if request.Checked {
		_, err = tx.Exec(
			"INSERT INTO Likedcomments (user_id, comment_id, type) VALUES (?, ?, ?)",
			user.Id,
			request.ID,
			request.Type,
		)
	} else {
		_, err = tx.Exec(
			"DELETE FROM Likedcomments WHERE user_id = ? AND comment_id = ? AND type = ?",
			user.Id,
			request.ID,
			request.Type,
		)
	}
	if err != nil {
		http.Error(w, "Failed to save reaction", http.StatusInternalServerError)
		return
	}
	if err := tx.Commit(); err != nil {
		http.Error(w, "Failed to save reaction", http.StatusInternalServerError)
	}
}

func GetLikedComments(userID, postID int) []string {
	rows, err := Commentsdb.Query(
		`SELECT lc.comment_id, lc.type
		FROM Likedcomments lc
		JOIN comments c ON c.comment_id = lc.comment_id
		WHERE lc.user_id = ? AND c.post_id = ?`,
		userID,
		postID,
	)
	if err != nil {
		return nil
	}
	defer rows.Close()

	var likedComments []string
	for rows.Next() {
		var commentID int
		var reactionType string
		if err := rows.Scan(&commentID, &reactionType); err != nil {
			return nil
		}
		prefix := "CDislike_"
		if reactionType == "Like" {
			prefix = "CLike_"
		}
		likedComments = append(likedComments, prefix+strconv.Itoa(commentID))
	}
	return likedComments
}

func GetCreatedComments(userID, postID int) []string {
	rows, err := Commentsdb.Query(
		"SELECT comment_id FROM comments WHERE user_id = ? AND post_id = ?",
		userID,
		postID,
	)
	if err != nil {
		return nil
	}
	defer rows.Close()

	var commentIDs []string
	for rows.Next() {
		var commentID int
		if err := rows.Scan(&commentID); err != nil {
			return nil
		}
		commentIDs = append(commentIDs, strconv.Itoa(commentID))
	}
	return commentIDs
}

func HandleDeleteCommentRequest(request Request) error {
	if _, err := Commentsdb.Exec(
		"DELETE FROM comments WHERE comment_id = ?",
		request.ID,
	); err != nil {
		return err
	}
	_, err := Commentsdb.Exec(
		"DELETE FROM Likedcomments WHERE comment_id = ?",
		request.ID,
	)
	return err
}

func HandleUpdateCommentRequest(request Request) error {
	if request.Text == "" {
		return fmt.Errorf("comment text cannot be empty")
	}
	_, err := Commentsdb.Exec(
		"UPDATE comments SET text = ? WHERE comment_id = ?",
		request.Text,
		request.ID,
	)
	return err
}
