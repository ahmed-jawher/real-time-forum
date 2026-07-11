import * as chat from "./Chat.js";
import * as create from "./createPost.js";
import * as home from "./home.js";
import * as post from "./post.js";
import * as session from "./Session.js";
import * as socket from "./WS.js";
import * as temp from "./template.js";

export async function mountShell() {
  const payload = await fetchFeedData("Data");
  if (!payload) {
    return;
  }

  session.storeSession(payload);
  paintShell(payload);
  socket.connectSocket();

  const currentPath = window.location.pathname;
  const pathParts = currentPath.split("/");

  if (currentPath === "/CreatePost") {
    create.showComposerView();
  } else if (currentPath === "/HomePage") {
    home.showFeedView("Data");
  } else if (pathParts[1] === "Post") {
    post.showPostView();
  } else if (pathParts[1] === "Chat") {
    chat.showChatView();
  }
}

function paintShell(payload) {
  const markup = temp.appShell(payload);
  const style = `<link href="../Style/Main.css" rel="stylesheet" />`;
  document.getElementById("content").innerHTML = style + markup;
  bindShellEvents();
}

export async function fetchFeedData(requestType) {
  try {
    const response = await fetch("/HomePage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ RequestType: requestType }),
    });

    if (!response.ok) {
      throw new Error(`Feed request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Unable to load forum data:", error);
    return null;
  }
}

export async function refreshConversationList(users) {
  const markup = temp.conversationList(users);

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const listEl = document.querySelector(".partners-container");
    if (listEl) {
      listEl.innerHTML = markup;
      bindConversationItems();
      syncChatHeaderStatus();
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

// Mirror the open partner's online state (kept up to date in the DM list) onto
// the status dot in the chat header, so it is visible while inside a chat too.
export function syncChatHeaderStatus() {
  const partnerId = sessionStorage.getItem("User");
  const headerStatus = document.getElementById("partnerStatus");
  if (!headerStatus || !partnerId) {
    return;
  }
  const sidebarStatus = document.querySelector(
    `.partner[id="${partnerId}"] .Status`,
  );
  const online =
    !!sidebarStatus && sidebarStatus.style.backgroundColor === "green";
  headerStatus.style.backgroundColor = online ? "green" : "";
}

function clearUnreadBadge(senderId, receiverId) {
  const resetPayload = {
    sender_id: senderId,
    receiver_id: receiverId,
  };

  fetch("/Notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(resetPayload),
  }).catch((error) => console.error("Unable to clear notifications:", error));
}

function bindShellEvents() {
  document.querySelector(".HomeBtn").addEventListener("click", (event) => {
    event.preventDefault();
    home.clearStoredFilters();
    window.history.pushState(null, "", "/HomePage");
    home.showFeedView("Data");
  });

  document.querySelector(".CreateBtn").addEventListener("click", (event) => {
    event.preventDefault();
    window.history.pushState(null, "", "/CreatePost");
    create.showComposerView();
  });

  document.querySelector(".LogoutBtn").addEventListener("click", () => {
    window.location.href = "/LogOut";
  });

  const personalPhoto = document.querySelector(".PersonalPhoto");
  const uploadInput = document.getElementById("UploadInput");

  personalPhoto.addEventListener("click", () => uploadInput.click());
  uploadInput.addEventListener("change", async () => {
    const file = uploadInput.files[0];
    if (!file) {
      return;
    }

    const body = new FormData();
    body.append("PImg", file);

    try {
      const response = await fetch("/ProfileImageHandler", {
        method: "POST",
        body,
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}`);
      }

      window.location.reload();
    } catch (error) {
      console.error("Unable to upload profile image:", error);
    }
  });
}

function bindConversationItems() {
  const conversationItems = document.querySelectorAll(".partner");

  conversationItems.forEach((conversationItem) => {
    conversationItem.addEventListener("click", function (event) {
      event.preventDefault();

      const partnerId = this.id;
      const partnerName =
        this.getElementsByClassName("Username")[0].textContent;
      const partnerAvatar = this.querySelector(".PartnerImage").id;

      sessionStorage.setItem("User", partnerId);
      sessionStorage.setItem("partner-Username", partnerName);
      sessionStorage.setItem("scroll", "0");
      sessionStorage.setItem("partner-Img", partnerAvatar);

      const senderId = Number.parseInt(sessionStorage.getItem("UserId"), 10);
      const receiverId = Number.parseInt(partnerId, 10);

      window.history.pushState(
        null,
        "",
        `/Chat?Sender=${senderId}&Receiver=${receiverId}`,
      );
      chat.showChatView();
      socket.requestMessageHistory();
      clearUnreadBadge(receiverId, senderId);

      const badgeEl = this.querySelector(".Notifications-container");
      if (badgeEl) {
        badgeEl.style.display = "none";
      }
    });
  });
}
