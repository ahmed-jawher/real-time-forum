import * as socket from "./WS.js";
import * as app from "./app.js";

export function buildChatMarkup() {
  const partnerAvatar = sessionStorage.getItem("partner-Img");
  const partnerName = sessionStorage.getItem("partner-Username");

  return `
    <div class="PartnerInfo">
      <div class="PersonalPhoto">
        <img id="partnerProfileImg" src="../ProfileImages/${partnerAvatar}" alt="" />
        <div class="Status" id="partnerStatus"></div>
      </div>
      <p class="Username" id="partnerUsername">${partnerName}</p>
    </div>
    <div class="ChatBody"></div>
    <div class="Message">
      <input id="ChatMessage" title="Write message" placeholder="Message.." class="MsgInput" type="text" />
      <button class="SendChatMessage" type="button" aria-label="Send message">
        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30"
          viewBox="0 0 30 30" preserveAspectRatio="xMidYMid meet" class="SendSVG">
          <g transform="translate(0,30) scale(0.1,-0.1)" fill="#2b2b35" stroke="none">
            <path d="M44 256 c-3 -8 -4 -29 -2 -48 3 -31 5 -33 56 -42 28 -5 52 -13 52 -16 0 -3 -24 -11 -52 -16 -52 -9 -53 -9 -56 -48 -2 -21 1 -43 6 -48 10 -10 232 97 232 112 0 7 -211 120 -224 120 -4 0 -9 -6 -12 -14z"></path>
          </g>
        </svg>
      </button>
    </div>`;
}

export async function showChatView() {
  const style = `<link href="../Style/Chat.css" rel="stylesheet" />`;

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const pageEl = document.querySelector(".page");
    if (pageEl) {
      pageEl.innerHTML = style + buildChatMarkup();
      socket.bindChatComposer();
      app.syncChatHeaderStatus();
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}
