package forum

import (
	"net/http"
	"sync"
	"time"

	"github.com/google/uuid"
	_ "github.com/mattn/go-sqlite3"
)

type Session struct {
	ID        string
	UserID    int
	ExpiresAt time.Time
}

var (
	sessions   = make(map[string]*Session)
	sessionsMu sync.RWMutex
)

func LogoutHandler(w http.ResponseWriter, r *http.Request) {
	if cookie, err := r.Cookie("session_id"); err == nil {
		if session := getSession(cookie.Value); session != nil {
			disconnectUserSocket(session.UserID)
		}
		revokeSession(cookie.Value)
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "session_id",
		Value:    "",
		HttpOnly: true,
		Secure:   r.TLS != nil,
		SameSite: http.SameSiteLaxMode,
		Path:     "/",
		MaxAge:   -1,
		Expires:  time.Unix(1, 0),
	})

	UpdateOnlineUsers()
	http.Redirect(w, r, "/", http.StatusFound)
}

func AuthMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		sessionCookie, err := r.Cookie("session_id")
		if err != nil || !isSessionExisting(sessionCookie.Value) {
			http.Redirect(w, r, "/", http.StatusFound)
			return
		}
		next.ServeHTTP(w, r)
	}
}

func createSession(userID int) *Session {
	session := &Session{
		ID:        uuid.New().String(),
		UserID:    userID,
		ExpiresAt: time.Now().Add(24 * time.Hour),
	}

	sessionsMu.Lock()
	sessions[session.ID] = session
	sessionsMu.Unlock()
	return session
}

func getSession(sessionID string) *Session {
	sessionsMu.RLock()
	session, ok := sessions[sessionID]
	sessionsMu.RUnlock()
	if !ok || session.ExpiresAt.Before(time.Now()) {
		return nil
	}
	return session
}

func revokeSession(sessionID string) {
	sessionsMu.Lock()
	delete(sessions, sessionID)
	sessionsMu.Unlock()
}

func isSessionExisting(sessionID string) bool {
	return getSession(sessionID) != nil
}

func CleanupExpiredSessions() {
	now := time.Now()
	sessionsMu.Lock()
	defer sessionsMu.Unlock()
	for sessionID, session := range sessions {
		if session.ExpiresAt.Before(now) {
			delete(sessions, sessionID)
		}
	}
}

func revokeUserSessions(userID int) {
	sessionsMu.Lock()
	defer sessionsMu.Unlock()
	for sessionID, session := range sessions {
		if session.UserID == userID {
			delete(sessions, sessionID)
		}
	}
}

func getUserIDFromSessionID(sessionID string) int {
	session := getSession(sessionID)
	if session == nil {
		return 0
	}
	return session.UserID
}
