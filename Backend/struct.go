package forum

import (
	"database/sql"
	"time"
)

type LoginData struct {
	Username string `json:"username"`
	Password string `json:"password"`
}
type ErrorResponse struct {
	Code    int    `json:"Code"`
	Message string `json:"Message"`
}

type SignupData struct {
	Email           string `json:"email"`
	Username        string `json:"username"`
	FirstName       string `json:"FirstName"`
	LastName        string `json:"LastName"`
	Age             string `json:"Age"`
	Gender          string `json:"Gender"`
	Password        string `json:"password"`
	ConfirmPassword string `json:"ConfirmPassword"`
}

type NotificationContent struct {
	Sender   int `json:"Sender"`
	Receiver int `json:"Receiver"`
}

type Account struct {
	Id         int
	Email      string
	Username   string
	Password   string
	ProfileImg string
}

type lastMessage struct {
	ID           int
	SenderID     int
	SenderName   string
	ReceiverID   int
	ReceiverName string
	Text         string
	Timestamp    time.Time
}

type UserInfo struct {
	ID       int
	Username string
}

type WSResponse struct {
	Type  string        `json:"type"`
	RInfo RInfo         `json:"Info"`
	Data  []interface{} `json:"Data"`
}

type RInfo struct {
	RUname string
	RPImg  string
}

type WSRequest struct {
	Type    string      `json:"type"`
	Content interface{} `json:"Content"`
}

type SendMessageContent struct {
	Text     string `json:"Text"`
	Sender   int    `json:"Sender"`
	Receiver int    `json:"Receiver"`
}

type LoadMessagesContent struct {
	Receiver int `json:"receiver"`
	Sender   int `json:"sender"`
	Scroll   int `json:"scroll"`
}
type Com struct {
	Id       int       `json:"Id"`
	Text     string    `json:"Text"`
	Sender   int       `json:"Sender"`
	Receiver int       `json:"Receiver"`
	Time     time.Time `json:"Time"`
}

var Accountsdb *sql.DB
var Notificationsdb *sql.DB

var Postsdb *sql.DB
var LikedPostsdb *sql.DB
var Commentsdb *sql.DB

type Post struct {
	PostId   int
	UserId   int
	UserName string
	UserImg  string
	Title    string
	Content  string
	Image    string
	Category []string
	Time     string
	Like     int
	Dislike  int
	Comments []Comment
}

type Comment struct {
	//PostId    int
	CommentId    int
	UserName     string
	Text         string
	Time         string
	CLike        int
	CDislike     int
	ProfileImage string
}

type Request struct {
	RequestType string `json:"RequestType"`
	//For Like Request
	Type    string `json:"Type"`
	ID      int    `json:"ID"`
	Checked bool   `json:"Checked"`
	//For Filter
	Categories []string `json:"Categories"`
	//For UpdateComment
	Text string `json:"Text"`
}

type Notifications struct {
	SenderID   int `json:"sender_id"`
	ReceiverID int `json:"receiver_id"`
}

type User struct {
	UserId        int
	Username      string
	ProfileImg    string
	LastMessage   string
	MessageID     int
	Status        string
	Notifications int
}

type PostTemplateData struct {
	Username        string
	ProfileImg      string
	Post            Post
	IsLiked         bool
	IsDisliked      bool
	IsCreated       bool
	LikedComments   []string
	CreatedComments []string
}
