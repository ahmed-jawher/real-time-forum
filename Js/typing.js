// ===========================================================================
// Typing-in-progress engine (self-contained front-end module).
//
// This module implements the whole feature on the client with ZERO coupling to
// the chat/messaging code:
//
//   - It opens its OWN websocket to the dedicated /typing-ws endpoint.
//   - It listens to Keyboard events (typing) and Focus events (blur) on the
//     chat input to decide when the local user starts/stops typing.
//   - It renders a smooth, CSS-animated "<name> is typing…" indicator for the
//     partner, and hides it shortly after they stop (or time out).
//   - It injects its own stylesheet and discovers the chat input on its own via
//     a MutationObserver, so no other file needs to know it exists.
//
// It is imported once (see typing bootstrap <script> in the page) and wires
// itself up automatically.
// ===========================================================================

// --- tunables --------------------------------------------------------------
const INACTIVITY_DELAY = 2000; // ms of silence before we emit "stop"
const RECEIVER_TIMEOUT = 3000; // ms to keep the indicator up without a refresh
const START_THROTTLE = 1200; // ms; at most one "start" frame per window

// --- one-time stylesheet injection -----------------------------------------
(function injectStylesheet() {
  if (document.getElementById("typing-stylesheet")) {
    return;
  }
  const link = document.createElement("link");
  link.id = "typing-stylesheet";
  link.rel = "stylesheet";
  link.href = "../Style/Typing.css";
  document.head.appendChild(link);
})();

// --- dedicated websocket ---------------------------------------------------
let socket = null;
let reconnectTimer = null;

// We are "in the app" (logged in) once the shell is on screen. Used to decide
// whether it is worth (re)connecting: on the login page there is no shell, so
// we don't spam failed connections.
function inApp() {
  return !!(
    document.querySelector(".partners-container") ||
    document.querySelector(".page")
  );
}

function ensureSocket() {
  if (
    socket &&
    (socket.readyState === WebSocket.OPEN ||
      socket.readyState === WebSocket.CONNECTING)
  ) {
    return;
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  socket = new WebSocket(`${protocol}//${window.location.host}/typing-ws`);

  socket.addEventListener("message", (event) => {
    try {
      handleIncoming(JSON.parse(event.data));
    } catch (error) {
      console.error("typing: bad frame", error);
    }
  });
  // If the socket drops (server restart, network blip, ...) reconnect while the
  // user is still in the app, so typing keeps working without a manual refresh.
  socket.addEventListener("close", () => {
    socket = null;
    scheduleReconnect();
  });
}

function scheduleReconnect() {
  if (reconnectTimer) {
    return;
  }
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    if (inApp()) {
      ensureSocket();
    }
  }, 1500);
}

// Connect as soon as we are logged in, so typing is received even before (and
// without) opening any conversation — e.g. to light up the DM list.
function maybeConnect() {
  if (inApp()) {
    ensureSocket();
  }
}

function sendFrame(type) {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    return;
  }
  const receiver = Number.parseInt(sessionStorage.getItem("User"), 10);
  if (!receiver) {
    return;
  }
  socket.send(JSON.stringify({ type, receiver }));
}

// --- receiving side: show/hide the typing indicators -----------------------
// One entry per partner that is currently typing, so several conversations can
// show "typing" at once (e.g. in the DM list) without clobbering each other.
const activeTypers = new Map(); // senderId -> hide timer

function currentPartnerId() {
  return Number.parseInt(sessionStorage.getItem("User"), 10);
}

function handleIncoming(frame) {
  const senderId = frame.sender;

  if (frame.type === "start") {
    // Always reflect it in the DM list, so it is visible even when this
    // conversation is not the one currently open.
    markSidebar(senderId, true, frame.name);

    // Additionally show the in-chat banner when this IS the open conversation.
    if (senderId === currentPartnerId()) {
      showIndicator(frame.name);
    }

    if (activeTypers.has(senderId)) {
      clearTimeout(activeTypers.get(senderId));
    }
    activeTypers.set(
      senderId,
      setTimeout(() => stopTyper(senderId), RECEIVER_TIMEOUT),
    );
  } else if (frame.type === "stop") {
    stopTyper(senderId);
  }
}

function stopTyper(senderId) {
  const timer = activeTypers.get(senderId);
  if (timer) {
    clearTimeout(timer);
  }
  activeTypers.delete(senderId);

  markSidebar(senderId, false);
  if (senderId === currentPartnerId()) {
    hideIndicator();
  }
}

