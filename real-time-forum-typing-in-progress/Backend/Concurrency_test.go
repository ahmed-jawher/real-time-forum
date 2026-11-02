package forum

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
	"time"

	"golang.org/x/crypto/bcrypt"
)

func openSQLiteForTest(dataSourceName string) (*sql.DB, error) {
	return sql.Open("sqlite3", dataSourceName)
}

func TestSessionRegistryConcurrentAccess(t *testing.T) {
	sessionsMu.Lock()
	sessions = make(map[string]*Session)
	sessionsMu.Unlock()

	var wg sync.WaitGroup
	for i := 1; i <= 100; i++ {
		userID := i
		wg.Add(1)
		go func() {
			defer wg.Done()
			session := createSession(userID)
			if got := getUserIDFromSessionID(session.ID); got != userID {
				t.Errorf("session user ID = %d, want %d", got, userID)
			}
			revokeSession(session.ID)
		}()
	}
	wg.Wait()
}

func TestSocketRegistryConcurrentAccess(t *testing.T) {
	userSocketsMu.Lock()
	userSockets = make(map[int]*socketClient)
	userSocketsMu.Unlock()

	var wg sync.WaitGroup
	for i := 1; i <= 100; i++ {
		userID := i
		client := &socketClient{}
		wg.Add(1)
		go func() {
			defer wg.Done()
			setUserSocket(userID, client)
			if got := getUserSocket(userID); got != client {
				t.Errorf("socket client mismatch for user %d", userID)
			}
			removeUserSocket(userID, client)
		}()
	}
	wg.Wait()
}

func TestLoginInitializesHTTPOnlySession(t *testing.T) {
	originalDB := Accountsdb
	dbPath := fmt.Sprintf("file:login-test-%d?mode=memory&cache=shared", time.Now().UnixNano())
	db, err := openSQLiteForTest(dbPath)
	if err != nil {
		t.Fatal(err)
	}
	defer func() {
		Accountsdb = originalDB
		sessionsMu.Lock()
		sessions = make(map[string]*Session)
		sessionsMu.Unlock()
		db.Close()
	}()
	Accountsdb = db

	if _, err := db.Exec(`CREATE TABLE accounts (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		Email TEXT,
		Username TEXT UNIQUE,
		Password TEXT,
		UserImg TEXT DEFAULT 'ProfileImage.png'
	)`); err != nil {
		t.Fatal(err)
	}
	hash, err := bcrypt.GenerateFromPassword([]byte("correct-password"), bcrypt.MinCost)
	if err != nil {
		t.Fatal(err)
	}
	if _, err := db.Exec(
		"INSERT INTO accounts (Email, Username, Password) VALUES (?, ?, ?)",
		"user@example.com",
		"test-user",
		string(hash),
	); err != nil {
		t.Fatal(err)
	}

	request := httptest.NewRequest(
		http.MethodPost,
		"/",
		strings.NewReader(`{"username":"test-user","password":"correct-password"}`),
	)
	request.Header.Set("Content-Type", "application/json")
	response := httptest.NewRecorder()

	Login(response, request)

	if response.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d; body=%q", response.Code, http.StatusOK, response.Body.String())
	}
	cookies := response.Result().Cookies()
	if len(cookies) != 1 {
		t.Fatalf("cookie count = %d, want 1", len(cookies))
	}
	if cookies[0].Name != "session_id" || !cookies[0].HttpOnly {
		t.Fatalf("session cookie was not initialized as HttpOnly: %#v", cookies[0])
	}

	var body map[string]interface{}
	if err := json.NewDecoder(response.Body).Decode(&body); err != nil {
		t.Fatal(err)
	}
	if _, exposed := body["sessionId"]; exposed {
		t.Fatal("session ID must not be exposed in the JSON response")
	}
	if authenticated, ok := body["authenticated"].(bool); !ok || !authenticated {
		t.Fatalf("unexpected response body: %#v", body)
	}
}

func TestSignUpInitializesHTTPOnlySession(t *testing.T) {
	originalDB := Accountsdb
	dbPath := fmt.Sprintf("file:signup-test-%d?mode=memory&cache=shared", time.Now().UnixNano())
	db, err := openSQLiteForTest(dbPath)
	if err != nil {
		t.Fatal(err)
	}
	defer func() {
		Accountsdb = originalDB
		sessionsMu.Lock()
		sessions = make(map[string]*Session)
		sessionsMu.Unlock()
		db.Close()
	}()
	Accountsdb = db

	if _, err := db.Exec(`CREATE TABLE accounts (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		Email TEXT,
		Username TEXT UNIQUE,
		FirstName TEXT,
		LastName TEXT,
		Password TEXT,
		Age TEXT,
		Gender TEXT,
		UserImg TEXT DEFAULT 'ProfileImage.png'
	)`); err != nil {
		t.Fatal(err)
	}

	request := httptest.NewRequest(
		http.MethodPost,
		"/SignUp",
		strings.NewReader(`{
			"email":"new@example.com",
			"username":"new-user",
			"FirstName":"New",
			"LastName":"User",
			"Age":"18",
			"Gender":"other",
			"password":"Password1!",
			"ConfirmPassword":"Password1!"
		}`),
	)
	request.Header.Set("Content-Type", "application/json")
	response := httptest.NewRecorder()

	SignUpHandler(response, request)

	if response.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d; body=%q", response.Code, http.StatusOK, response.Body.String())
	}
	cookies := response.Result().Cookies()
	if len(cookies) != 1 || cookies[0].Name != "session_id" || !cookies[0].HttpOnly {
		t.Fatalf("session cookie was not initialized as HttpOnly: %#v", cookies)
	}

	var body map[string]interface{}
	if err := json.NewDecoder(response.Body).Decode(&body); err != nil {
		t.Fatal(err)
	}
	if _, exposed := body["sessionId"]; exposed {
		t.Fatal("session ID must not be exposed in the JSON response")
	}
	if authenticated, ok := body["authenticated"].(bool); !ok || !authenticated {
		t.Fatalf("unexpected response body: %#v", body)
	}
}
