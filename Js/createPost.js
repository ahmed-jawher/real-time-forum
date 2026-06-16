import * as temp from "./template.js";

export function showComposerView() {
  const markup = temp.composerForm();
  const style = `<link href="../Style/CreatePost.css" rel="stylesheet" />`;
  document.querySelector(".page").innerHTML = style + markup;
  bindComposerEvents();
}

function validateComposer() {
  const title = document.querySelector(".Title").value.trim();
  const content = document.querySelector(".TextArea").value.trim();
  const categoryBoxes = document.querySelectorAll(".customCheckBoxInput");
  const anyCategory = Array.from(categoryBoxes).some(
    (checkbox) => checkbox.checked,
  );

  if (!title || !content) {
    alert("Please fill in all fields");
    return false;
  }

  if (!anyCategory) {
    alert("Please select at least one category.");
    return false;
  }

  return true;
}

export function previewSelectedImage(input) {
  const file = input.files[0];
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/svg+xml",
    "image/gif",
  ];
  const maxSize = 20 * 1024 * 1024;

  if (!file || !allowedTypes.includes(file.type)) {
    alert("Please select a valid image file (JPEG, PNG, SVG or GIF).");
    input.value = "";
    return;
  }

  if (file.size > maxSize) {
    alert("Please select an image file smaller than 20MB.");
    input.value = "";
    return;
  }

  const reader = new FileReader();
  reader.addEventListener("load", (event) => {
    input.parentNode.querySelector(".selected-image")?.remove();

    const preview = document.createElement("div");
    preview.className = "selected-image";
    preview.style.backgroundImage = `url("${event.target.result}")`;
    input.parentNode.appendChild(preview);
  });
  reader.readAsDataURL(file);
}

function clearImagePreview() {
  const input = document.getElementById("file");
  const preview = input.parentNode.querySelector(".selected-image");
  input.value = "";
  preview?.remove();
}

function resetComposer() {
  const composerForm = document.getElementById("PostForm");
  composerForm.reset();
  clearImagePreview();
}

function bindComposerEvents() {
  const composerForm = document.getElementById("PostForm");
  const fileInput = document.getElementById("file");
  const clearBtn = document.querySelector(".Clear");
  const publishBtn = document.querySelector(".Download-button");

  fileInput.addEventListener("change", () => previewSelectedImage(fileInput));
  clearBtn.addEventListener("click", (event) => {
    event.preventDefault();
    clearImagePreview();
  });

  composerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!validateComposer()) {
      return;
    }

    publishBtn.disabled = true;
    const body = new FormData(composerForm);

    try {
      const response = await fetch("/CreatePost", {
        method: "POST",
        body,
      });

      if (!response.ok) {
        throw new Error(`Publish failed with status ${response.status}`);
      }

      resetComposer();
      window.history.pushState(null, "", "/HomePage");
      window.dispatchEvent(new PopStateEvent("popstate"));
    } catch (error) {
      console.error("Unable to create post:", error);
    } finally {
      publishBtn.disabled = false;
    }
  });
}
