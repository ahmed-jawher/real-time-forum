import * as app from "./app.js";
import * as auth from "./Auth.js";
import * as error from "./error.js";

function applyStoredTheme() {
  const storedTheme = localStorage.getItem("theme");
  document.documentElement.dataset.theme = storedTheme || "dark";
}

function injectThemeButton() {
  if (document.getElementById("themeToggle")) {
    return;
  }

  const toggleBtn = document.createElement("button");
  toggleBtn.id = "themeToggle";
  toggleBtn.className = "theme-toggle";
  toggleBtn.type = "button";
  toggleBtn.setAttribute("aria-label", "Toggle theme");
  toggleBtn.title = "Toggle theme";
  toggleBtn.innerHTML = `
    <svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
    <svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
  `;
  toggleBtn.addEventListener("click", switchTheme);
  document.body.appendChild(toggleBtn);
}

function switchTheme() {
  const nextTheme =
    document.documentElement.dataset.theme === "light" ? "dark" : "light";
  document.documentElement.dataset.theme = nextTheme;
  localStorage.setItem("theme", nextTheme);
}

async function resolveRoute() {
  const currentPath = window.location.pathname;

  if (currentPath === "/") {
    auth.showLoginView();
  } else if (currentPath === "/SignUp") {
    auth.showSignUpView();
  } else if (
    currentPath === "/HomePage" ||
    currentPath === "/Chat" ||
    currentPath.startsWith("/Post/") ||
    currentPath === "/CreatePost"
  ) {
    await app.mountShell();
  } else {
    await error.fetchError();
  }

  injectThemeButton();
}

applyStoredTheme();
resolveRoute();
window.addEventListener("popstate", resolveRoute);