// Show/hide the "typing…" line inside a partner's row in the DM list. The list
// is rebuilt on every presence update, so applyAllSidebarMarks() re-applies the
// active ones whenever it re-renders (see the MutationObserver in bootstrap).
function markSidebar(senderId, typing) {
  const partner = document.querySelector(`.partner[id="${senderId}"]`);
  if (!partner) {
    return;
  }
  partner.classList.toggle("is-typing", typing);

  if (typing && !partner.querySelector(".partner-typing")) {
    const label = document.createElement("p");
    label.className = "partner-typing";
    label.textContent = "typing…";
    (partner.querySelector(".TextContainer") || partner).appendChild(label);
  }
}

function applyAllSidebarMarks() {
  for (const senderId of activeTypers.keys()) {
    markSidebar(senderId, true);
  }
}

// The indicator lives just above the message input. It is (re)created lazily
// because the chat view rebuilds its markup every time a conversation opens.
function getOrCreateIndicator() {
  let indicator = document.getElementById("typing-indicator");
  if (indicator) {
    return indicator;
  }

  const page = document.querySelector(".page");
  const composer = document.querySelector(".Message");
  if (!page || !composer) {
    return null;
  }

  indicator = document.createElement("div");
  indicator.id = "typing-indicator";
  indicator.className = "typing-indicator";
  indicator.innerHTML =
    '<span class="typing-name"></span>' +
    '<span class="typing-label"> is typing</span>' +
    '<span class="typing-dots"></span>';
  page.insertBefore(indicator, composer);
  return indicator;
}

function showIndicator(name) {
  const indicator = getOrCreateIndicator();
  if (!indicator) {
    return;
  }
  indicator.querySelector(".typing-name").textContent = name || "";
  indicator.classList.add("is-visible");
}

function hideIndicator() {
  const indicator = document.getElementById("typing-indicator");
  if (indicator) {
    indicator.classList.remove("is-visible");
  }
}

// --- sending side: keyboard + focus events on the chat input ---------------
function throttle(callback, delay) {
  let last = 0;
  return () => {
    const now = Date.now();
    if (now - last >= delay) {
      last = now;
      callback();
    }
  };
}

function bindComposer(input) {
  if (input.dataset.typingBound === "true") {
    return;
  }
  input.dataset.typingBound = "true";

  ensureSocket();

  let inactivityTimer = null;
  let typing = false;

  const emitStart = throttle(() => sendFrame("start"), START_THROTTLE);

  const stop = () => {
    clearTimeout(inactivityTimer);
    inactivityTimer = null;
    if (typing) {
      typing = false;
      sendFrame("stop");
    }
  };

  const keepAlive = () => {
    ensureSocket();
    typing = true;
    emitStart();
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(stop, INACTIVITY_DELAY);
  };

  // Keyboard event: Enter means the message is being sent -> stop typing.
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      stop();
    }
  });

  // Input event reliably reflects the field's content (typing, paste, delete).
  input.addEventListener("input", () => {
    if (input.value.trim()) {
      keepAlive();
    } else {
      stop();
    }
  });

  // Focus event: leaving the field means the user stopped typing.
  input.addEventListener("blur", stop);
}

// --- discover the chat input whenever a conversation is opened -------------
function scanForComposer(root = document) {
  const input = root.querySelector
    ? root.querySelector("#ChatMessage")
    : null;
  if (input) {
    bindComposer(input);
  }
}

function bootstrap() {
  maybeConnect();
  scanForComposer();

  // The SPA swaps views in and out, so watch for the chat input appearing and
  // for the DM list rendering/re-rendering (presence updates rebuild it).
  const observer = new MutationObserver((mutations) => {
    let sidebarChanged = false;
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) {
          continue;
        }
        if (node.id === "ChatMessage") {
          bindComposer(node);
        } else {
          scanForComposer(node);
          const isList =
            node.classList?.contains("partners-container") ||
            node.querySelector?.(".partners-container");
          if (
            node.classList?.contains("partner") ||
            node.querySelector?.(".partner")
          ) {
            sidebarChanged = true;
          }
          if (isList || sidebarChanged) {
            // Logged-in shell just appeared: make sure we are connected.
            maybeConnect();
          }
        }
      }
    }
    if (sidebarChanged) {
      applyAllSidebarMarks();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrap);
} else {
  bootstrap();
}
