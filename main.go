package main

import (
	forum "Real_Time_Forum/Backend"
	_ "github.com/mattn/go-sqlite3"
	"log"
	"net/http"
)

func main() {

	var Files = []string{"Style", "Error", "Posts", "ProfileImages", "Js"}
	for _, File := range Files {
		fs := http.FileServer(http.Dir(File))
		http.Handle("/"+File+"/", http.StripPrefix("/"+File+"/", fs))
	}

	http.HandleFunc("/", forum.Login)
	http.HandleFunc("/SignUp", forum.SignUpHandler)
	http.HandleFunc("/HomePage", forum.AuthMiddleware(forum.HomeHandler))
	http.HandleFunc("/CreatePost", forum.AuthMiddleware(forum.CreatePostHandler))
	http.HandleFunc("/Post/", forum.AuthMiddleware(forum.PostHandler))
	http.HandleFunc("/ProfileImageHandler", forum.AuthMiddleware(forum.ProfileImageHandler))
	http.HandleFunc("/LogOut", forum.LogoutHandler)
	http.HandleFunc("/Error", forum.Error)
	http.HandleFunc("/CommentHandler", forum.AuthMiddleware(forum.CommentHandler))
	http.HandleFunc("/CommentLikeHandle", forum.AuthMiddleware(forum.CommentLikeHandle))
	http.HandleFunc("/Notifications", forum.AuthMiddleware(forum.NotificationsHandler))
	http.HandleFunc("/Chat", forum.AuthMiddleware(forum.ChatHandler))
	http.HandleFunc("/ws", forum.WsConn)

	forum.CreateTables()
	log.Println("Server started on http://localhost:8082")
	log.Fatal(http.ListenAndServe(":8082", nil))
}
