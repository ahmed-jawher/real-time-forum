package forum

import (
	"errors"
	"fmt"
	"html/template"
	"io"
	"net/http"
	"os"
	"regexp"

	"github.com/google/uuid"
	_ "github.com/mattn/go-sqlite3"
)

func Template(w http.ResponseWriter) {
	tmpl, err := template.ParseFiles("Pages/forum.html")
	if err != nil {
		http.Error(w, "Error parsing template", http.StatusInternalServerError)
		return
	}
	if err := tmpl.Execute(w, nil); err != nil {
		http.Error(w, "Error executing template", http.StatusInternalServerError)
	}
}

func isValidEmail(email string) bool {
	// Regular expression pattern for email validation
	pattern := `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`

	// Create a regular expression object
	r := regexp.MustCompile(pattern)

	// Match the email against the pattern
	return r.MatchString(email)
}

func isValidString(str string) bool {
	match, _ := regexp.MatchString("^[a-zA-Z0-9!@#$%^&*()-_=+,.?/:;{}|~<>]+$", str)
	return match
}

func generateSessionID() string {
	// Generate a unique session ID using UUID
	sessionID := uuid.New().String()
	return sessionID
}

func GetUserData(r *http.Request) (Account, error) {
	var user Account
	sessionCookie, err := r.Cookie("session_id")
	if err != nil {
		return user, err
	}

	user.Id = getUserIDFromSessionID(sessionCookie.Value)
	if user.Id == 0 {
		return user, errors.New("invalid or expired session")
	}

	err = Accountsdb.QueryRow("SELECT Email, Username, UserImg FROM accounts WHERE id = ?", user.Id).
		Scan(&user.Email, &user.Username, &user.ProfileImg)
	if err != nil {
		return Account{}, err
	}
	return user, nil
}

func getIDBySessionID(sessionid string) (int, error) {
	// Prepare the SQL query
	query := "SELECT id FROM accounts WHERE SessionID = ?"

	// Execute the query and retrieve the result
	row := Accountsdb.QueryRow(query, sessionid)

	// Scan the result into a string variable
	ID := 0
	err := row.Scan(&ID)
	if err != nil {
		return 0, err
	}

	return ID, nil
}

func ProfileImageHandler(w http.ResponseWriter, r *http.Request) {
	user, err := GetUserData(r)
	if err != nil {
		http.Error(w, "Unable to load account", http.StatusUnauthorized)
		return
	}
	// Parse the multipart form data
	err = r.ParseMultipartForm(32 << 20) // Set the maximum file size
	if err != nil {
		http.Error(w, "Failed to parse form data", http.StatusBadRequest)
		return
	}
	file, handler, err := r.FormFile("PImg") // Get the uploaded file
	if err != nil {
		http.Error(w, "Failed to retrieve file", http.StatusBadRequest)
		return
	}
	defer file.Close()

	var imgPath string
	if file != nil {
		// Save the image file
		imgPath = "ProfileImages/" + handler.Filename
		distinationFile, err := os.OpenFile(imgPath, os.O_WRONLY|os.O_CREATE, 0666)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		defer distinationFile.Close()
		if _, err := io.Copy(distinationFile, file); err != nil {
			http.Error(w, "Failed to save file", http.StatusInternalServerError)
			return
		}
	} else {
		imgPath = ""
	}
	_, err = Accountsdb.Exec(`UPDATE accounts SET UserImg = ? WHERE id= ? `, handler.Filename, user.Id)
	if err != nil {
		http.Error(w, "Failed to update account image", http.StatusInternalServerError)
		return
	}

	_, err = Commentsdb.Exec(`UPDATE comments SET ProfileImage = ? WHERE user_id= ? `, handler.Filename, user.Id)
	if err != nil {
		http.Error(w, "Failed to update comment images", http.StatusInternalServerError)
		return
	}
	_, err = Postsdb.Exec(`UPDATE posts SET userImg = ? WHERE user_id= ? `, handler.Filename, user.Id)
	if err != nil {
		http.Error(w, "Failed to update post images", http.StatusInternalServerError)
		return
	}
	// Send a response back to the client
	fmt.Fprintf(w, "File uploaded successfully.")

}
