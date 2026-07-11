package forum

import (
	"database/sql"
	"encoding/json"
	"errors"
	_ "github.com/mattn/go-sqlite3"
	"golang.org/x/crypto/bcrypt"
	"net/http"
	"time"
)

func Login(w http.ResponseWriter, r *http.Request) {

	if r.URL.Path != "/" {
		Template(w)
		return
	}

	if r.Method == "POST" {
		var account LoginData

		err := json.NewDecoder(r.Body).Decode(&account)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		errorMessage := ""

		// check if account Exists
		exists, err := AccountExists(account.Username)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		if account.Username == "" || account.Password == "" {
			errorMessage = "Please Fill All The Boxes"
		} else if !exists {
			errorMessage = "This Account Does Not Exist. Please Try Again"
		} else {
			var password string
			ID, err := GetAccountID(account.Username)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			if ID == 0 {
				errorMessage = "This Account Does Not Exist. Please Try Again"
			} else {
				err := Accountsdb.QueryRow("SELECT Password FROM accounts WHERE id = ?", ID).Scan(&password)
				if err != nil {
					http.Error(w, err.Error(), http.StatusInternalServerError)
					return
				}
				if !decryption(account.Password, password) {
					errorMessage = "Wrong password"
				} else {
					session := createSession(ID)
					http.SetCookie(w, &http.Cookie{
						Name:     "session_id",
						Value:    session.ID,
						HttpOnly: true,
						Secure:   r.TLS != nil,
						SameSite: http.SameSiteLaxMode,
						Path:     "/",
						Expires:  session.ExpiresAt,
					})
					w.Header().Set("Content-Type", "application/json")
					if err := json.NewEncoder(w).Encode(map[string]bool{"authenticated": true}); err != nil {
						http.Error(w, err.Error(), http.StatusInternalServerError)
					}
					return
				}
			}
		}

		if errorMessage != "" {
			http.Error(w, errorMessage, http.StatusInternalServerError)
			return
		}

	} else {
		Template(w)
	}
}

func Error(w http.ResponseWriter, r *http.Request) {

	w.Header().Set("Content-Type", "application/json")
	//http.Error(w, "Page Not Found", 404)

	errorResponse := ErrorResponse{
		Code:    http.StatusNotFound,
		Message: "Page Not Found",
	}

	err := json.NewEncoder(w).Encode(errorResponse)
	if err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	//Template(w)
}

func encryption(password string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(hash), err
}

func decryption(providedPassword string, hashedPassword string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(providedPassword))
	return err == nil
}

func AccountExists(user string) (bool, error) {
	query := "SELECT COUNT(*) FROM accounts WHERE Email = ? OR Username = ?"
	row := Accountsdb.QueryRow(query, user, user)
	var count int
	err := row.Scan(&count)
	if err != nil {
		return false, err
	}

	return count > 0, nil
}

func SessionID(ID int, sessionID string, expt time.Time) error {
	updateQuery := "UPDATE accounts SET SessionID = ?, Expiration = ? WHERE id = ?"
	_, err := Accountsdb.Exec(updateQuery, sessionID, expt, ID)
	if err != nil {
		return err
	}
	return nil
}

func GetAccountID(user string) (int, error) {
	// Prepare the SQL statement
	query := "SELECT id FROM accounts WHERE Email = ? OR Username = ?"
	stmt, err := Accountsdb.Prepare(query)
	if err != nil {
		return 0, err
	}
	defer stmt.Close()

	// Execute the query and get the account ID
	var accountID int
	err = stmt.QueryRow(user, user).Scan(&accountID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			// Account does not exist
			return 0, nil
		}
		return 0, err
	}

	return accountID, nil
}
