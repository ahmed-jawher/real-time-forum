package forum

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
)

type HomeTemplateData struct {
	Posts      []Post
	UserId     int
	Username   string
	ProfileImg string
	LikedPosts []string
}

func HomeHandler(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/HomePage" {
		http.Error(w, "Page Not Found", http.StatusNotFound)
		return
	}

	user, err := GetUserData(r)
	if err != nil {
		http.Error(w, "Unable to load account", http.StatusUnauthorized)
		return
	}

	if r.Method != http.MethodPost {
		Template(w)
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

	var categories []string
	if request.RequestType != "" && request.RequestType != "Data" {
		categories = strings.Fields(request.RequestType)
	}

	data, err := constructPage(user, categories)
	if err != nil {
		http.Error(w, "Failed to load forum data", http.StatusInternalServerError)
		return
	}

	if request.RequestType == "" || request.RequestType == "Data" {
		UpdateUsers([]int{user.Id})
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(data); err != nil {
		http.Error(w, "Failed to encode forum data", http.StatusInternalServerError)
	}
}

func constructPage(user Account, categories []string) (HomeTemplateData, error) {
	posts, err := fetchPostsFromDB(len(categories) > 0, "Categories", categories)
	if err != nil {
		return HomeTemplateData{}, err
	}
	reverseArray(posts)

	_, _, likedPosts, err := GetLikedPosts(user.Id)
	if err != nil {
		return HomeTemplateData{}, err
	}

	return HomeTemplateData{
		Posts:      posts,
		UserId:     user.Id,
		Username:   user.Username,
		ProfileImg: user.ProfileImg,
		LikedPosts: likedPosts,
	}, nil
}

func fetchPostsFromDB(filtered bool, filterType string, filters []string) ([]Post, error) {
	baseQuery := "SELECT post_id, user_id, username, userImg, title, content, image, category, like, dislike, timestamp FROM posts"
	query := baseQuery
	var args []interface{}

	if filtered {
		switch filterType {
		case "ProfileFilter":
			if len(filters) == 0 {
				return []Post{}, nil
			}
			placeholders := make([]string, len(filters))
			for i, id := range filters {
				placeholders[i] = "?"
				args = append(args, id)
			}
			query += " WHERE post_id IN (" + strings.Join(placeholders, ",") + ")"
		case "Categories":
			if len(filters) == 0 {
				return []Post{}, nil
			}
			conditions := make([]string, len(filters))
			for i, category := range filters {
				conditions[i] = "category LIKE ?"
				args = append(args, "%"+category+"%")
			}
			query += " WHERE " + strings.Join(conditions, " OR ")
		default:
			return nil, fmt.Errorf("unsupported filter type %q", filterType)
		}
	}

	rows, err := Postsdb.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query posts: %w", err)
	}
	defer rows.Close()

	var posts []Post
	for rows.Next() {
		var post Post
		var category string
		if err := rows.Scan(
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
		); err != nil {
			return nil, fmt.Errorf("failed to scan post: %w", err)
		}
		post.Category = strings.Fields(category)
		posts = append(posts, post)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("failed to iterate posts: %w", err)
	}
	return posts, nil
}

func HandleLikeRequest(user Account, request Request) error {
	if request.Type != "Like" && request.Type != "Dislike" {
		return fmt.Errorf("invalid reaction type")
	}

	tx, err := Postsdb.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	delta := -1
	if request.Checked {
		delta = 1
	}

	if _, err := tx.Exec(
		"UPDATE posts SET "+request.Type+" = MAX("+request.Type+" + ?, 0) WHERE post_id = ?",
		delta,
		request.ID,
	); err != nil {
		return err
	}

	if request.Checked {
		_, err = tx.Exec(
			"INSERT INTO LikedPosts (user_id, post_id, type) VALUES (?, ?, ?)",
			user.Id,
			request.ID,
			request.Type,
		)
	} else {
		_, err = tx.Exec(
			"DELETE FROM LikedPosts WHERE user_id = ? AND post_id = ? AND type = ?",
			user.Id,
			request.ID,
			request.Type,
		)
	}
	if err != nil {
		return err
	}

	return tx.Commit()
}

func GetLikedPosts(id int) ([]string, []string, []string, error) {
	var likedPostIDs []string
	var dislikedPostIDs []string
	var likedPosts []string

	rows, err := Postsdb.Query("SELECT post_id, type FROM LikedPosts WHERE user_id = ?", id)
	if err != nil {
		return nil, nil, nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var postID int
		var reactionType string
		if err := rows.Scan(&postID, &reactionType); err != nil {
			return nil, nil, nil, err
		}

		idString := strconv.Itoa(postID)
		if reactionType == "Like" {
			likedPosts = append(likedPosts, "Like_"+idString)
			likedPostIDs = append(likedPostIDs, idString)
		} else {
			likedPosts = append(likedPosts, "Dislike_"+idString)
			dislikedPostIDs = append(dislikedPostIDs, idString)
		}
	}

	if err := rows.Err(); err != nil {
		return nil, nil, nil, err
	}
	return likedPostIDs, dislikedPostIDs, likedPosts, nil
}

func reverseArray(posts []Post) {
	for i := 0; i < len(posts)/2; i++ {
		posts[i], posts[len(posts)-i-1] = posts[len(posts)-i-1], posts[i]
	}
}
