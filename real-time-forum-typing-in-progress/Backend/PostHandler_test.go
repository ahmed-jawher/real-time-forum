package forum

import (
	"database/sql"
	"errors"
	"fmt"
	"testing"
	"time"
)

func TestHandleDeleteRequestRequiresPostOwner(t *testing.T) {
	originalDB := Postsdb
	dbPath := fmt.Sprintf("file:delete-post-test-%d?mode=memory&cache=shared", time.Now().UnixNano())
	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		t.Fatal(err)
	}
	defer func() {
		Postsdb = originalDB
		db.Close()
	}()
	Postsdb = db

	if _, err := db.Exec(`
		CREATE TABLE posts (
			post_id INTEGER PRIMARY KEY,
			user_id INTEGER NOT NULL
		);
		CREATE TABLE LikedPosts (
			user_id INTEGER NOT NULL,
			post_id INTEGER NOT NULL,
			type TEXT NOT NULL
		);
		INSERT INTO posts (post_id, user_id) VALUES (7, 12);
		INSERT INTO LikedPosts (user_id, post_id, type) VALUES (21, 7, 'Like');
	`); err != nil {
		t.Fatal(err)
	}

	request := Request{ID: 7}
	if err := HandleDeleteRequest(99, request); !errors.Is(err, errDeleteNotOwned) {
		t.Fatalf("non-owner delete error = %v, want %v", err, errDeleteNotOwned)
	}
	assertRowCount(t, db, "posts", 1)
	assertRowCount(t, db, "LikedPosts", 1)

	if err := HandleDeleteRequest(12, request); err != nil {
		t.Fatalf("owner delete failed: %v", err)
	}
	assertRowCount(t, db, "posts", 0)
	assertRowCount(t, db, "LikedPosts", 0)

	if err := HandleDeleteRequest(12, request); !errors.Is(err, errPostNotFound) {
		t.Fatalf("missing post delete error = %v, want %v", err, errPostNotFound)
	}
}

func assertRowCount(t *testing.T, db *sql.DB, table string, want int) {
	t.Helper()

	var got int
	if err := db.QueryRow("SELECT COUNT(*) FROM " + table).Scan(&got); err != nil {
		t.Fatal(err)
	}
	if got != want {
		t.Fatalf("%s row count = %d, want %d", table, got, want)
	}
}
