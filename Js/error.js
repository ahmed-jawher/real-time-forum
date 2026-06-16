export async function fetchError() {
  try {
    const response = await fetch("/Error");
    if (!response.ok) {
      throw new Error(`Error request failed with status ${response.status}`);
    }

    const { Code: code, Message: message } = await response.json();
    showErrorView(code, message);
  } catch (error) {
    console.error("Unable to fetch error details:", error);
    showErrorView("Page Not Found", "The requested page could not be found.");
  }
}

function buildErrorMarkup(code, message) {
  return `
    <div class="Error-container">
      <h1>Error ${code}</h1>
      <p>${message}</p>
      <button class="back-button" type="button">Back</button>
    </div>
  `;
}

export function showErrorView(code, message) {
  const markup = buildErrorMarkup(code, message);
  const style = `<link href="../Style/Main.css" rel="stylesheet" />`;
  document.querySelector(".content").innerHTML = style + markup;
  document.querySelector(".back-button").addEventListener("click", () => {
    window.location.href = "/HomePage";
  });
}
