let typingActive = false;

function animateDots(dotsEl, text, index = 0) {
  if (!typingActive) {
    dotsEl.textContent = "";
    return;
  }

  dotsEl.textContent += text[index];
  const nextIndex = (index + 1) % text.length;

  if (nextIndex === 0) {
    dotsEl.textContent = "";
  }

  setTimeout(() => animateDots(dotsEl, text, nextIndex), 300);
}

export function renderTypingIndicator(content) {
  const indicatorEl = document.querySelector(
    `#Typing-container${content.sender}`,
  );

  if (!indicatorEl) {
    return;
  }

  if (content.type === "start" && !typingActive) {
    typingActive = true;
    indicatorEl.style.display = "flex";
    const dotsEl = indicatorEl.querySelector("p");
    dotsEl.textContent = "";
    animateDots(dotsEl, "...");
  } else if (content.type === "stop") {
    typingActive = false;
    indicatorEl.style.display = "none";
  }
}

export function sendTypingStart(socket) {
  socket.send(
    JSON.stringify({
      type: "typing",
      Content: {
        receiver: Number.parseInt(sessionStorage.getItem("User"), 10),
        sender: Number.parseInt(sessionStorage.getItem("UserId"), 10),
        type: "start",
      },
    }),
  );
}

export function sendTypingStop(socket) {
  typingActive = false;
  socket.send(
    JSON.stringify({
      type: "typing",
      Content: {
        receiver: Number.parseInt(sessionStorage.getItem("User"), 10),
        sender: Number.parseInt(sessionStorage.getItem("UserId"), 10),
        type: "stop",
      },
    }),
  );
}
