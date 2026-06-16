export function storeSession(payload) {
  sessionStorage.setItem("UserId", payload.UserId);
  sessionStorage.setItem("Username", payload.Username);
  sessionStorage.setItem("ProfileImg", payload.ProfileImg);

  if (payload.Users) {
    sessionStorage.setItem("users", JSON.stringify(payload.Users));
  }
}
