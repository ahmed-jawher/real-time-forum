import * as comm from "./comment.js";
import * as temp from "./template.js";

export async function showPostView() {
  const shell = `<div class="SinglePostContainer"></div>`;
  const pathParts = window.location.pathname.split("/");
  const postId = pathParts[2];
  const payload = await fetchPost(postId);

  if (!payload) {
    return;
  }

  const postMarkup = temp.postCards([payload.Post]);
  const commentsMarkup = temp.commentSection(payload.Post);
  const style = `<link href="../Style/Home.css" rel="stylesheet" />`;

  document.querySelector(".page").innerHTML = style + shell;
  document.querySelector(".SinglePostContainer").innerHTML =
    postMarkup + commentsMarkup;
  bindPostEvents(postId, payload);
}

export async function fetchPost(postId) {
  try {
    const response = await fetch(`/Post/${postId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ RequestType: "Data" }),
    });

    if (!response.ok) {
      throw new Error(`Post request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Unable to load post:", error);
    return null;
  }
}

function markPostReactions(isLiked, isDisliked, postId) {
  if (isLiked) {
    document.getElementById(`Like${postId}`).checked = true;
    document.getElementById(`LikeSVG${postId}`).classList.add("LikeSVGClicked");
  }

  if (isDisliked) {
    document.getElementById(`Dislike${postId}`).checked = true;
    document
      .getElementById(`DislikeSVG${postId}`)
      .classList.add("DislikeSVGClicked");
  }
}

function bindPostEvents(postId, payload) {
  document
    .getElementById(`Like${postId}`)
    .addEventListener("click", function () {
      togglePostReaction(this, "Like");
    });
  document
    .getElementById(`Dislike${postId}`)
    .addEventListener("click", function () {
      togglePostReaction(this, "Dislike");
    });

  markPostReactions(payload.IsLiked, payload.IsDisliked, postId);

  document.querySelector(".SendSVGContainer").addEventListener("click", () => {
    comm.submitComment(postId);
  });
  document
    .getElementById(`CommentMessage${postId}`)
    .addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        comm.submitComment(postId);
      }
    });

  document.querySelectorAll(".CLike").forEach((button) => {
    button.addEventListener("click", function () {
      comm.toggleCommentReaction(this, "Like");
    });
  });
  document.querySelectorAll(".CDislike").forEach((button) => {
    button.addEventListener("click", function () {
      comm.toggleCommentReaction(this, "Dislike");
    });
  });

  comm.markLikedComments(payload.LikedComments);
  comm.revealOwnComments(payload.CreatedComments);

  document.querySelectorAll(".CommentEditBtn").forEach((button) => {
    button.addEventListener("click", function () {
      comm.beginCommentEdit(this);
    });
  });
  document.querySelectorAll(".CommentDeleteBtn").forEach((button) => {
    button.addEventListener("click", function () {
      comm.deleteComment(this.value);
    });
  });

  if (payload.IsCreated) {
    enablePostDelete(postId);
  }
}

function togglePostReaction(reactionBox, reactionType) {
  const targetId = reactionBox.value;
  const active = reactionBox.checked;
  const oppositeType = reactionType === "Like" ? "Dislike" : "Like";
  const oppositeBox = document.getElementById(`${oppositeType}${targetId}`);

  if (oppositeBox.checked) {
    reactionBox.checked = false;
    return;
  }

  fetch("/Post/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      RequestType: "like",
      Type: reactionType,
      ID: Number.parseInt(targetId, 10),
      Checked: active,
    }),
  }).catch((error) => console.error("Unable to update post reaction:", error));

  const countEl = document.getElementById(`Num${reactionBox.id}`);
  const count = Number.parseInt(countEl.textContent, 10);
  countEl.textContent = String(count + (active ? 1 : -1));

  document
    .getElementById(`${reactionType}SVG${targetId}`)
    .classList.toggle(`${reactionType}SVGClicked`);
}

function enablePostDelete(postId) {
  const deleteBtn = document.getElementById(`DeleteBtn${postId}`);
  if (!deleteBtn) {
    return;
  }

  deleteBtn.style.display = "flex";
  deleteBtn.addEventListener("click", () => deletePost(postId));
}

async function deletePost(postId) {
  const numericPostId = Number.parseInt(postId, 10);
  if (!Number.isInteger(numericPostId)) {
    console.error("Unable to delete post: invalid post ID");
    return;
  }

  try {
    const response = await fetch("/Post/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        RequestType: "delete",
        ID: numericPostId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Delete failed with status ${response.status}`);
    }

    window.location.href = "/HomePage";
  } catch (error) {
    console.error("Unable to delete post:", error);
  }
}
