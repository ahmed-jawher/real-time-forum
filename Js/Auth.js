import * as app from "./app.js";
import * as temp from "./template.js";

export function showLoginView(error = "") {
  const markup = temp.loginForm(error);
  const style = `<link href="../Style/LoginPage.css" rel="stylesheet" />`;
  document.getElementById("content").innerHTML = style + markup;
  bindLoginForm();
}

export function showSignUpView(error = "") {
  const markup = temp.signUpForm(error);
  const style = `<link href="../Style/LoginPage.css" rel="stylesheet" />`;
  document.getElementById("content").innerHTML = style + markup;
  bindSignUpForm();
}

function hasBlankField(...fields) {
  return fields.some((field) => field.trim() === "");
}

function bindLoginForm() {
  const toSignUpBtn = document.getElementById("SignUp");
  toSignUpBtn.addEventListener("click", (event) => {
    event.preventDefault();
    window.history.pushState(null, "", "/SignUp");
    showSignUpView();
  });

  document
    .getElementById("Login_form")
    .addEventListener("submit", async (event) => {
      event.preventDefault();

      const username = document.querySelector("#username").value;
      const password = document.querySelector("#password").value;
      const requestBody = JSON.stringify({ username, password });

      try {
        const response = await fetch("/", {
          method: "POST",
          body: requestBody,
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });

        if (!response.ok) {
          const serverError = await response.text();
          showLoginView(serverError);
          return;
        }

        await response.json();
        window.history.pushState(null, "", "/HomePage");
        await app.mountShell();
      } catch (error) {
        showLoginView(error.message);
      }
    });
}

function bindSignUpForm() {
  const toLoginBtn = document.getElementById("Login");
  toLoginBtn.addEventListener("click", (event) => {
    event.preventDefault();
    window.history.pushState(null, "", "/");
    showLoginView();
  });

  document
    .getElementById("Signup_form")
    .addEventListener("submit", async (event) => {
      event.preventDefault();

      const email = document.querySelector("#email").value;
      const username = document.querySelector("#username").value;
      const FirstName = document.querySelector("#FirstName").value;
      const LastName = document.querySelector("#LastName").value;
      const Age = document.querySelector("#Age").value;
      const Gender = document.querySelector("#Gender").value;
      const password = document.querySelector("#password").value;
      const ConfirmPassword =
        document.querySelector("#ConfirmPassword").value;

      if (
        hasBlankField(
          email,
          username,
          FirstName,
          LastName,
          Age,
          Gender,
          password,
          ConfirmPassword,
        )
      ) {
        alert("Please fill out all fields");
        return;
      }

      const requestBody = JSON.stringify({
        email,
        username,
        FirstName,
        LastName,
        Age,
        Gender,
        password,
        ConfirmPassword,
      });

      try {
        const response = await fetch("/SignUp", {
          method: "POST",
          body: requestBody,
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });

        if (!response.ok) {
          const serverError = await response.text();
          showSignUpView(serverError);
          return;
        }

        await response.json();
        window.history.pushState(null, "", "/HomePage");
        await app.mountShell();
      } catch (error) {
        showSignUpView(error.message);
      }
    });
}
