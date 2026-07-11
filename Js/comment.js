import * as temp from "./template.js";

export function markLikedComments(likedKeys) {
  if (!likedKeys) {
    return;
  }

  likedKeys.forEach((like) => {
    const value = like.split("_");
    const checkbox = document.getElementById(value.join(""));

    if (checkbox) {
      checkbox.checked = true;
      document
        .getElementById(`${value[0]}SVG${value[1]}`)
        ?.classList.add(`${value[0]}SVGClicked`);
    }
  });
}

export function revealOwnComments(commentIds) {
  if (!commentIds) {
    return;
  }

  commentIds.forEach((commentId) => {
    const actionsEl = document.getElementById(
      `CommentEditDeleteContainer${commentId}`,
    );
    if (actionsEl) {
      actionsEl.style.display = "flex";
    }
  });
}

function saveCommentEdit(commentId, text) {
  return fetch("/Post/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      RequestType: "UpdateComment",
      ID: Number.parseInt(commentId, 10),
      Text: text,
    }),
  });
}

export async function deleteComment(commentId) {
  try {
    const response = await fetch("/Post/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        RequestType: "DeleteComment",
        ID: Number.parseInt(commentId, 10),
      }),
    });

    if (!response.ok) {
      throw new Error(`Delete failed with status ${response.status}`);
    }

    window.location.reload();
  } catch (error) {
    console.error("Unable to delete comment:", error);
  }
}

export async function submitComment(postId) {
  const authorName = document.querySelector(
    ".ProfileImage-container .Username",
  ).textContent;
  const authorAvatar = document
    .querySelector(".ProfilePhoto")
    .getAttribute("src")
    .split("/")
    .pop();
  const inputEl = document.getElementById(`CommentMessage${postId}`);
  const text = inputEl.value;

  if (text.length > 200) {
    alert("Comment cannot be more than 200 characters.");
    return;
  }

  if (text.trim().length === 0) {
    alert("Empty comments are not allowed");
    return;
  }

  try {
    const response = await fetch("/CommentHandler", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: text,
        postId: Number.parseInt(postId, 10),
        username: authorName,
        profileImage: authorAvatar,
      }),
    });

    if (!response.ok) {
      throw new Error(`Comment request failed with status ${response.status}`);
    }

    const payload = await response.json();
    inputEl.value = "";

    const comment = {
      CommentId: payload.CommentId,
      UserName: authorName,
      Text: text,
      Time: new Date().toLocaleString(),
      CLike: 0,
      CDislike: 0,
      ProfileImage: authorAvatar,
    };
    const fragment = document
      .createRange()
      .createContextualFragment(temp.commentCard(comment));
    const node = fragment.firstElementChild;

    node.querySelector(".CLike").addEventListener("click", function () {
      toggleCommentReaction(this, "Like");
    });
    node.querySelector(".CDislike").addEventListener("click", function () {
      toggleCommentReaction(this, "Dislike");
    });

    document.getElementById(`Comment${postId}`).appendChild(node);
  } catch (error) {
    console.error("Unable to submit comment:", error);
  }
}

export function toggleCommentReaction(reactionBox, reactionType) {
  const targetId = reactionBox.value;
  const active = reactionBox.checked;
  const oppositeType = reactionType === "Like" ? "Dislike" : "Like";
  const oppositeBox = document.getElementById(`C${oppositeType}${targetId}`);

  if (oppositeBox.checked) {
    reactionBox.checked = false;
    return;
  }

  fetch("/CommentLikeHandle", {
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
  }).catch((error) =>
    console.error("Unable to update comment reaction:", error),
  );

  const countEl = document.getElementById(`Num${reactionBox.id}`);
  const count = Number.parseInt(countEl.textContent, 10);
  countEl.textContent = String(count + (active ? 1 : -1));

  document
    .getElementById(`C${reactionType}SVG${targetId}`)
    .classList.toggle(`C${reactionType}SVGClicked`);
}

export function beginCommentEdit(editBtn) {
  const commentId = editBtn.value;
  const textEl = document.getElementById(`CommentText${commentId}`);
  const editInput = document.createElement("input");

  editInput.type = "text";
  editInput.value = textEl.textContent;
  editInput.className = "CommentEditTextInput";
  editBtn.disabled = true;

  const commitCommentEdit = async () => {
    const text = editInput.value.trim();
    if (!text) {
      return;
    }

    try {
      const response = await saveCommentEdit(commentId, text);
      if (!response.ok) {
        throw new Error(`Update failed with status ${response.status}`);
      }

      textEl.textContent = text;
      editInput.remove();
      textEl.style.display = "inline";
      editBtn.disabled = false;
    } catch (error) {
      console.error("Unable to edit comment:", error);
    }
  };

  editInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      commitCommentEdit();
    }
  });

  textEl.style.display = "none";
  textEl.parentNode.insertBefore(editInput, textEl);
  editInput.focus();
}
