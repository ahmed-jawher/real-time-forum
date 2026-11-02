package forum

import (
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

func CreatePostHandler(w http.ResponseWriter, r *http.Request) {

	if r.URL.Path != "/CreatePost" {
		http.Error(w, "Page Not Found", 404)
		return
	}

	user, err := GetUserData(r)
	if err != nil {
		http.Error(w, "Unable to load account", http.StatusUnauthorized)
		return
	}
	if r.Method == "POST" {
		// Parse the form data
		if err := r.ParseMultipartForm(32 << 20); err != nil {
			http.Error(w, "Error parsing form data", http.StatusBadRequest)
			return
		}

		// Get the uploaded image file
		file, handler, err := r.FormFile("file")
		if err != nil && err != http.ErrMissingFile {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		var imgPath string
		if file != nil {
			defer file.Close()
			// Save the image file
			imgPath = "Posts/" + filepath.Base(handler.Filename)
			distinationFile, err := os.OpenFile(imgPath, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, 0666)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			defer distinationFile.Close()
			if _, err := io.Copy(distinationFile, file); err != nil {
				http.Error(w, "Failed to save image", http.StatusInternalServerError)
				return
			}
		} else {
			imgPath = ""
		}

		// Get the Title and Content value
		title := r.FormValue("Title")
		content := r.FormValue("Content")

		// Get the selected checkboxes
		checkboxes := r.Form["checkbox"]
		// Now you can use the retrieved id and username variables as needed
		if err := InsertPost(user.Id, user.Username, user.ProfileImg, title, content, imgPath, strings.Join(checkboxes, ","), 0, 0); err != nil {
			http.Error(w, "Failed to create post", http.StatusInternalServerError)
		}
	} else {
		Template(w)
	}
}

func InsertPost(userID int, username string, userImg string, title string, content string, image string, category string, like int, dislike int) error {
	query := `
        INSERT INTO posts (user_id, username,userImg,title,content, image,category, like, dislike)
        VALUES (?, ?, ?, ?, ?,?,?,?,?)
    `

	_, err := Postsdb.Exec(query, userID, username, userImg, title, content, image, category, like, dislike)
	return err
}
