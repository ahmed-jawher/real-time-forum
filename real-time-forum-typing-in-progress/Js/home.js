import * as app from "./app.js";
import * as postFile from "./post.js";
import * as temp from "./template.js";

export async function showFeedView(categoryQuery) {
  const markup = temp.feedShell();
  const style = `<link href="../Style/Home.css" rel="stylesheet" />`;
  const pageEl = document.querySelector(".page");

  pageEl.innerHTML = style + markup;

  const payload = await app.fetchFeedData(categoryQuery);
  if (!payload) {
    return;
  }

  const feedPosts = temp.postCards(payload.Posts);
  document.querySelector(".Posts").innerHTML = feedPosts;
  bindFeedEvents(payload.Posts, payload);
}

export function clearStoredFilters() {
  const categoryBoxes = document.querySelectorAll(
    'input[name="categories"]',
  );

  categoryBoxes.forEach((checkbox) => {
    localStorage.setItem(checkbox.value, "false");
  });
}

function markLikedPosts(likedKeys) {
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

function persistFilterState(categoryBoxes) {
  categoryBoxes.forEach((checkbox) => {
    localStorage.setItem(checkbox.value, String(checkbox.checked));
  });
}

function applyCategoryFilter(categoryBoxes) {
  const selected = Array.from(categoryBoxes)
    .filter((checkbox) => checkbox.checked)
    .map((checkbox) => checkbox.value);

  const selectedQuery = selected.join(" ");
  showFeedView(selectedQuery);
}

function initCategoryFilter() {
  const categoryBoxes = document.querySelectorAll(
    'input[name="categories"]',
  );

  categoryBoxes.forEach((checkbox) => {
    checkbox.checked = localStorage.getItem(checkbox.value) === "true";
    checkbox.addEventListener("change", () => {
      persistFilterState(categoryBoxes);
      applyCategoryFilter(categoryBoxes);
    });
  });
}

function bindFeedEvents(feedPosts, payload) {
  feedPosts?.forEach((post) => {
    document
      .getElementById(`post${post.PostId}`)
      .addEventListener("click", (event) => {
        event.preventDefault();
        window.history.pushState(null, "", `/Post/${post.PostId}`);
        postFile.showPostView();
      });
  });

  markLikedPosts(payload.LikedPosts);
  initCategoryFilter();
}
