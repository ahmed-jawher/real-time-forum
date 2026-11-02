# Real-Time Forum — Typing in Progress

An extension of [Real-Time Forum](../README.md) that adds a live **"is typing…"** indicator to private messages, like the one in modern chat apps.

## How It Works

- The client opens a separate WebSocket to a dedicated **`/typing-ws`** endpoint, so typing events never block chat messages
- Keyboard events on the chat input send a **typing start** signal, and an inactivity timer stops it automatically after a short pause
- When the user stops typing, sends the message or leaves the input (`blur`), a **typing stop** signal is sent
- The server forwards the event only to the conversation partner, who sees an animated indicator in real time

| File | Role |
|---|---|
| `Backend/Typing.go` | Typing WebSocket endpoint and event routing |
| `Js/typing.js` | Captures typing and focus events and renders the indicator |

## Run

**Requirements:** Go 1.21+ and gcc (for `go-sqlite3`)

```bash
go run .
```

Open <http://localhost:8082>, sign in as two different users in two browsers, and start chatting.
