package forum

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"
)

var (
	errPostNotFound   = errors.New("post not found")
	errDeleteNotOwned = errors.New("post is not owned by user")
)

func PostHandler(w http.ResponseWriter, r *http.Request) {
	user, err := GetUserData(r)
	if err != nil {
		http.Error(w, "Unable to load account", http.StatusUnauthorized)
		return
	}

	if r.Method == http.MethodGet {
		Template(w)
		return
	}
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	if r.Header.Get("Content-Type") != "application/json" {
		http.Error(w, "Unsupported content type", http.StatusUnsupportedMediaType)
		return
	}

	var request Request
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, "Failed to decode JSON request", http.StatusBadRequest)
		return
	}

	switch request.RequestType {
	case "Data":
		handleDataRequest(w, r, user)
	case "like":
		if err := HandleLikeRequest(user, request); err != nil {
			http.Error(w, "Failed to update reaction", http.StatusInternalServerError)
		}
	case "delete":
		if err := HandleDeleteRequest(user.Id, request); errors.Is(err, errPostNotFound) {
			http.Error(w, "Post not found", http.StatusNotFound)
		} else if errors.Is(err, errDeleteNotOwned) {
			http.Error(w, "Forbidden", http.StatusForbidden)
		} else if err != nil {
			http.Error(w, "Failed to delete post", http.StatusInternalServerError)
		}
	case "DeleteComment":
		if err := HandleDeleteCommentRequest(request); err != nil {
			http.Error(w, "Failed to delete comment", http.StatusInternalServerError)
		}
	case "UpdateComment":
		if err := HandleUpdateCommentRequest(request); err != nil {
			http.Error(w, "Failed to update comment", http.StatusInternalServerError)
		}
	default:
		http.Error(w, "Invalid request type", http.StatusBadRequest)
	}
}

func handleDataRequest(w http.ResponseWriter, r *http.Request, user Account) {
	postID, err := getPostIDFromURL(r)
	if err != nil {
		http.Error(w, "Page Not Found", http.StatusNotFound)
		return
	}

	post, err := getPost(postID)
	if errors.Is(err, sql.ErrNoRows) {
		http.Error(w, "Page Not Found", http.StatusNotFound)
		return
	}
	if err != nil {
		http.Error(w, "Failed to load post", http.StatusInternalServerError)
		return
	}

	isLiked, isDisliked, err := getPostReactionState(user.Id, postID)
	if err != nil {
		http.Error(w, "Failed to load reaction state", http.StatusInternalServerError)
		return
	}

	isCreated, err := isPostCreatedBy(user.Id, postID)
	if err != nil {
		http.Error(w, "Failed to load post ownership", http.StatusInternalServerError)
		return
	}

	data := PostTemplateData{
		Username:        user.Username,
		ProfileImg:      user.ProfileImg,
		Post:            post,
		IsLiked:         isLiked,
		IsDisliked:      isDisliked,
		IsCreated:       isCreated,
		LikedComments:   GetLikedComments(user.Id, postID),
		CreatedComments: GetCreatedComments(user.Id, postID),
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(data); err != nil {
		http.Error(w, "Failed to encode post data", http.StatusInternalServerError)
	}
}

func getPost(postID int) (Post, error) {
	var post Post
	var category string
	query := `SELECT post_id, user_id, username, userImg, title, content, image, category, like, dislike, timestamp
		FROM posts
		WHERE post_id = ?`

	err := Postsdb.QueryRow(query, postID).Scan(
		&post.PostId,
		&post.UserId,
		&post.UserName,
		&post.UserImg,
		&post.Title,
		&post.Content,
		&post.Image,
		&category,
		&post.Like,
		&post.Dislike,
		&post.Time,
	)
	if err != nil {
		return Post{}, err
	}
	post.Category = strings.Fields(category)

	rows, err := Commentsdb.Query(
		"SELECT comment_id, userName, text, ProfileImage, timestamp, CLike, CDislike FROM comments WHERE post_id = ?",
		post.PostId,
	)
	if err != nil {
		return Post{}, fmt.Errorf("failed to query comments: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var comment Comment
		if err := rows.Scan(
			&comment.CommentId,
			&comment.UserName,
			&comment.Text,
			&comment.ProfileImage,
			&comment.Time,
			&comment.CLike,
			&comment.CDislike,
		); err != nil {
			return Post{}, fmt.Errorf("failed to scan comment: %w", err)
		}
		post.Comments = append(post.Comments, comment)
	}
	if err := rows.Err(); err != nil {
		return Post{}, err
	}
	return post, nil
}

func getPostIDFromURL(r *http.Request) (int, error) {
	segments := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(segments) != 2 || segments[0] != "Post" {
		return 0, errors.New("invalid post path")
	}
	return strconv.Atoi(segments[1])
}

func getPostReactionState(userID, postID int) (bool, bool, error) {
	var reactionType string
	err := Postsdb.QueryRow(
		"SELECT type FROM LikedPosts WHERE user_id = ? AND post_id = ?",
		userID,
		postID,
	).Scan(&reactionType)
	if errors.Is(err, sql.ErrNoRows) {
		return false, false, nil
	}
	if err != nil {
		return false, false, err
	}
	return reactionType == "Like", reactionType == "Dislike", nil
}

func isPostCreatedBy(userID, postID int) (bool, error) {
	var creatorID int
	if err := Postsdb.QueryRow(
		"SELECT user_id FROM posts WHERE post_id = ?",
		postID,
	).Scan(&creatorID); err != nil {
		return false, err
	}
	return creatorID == userID, nil
}

func HandleDeleteRequest(userID int, request Request) error {
	var ownerID int
	err := Postsdb.QueryRow(
		"SELECT user_id FROM posts WHERE post_id = ?",
		request.ID,
	).Scan(&ownerID)
	if errors.Is(err, sql.ErrNoRows) {
		return errPostNotFound
	}
	if err != nil {
		return err
	}
	if ownerID != userID {
		return errDeleteNotOwned
	}

	tx, err := Postsdb.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if _, err := tx.Exec("DELETE FROM LikedPosts WHERE post_id = ?", request.ID); err != nil {
		return err
	}
	if _, err := tx.Exec("DELETE FROM posts WHERE post_id = ?", request.ID); err != nil {
		return err
	}
	return tx.Commit()
}
