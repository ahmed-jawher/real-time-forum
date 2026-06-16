import * as app from "./app.js";
import * as typing from "./typing.js";

let socket;

export function connectSocket() {
  if (
    socket &&
    (socket.readyState === WebSocket.OPEN ||
      socket.readyState === WebSocket.CONNECTING)
  ) {
    return;
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  socket = new WebSocket(`${protocol}//${window.location.host}/ws`);

  socket.addEventListener("open", () => {
    requestMessageHistory();
  });
  socket.addEventListener("error", (error) => {
    console.error("WebSocket error:", error);
  });
  socket.addEventListener("close", () => {
    console.info("WebSocket connection closed");
  });

  bindSocketMessages();
}

export function bindSocketMessages() {
  socket.onmessage = (event) => {
    try {
      const frame = JSON.parse(event.data);

      if (frame.type === "load_messages") {
        sessionStorage.setItem("partner-Username", frame.Info.RUname);
        sessionStorage.setItem("partner-Img", frame.Info.RPImg);

        const partnerAvatar = document.getElementById("partnerProfileImg");
        if (partnerAvatar) {
          partnerAvatar.src = `../ProfileImages/${frame.Info.RPImg}`;
        }

        const partnerName = document.getElementById("partnerUsername");
        if (partnerName) {
          partnerName.textContent = frame.Info.RUname;
        }

        paintMessageHistory(frame.Data);
      } else if (frame.type === "send_message") {
        appendIncomingMessage(frame.Content);
      } else if (frame.type === "typing") {
        typing.renderTypingIndicator(frame.Content);
      } else if (frame.type === "activeUsers") {
        app.refreshConversationList(frame.Content);
      }
    } catch (error) {
      console.error("Unable to handle WebSocket message:", error);
    }
  };
}

export function requestMessageHistory() {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    return;
  }

  const searchParams = new URL(window.location.href).searchParams;
  if (!searchParams.has("Sender") || !searchParams.has("Receiver")) {
    return;
  }

  socket.send(
    JSON.stringify({
      type: "load_messages",
      Content: {
        sender: Number.parseInt(searchParams.get("Sender"), 10),
        receiver: Number.parseInt(searchParams.get("Receiver"), 10),
        scroll: Number.parseInt(sessionStorage.getItem("scroll") || "0", 10),
      },
    }),
  );
}

function buildMessageNode(message) {
  const node = document.createElement("div");
  node.classList.add("messages");

  const usernameEl = document.createElement("div");
  const currentUserId = Number.parseInt(
    sessionStorage.getItem("UserId"),
    10,
  );

  if (message.Sender === currentUserId) {
    node.classList.add("sender");
    usernameEl.textContent = sessionStorage.getItem("Username");
  } else {
    node.classList.add("receiver");
    usernameEl.textContent = sessionStorage.getItem("partner-Username");
  }

  const bodyEl = document.createElement("div");
  bodyEl.classList.add("message-body");
  bodyEl.textContent = message.Text;

  const timeEl = document.createElement("div");
  timeEl.classList.add("message-time");
  timeEl.textContent = formatTimestamp(message.Time);

  node.append(usernameEl, bodyEl, timeEl);
  return node;
}

function paintMessageHistory(messages) {
  const scrollPane = document.querySelector(".ChatBody");
  if (!scrollPane) {
    return;
  }

  const previousHeight = scrollPane.scrollHeight;
  const savedScroll = Number.parseInt(
    sessionStorage.getItem("scroll") || "0",
    10,
  );

  scrollPane.innerHTML = "";
  messages
    ?.sort((a, b) => a.Id - b.Id)
    .forEach((message) => scrollPane.appendChild(buildMessageNode(message)));

  if (savedScroll === 0) {
    scrollPane.scrollTop = scrollPane.scrollHeight;
  } else {
    scrollPane.scrollTop = scrollPane.scrollHeight - previousHeight;
  }
}

function appendIncomingMessage(message) {
  const searchParams = new URL(window.location.href).searchParams;
  const currentUserId = Number.parseInt(
    sessionStorage.getItem("UserId"),
    10,
  );
  const partnerId = Number.parseInt(sessionStorage.getItem("User"), 10);
  const isCurrentConversation =
    searchParams.has("Sender") &&
    searchParams.has("Receiver") &&
    ((message.Sender === currentUserId && message.Receiver === partnerId) ||
      (message.Sender === partnerId && message.Receiver === currentUserId));

  if (!isCurrentConversation) {
    sendNotification(message);
    return;
  }

  const scrollPane = document.querySelector(".ChatBody");
  if (!scrollPane) {
    sendNotification(message);
    return;
  }

  scrollPane.appendChild(buildMessageNode(message));
  scrollPane.scrollTop = scrollPane.scrollHeight;
}

function sendNotification(message) {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    return;
  }

  socket.send(
    JSON.stringify({
      type: "notification",
      Content: {
        Sender: message.Sender,
        Receiver: message.Receiver,
      },
    }),
  );
}

function formatTimestamp(timeString) {
  return new Date(timeString).toLocaleString().replace(",", "");
}

function throttle(callback, delay) {
  let lastCall = 0;

  return (...args) => {
    const now = Date.now();
    if (now - lastCall < delay) {
      return;
    }

    lastCall = now;
    callback(...args);
  };
}

export function bindChatComposer() {
  const scrollPane = document.querySelector(".ChatBody");
  const inputEl = document.getElementById("ChatMessage");
  const sendBtn = document.querySelector(".SendChatMessage");

  if (!scrollPane || !inputEl || !sendBtn) {
    return;
  }

  const loadOlderMessages = throttle(() => {
    const offset =
      Number.parseInt(sessionStorage.getItem("scroll") || "0", 10) + 10;
    sessionStorage.setItem("scroll", String(offset));
    requestMessageHistory();
  }, 1000);
  const startTyping = throttle(() => typing.sendTypingStart(socket), 1500);
  const stopTyping = throttle(() => typing.sendTypingStop(socket), 1500);

  scrollPane.addEventListener("scroll", (event) => {
    if (event.target.scrollTop === 0) {
      loadOlderMessages();
    }
  });

  const dispatchMessage = () => {
    const message = inputEl.value.trim();
    if (!message) {
      alert("Empty messages are not allowed!");
      return;
    }

    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.error("Cannot send message while WebSocket is disconnected");
      return;
    }

    inputEl.value = "";
    typing.sendTypingStop(socket);
    socket.send(
      JSON.stringify({
        type: "send_message",
        Content: {
          Text: message,
          Sender: Number.parseInt(sessionStorage.getItem("UserId"), 10),
          Receiver: Number.parseInt(sessionStorage.getItem("User"), 10),
        },
      }),
    );
  };

  sendBtn.addEventListener("click", dispatchMessage);
  inputEl.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      dispatchMessage();
    } else if (socket?.readyState === WebSocket.OPEN) {
      startTyping();
    }
  });
  inputEl.addEventListener("input", () => {
    if (!inputEl.value.trim() && socket?.readyState === WebSocket.OPEN) {
      stopTyping();
    }
  });
}
