export function appShell(data) {
  const template = `
        <div class="nav">
            <div class="ProfileImage-container">
              <div class="UploadPersonalPhoto">
                <div class="PersonalPhoto">
                    <img class="ProfilePhoto" src="../ProfileImages/${sessionStorage.getItem("ProfileImg")}" />
                    <div class="OverlayText">Change Profile Image</div>
                    <input type="file" id="UploadInput" name="PImg" style="display: none;" />
                </div>
              </div>
                <p class="Username">${sessionStorage.getItem("Username")}</p>
            </div>
            <div class="menu-container">
                <button class="menu HomeBtn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="1.3em" height="1.3em" viewBox="0 0 1024 1024"
                        stroke-width="4" fill="currentColor" stroke="currentColor" class="icon">
                        <path fill="rgb(53, 52, 52)"
                            d="M946.5 505L560.1 118.8l-25.9-25.9a31.5 31.5 0 0 0-44.4 0L77.5 505a63.9 63.9 0 0 0-18.8 46c.4 35.2 29.7 63.3 64.9 63.3h42.5V940h691.8V614.3h43.4c17.1 0 33.2-6.7 45.3-18.8a63.6 63.6 0 0 0 18.7-45.3c0-17-6.7-33.1-18.8-45.2zM568 868H456V664h112v204zm217.9-325.7V868H632V640c0-22.1-17.9-40-40-40H432c-22.1 0-40 17.9-40 40v228H238.1V542.3h-96l370-369.7 23.1 23.1L882 542.3h-96.1z">
                        </path>
                    </svg>
                </button>
                <button class="menu CreateBtn">
                    <svg class="svg w-8 text-white" fill="grey" height="32" stroke="rgb(53, 52, 52)"
                        stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="32"
                        xmlns="http://www.w3.org/2000/svg">
                        <line x1="12" x2="12" y1="5" y2="19"></line>
                        <line x1="5" x2="19" y1="12" y2="12"></line>
                    </svg>
                </button>
                <button class="menu LogoutBtn">
                    <svg viewBox="0 0 512 512" width="1.5em" height="1.5em">
                        <path fill="rgb(53, 52, 52)"
                            d="M377.9 105.9L500.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L377.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1-128 0c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM160 96L96 96c-17.7 0-32 14.3-32 32l0 256c0 17.7 14.3 32 32 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-64 0c-53 0-96-43-96-96L0 128C0 75 43 32 96 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32z">
                        </path>
                    </svg>
                </button>
            </div>
        </div>
        <div class="app">
            <div class="partners-container">
            </div>

            <div class="page">

            </div>
        </div>
    `;
  return template;
}

export function feedShell(data) {
  const template = `
   <main class="HomeMain">
        <div class="Category">
          <form class="customCheckBoxHolder" id="Filter" action="/HomePage" method="POST">
            <input type="checkbox" id="cCB1" class="customCheckBoxInput" name="categories" value="News" />
            <label for="cCB1" class="customCheckBoxWrapper">
              <div class="customCheckBox">
                <div class="inner">News</div>
              </div>
            </label>
            <input type="checkbox" id="cCB2" class="customCheckBoxInput" name="categories" value="Technology" />
            <label for="cCB2" class="customCheckBoxWrapper">
              <div class="customCheckBox">
                <div class="inner">Technology</div>
              </div>
            </label>
            <input type="checkbox" id="cCB3" class="customCheckBoxInput" name="categories" value="Sports" />
            <label for="cCB3" class="customCheckBoxWrapper">
              <div class="customCheckBox">
                <div class="inner">Sports</div>
              </div>
            </label>
            <input type="checkbox" id="cCB4" class="customCheckBoxInput" name="categories" value="Health" />
            <label for="cCB4" class="customCheckBoxWrapper">
              <div class="customCheckBox">
                <div class="inner">Health</div>
              </div>
            </label>
            <input type="checkbox" id="cCB5" class="customCheckBoxInput" name="categories" value="Education" />
            <label for="cCB5" class="customCheckBoxWrapper">
              <div class="customCheckBox">
                <div class="inner">Education</div>
              </div>
            </label>
            <input type="checkbox" id="cCB6" class="customCheckBoxInput" name="categories" value="Arts" />
            <label for="cCB6" class="customCheckBoxWrapper">
              <div class="customCheckBox">
                <div class="inner">Arts</div>
              </div>
            </label>
            <input type="checkbox" id="cCB7" class="customCheckBoxInput" name="categories" value="Travel" />
            <label for="cCB7" class="customCheckBoxWrapper">
              <div class="customCheckBox">
                <div class="inner">Travel</div>
              </div>
            </label>
            <input type="checkbox" id="cCB8" class="customCheckBoxInput" name="categories" value="Food" />
            <label for="cCB8" class="customCheckBoxWrapper">
              <div class="customCheckBox">
                <div class="inner">Food</div>
              </div>
            </label>
            <input type="checkbox" id="cCB9" class="customCheckBoxInput" name="categories" value="Business" />
            <label for="cCB9" class="customCheckBoxWrapper">
              <div class="customCheckBox">
                <div class="inner">Business</div>
              </div>
            </label>
            <input type="checkbox" id="cCB10" class="customCheckBoxInput" name="categories" value="Science" />
            <label for="cCB10" class="customCheckBoxWrapper">
              <div class="customCheckBox">
                <div class="inner">Science</div>
              </div>
            </label>
            <input type="checkbox" id="cCB11" class="customCheckBoxInput" name="categories" value="Lifestyle" />
            <label for="cCB11" class="customCheckBoxWrapper">
              <div class="customCheckBox">
                <div class="inner">Lifestyle</div>
              </div>
            </label>
          </form>
        </div>

        <div class="Posts">

        </div>
      </main>

  `;
  return template;
}

export function postCards(posts) {
  let template = "";
  if (posts === null) {return ""}
  for (let post of posts) {
    let PostImage = "";
    if (post.Image != "") {
      PostImage = `<div class="PostImageContainer"><img class="PostImage" src="../${post.Image}" /></div>`;
    }

    template =
      template +
      `
          <div class="post" id="post${post.PostId}">
            <div class="PostContent">
              <div class="PostSenderContainer">
                <div class="SenderImageContainer">
                  <img src="../ProfileImages/${post.UserImg}" class="SenderImage" />
                </div>
                <div class="CaptionContainer">
                  <div class="ImageUserName">
                    <p>${post.UserName}</p>
                  </div>
                  <div class="ImageTime">
                    <p>${post.Time}</p>
                  </div>
                </div>
              </div>

              <div class="PostContentContainer">
                <p style="font-size: 18px;">${post.Title}</p>
                <p>${post.Content}</p>
               ${PostImage}
              </div>

              <div class="PostBtns">
                <div class="LikeButtons">
                  <div class="LikeContainer">
                    <p id="NumLike${post.PostId}">${post.Like}</p>
                    <label class="container">
                      <input type="checkbox" name="LikeCheckBox" id="Like${post.PostId}" value="${post.PostId}"/>
                      <svg class="LikeSVG" id="LikeSVG${post.PostId}" version="1.1" viewBox="0 0 32 32"
                        xml:space="preserve" xmlns="http://www.w3.org/2000/svg"
                        xmlns:xlink="http://www.w3.org/1999/xlink">
                        <path
                          d="M29.845,17.099l-2.489,8.725C26.989,27.105,25.804,28,24.473,28H11c-0.553,0-1-0.448-1-1V13  c0-0.215,0.069-0.425,0.198-0.597l5.392-7.24C16.188,4.414,17.05,4,17.974,4C19.643,4,21,5.357,21,7.026V12h5.002  c1.265,0,2.427,0.579,3.188,1.589C29.954,14.601,30.192,15.88,29.845,17.099z"
                          id="XMLID_254_"></path>
                        <path
                          d="M7,12H3c-0.553,0-1,0.448-1,1v14c0,0.552,0.447,1,1,1h4c0.553,0,1-0.448,1-1V13C8,12.448,7.553,12,7,12z   M5,25.5c-0.828,0-1.5-0.672-1.5-1.5c0-0.828,0.672-1.5,1.5-1.5c0.828,0,1.5,0.672,1.5,1.5C6.5,24.828,5.828,25.5,5,25.5z"
                          id="XMLID_256_"></path>
                      </svg>
                    </label>
                  </div>
                  <div class="DislikeContainer">
                    <p id="NumDislike${post.PostId}">${post.Dislike}</p>
                    <label class="container">
                      <input type="checkbox" name="LikeCheckBox" id="Dislike${post.PostId}" value="${post.PostId}"/>
                      <svg class="LikeSVG" id="DislikeSVG${post.PostId}" id="Glyph" version="1.1"
                        viewBox="0 0 32 32" xml:space="preserve" xmlns="http://www.w3.org/2000/svg"
                        xmlns:xlink="http://www.w3.org/1999/xlink">
                        <path
                          d="M2.156,14.901l2.489-8.725C5.012,4.895,6.197,4,7.528,4h13.473C21.554,4,22,4.448,22,5v14  c0,0.215-0.068,0.425-0.197,0.597l-5.392,7.24C15.813,27.586,14.951,28,14.027,28c-1.669,0-3.026-1.357-3.026-3.026V20H5.999  c-1.265,0-2.427-0.579-3.188-1.589C2.047,17.399,1.809,16.12,2.156,14.901z"
                          id="XMLID_259_"></path>
                        <path
                          d="M25.001,20h4C29.554,20,30,19.552,30,19V5c0-0.552-0.446-1-0.999-1h-4c-0.553,0-1,0.448-1,1v14  C24.001,19.552,24.448,20,25.001,20z M27.001,6.5c0.828,0,1.5,0.672,1.5,1.5c0,0.828-0.672,1.5-1.5,1.5c-0.828,0-1.5-0.672-1.5-1.5  C25.501,7.172,26.173,6.5,27.001,6.5z"
                          id="XMLID_260_"></path>
                      </svg>
                    </label>
                  </div>
                </div>
                <div class="CommentDeleteBtnsContainer">
                  <button type="button" class="Btn Delete" id="DeleteBtn${post.PostId}">
                    <div class="sign">
                      <svg viewBox="0 0 16 16" class="bi bi-trash3-fill" fill="currentColor" height="18" width="18"
                        xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06Zm6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528ZM8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5">
                        </path>
                      </svg>
                    </div>
                    <div class="text">Delete</div>
                  </button>
                  <button class="edit-button" id="EditBtn${post.PostId}">
                    <svg class="edit-svgIcon" viewBox="0 0 512 512">
                      <path
                        d="M410.3 231l11.3-11.3-33.9-33.9-62.1-62.1L291.7 89.8l-11.3 11.3-22.6 22.6L58.6 322.9c-10.4 10.4-18 23.3-22.2 37.4L1 480.7c-2.5 8.4-.2 17.5 6.1 23.7s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L387.7 253.7 410.3 231zM160 399.4l-9.1 22.7c-4 3.1-8.5 5.4-13.3 6.9L59.4 452l23-78.1c1.4-4.9 3.8-9.4 6.9-13.3l22.7-9.1v32c0 8.8 7.2 16 16 16h32zM362.7 18.7L348.3 33.2 325.7 55.8 314.3 67.1l33.9 33.9 62.1 62.1 33.9 33.9 11.3-11.3 22.6-22.6 14.5-14.5c25-25 25-65.5 0-90.5L453.3 18.7c-25-25-65.5-25-90.5 0zm-47.4 168l-144 144c-6.2 6.2-16.4 6.2-22.6 0s-6.2-16.4 0-22.6l144-144c6.2-6.2 16.4-6.2 22.6 0s6.2 16.4 0 22.6z">
                      </path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            </div>
          </div>
    `;
  }

  return template;
}

export function commentSection(post) {
  let template = `<div class="CommentsContainer" id="CommentsContainer${post.PostId}">
              <div class="UserComments" id="Comment${post.PostId}">
                <h3 class="CommentHeader">Comments</h3>`;

  const end = `</div>
              <div class="Message">
                <input id="CommentMessage${post.PostId}" title="Write Message" tabindex="i" pattern="\d+"
                  placeholder="Message.." class="MsgInput" type="text" />
                <button type="button" class="SendSVGContainer" aria-label="Send comment">
                  <svg xmlns="http://www.w3.org/2000/svg" version="1.0" width="30.000000pt" height="30.000000pt"
                    viewBox="0 0 30.000000 30.000000" preserveAspectRatio="xMidYMid meet" class="SendSVG">
                    <g transform="translate(0.000000,30.000000) scale(0.100000,-0.100000)" fill="#2b2b35" stroke="none">
                      <path
                        d="M44 256 c-3 -8 -4 -29 -2 -48 3 -31 5 -33 56 -42 28 -5 52 -13 52 -16 0 -3 -24 -11 -52 -16 -52 -9 -53 -9 -56 -48 -2 -21 1 -43 6 -48 10 -10 232 97 232 112 0 7 -211 120 -224 120 -4 0 -9 -6 -12 -14z">
                      </path>
                    </g>
                  </svg>
                </button>
              </div>
            </div>`;

  if (post.Comments === null) {
    return template + end;
  } else {
    for (let comment of post.Comments) {
      template = template + commentCard(comment)
    }
  }

  return template + end;
}

export function commentCard(comment) {
  const template = `
                <div class="Comment">
                  <img src="../ProfileImages/${comment.ProfileImage}" class="CommentProfileImage" />
                  <div class="CommentTextContainer">
                    <p class="UserNameText">${comment.UserName}</p>
                    <p class="CommentText" id="CommentText${comment.CommentId}">${comment.Text}</p>
                    <p class="CommentDate">${comment.Time}</p>
                  </div>
                  <div class="CommentButtonsContainer">
                    <div class="CommentLikeButtons">
                      <div class="CommentLikeContainer">
                        <p id="NumCLike${comment.CommentId}"> ${comment.CLike}</p>
                        <label class="container">
                          <input type="checkbox" class="CLike" id="CLike${comment.CommentId}" value="${comment.CommentId}"/>
                          <svg id="CLikeSVG${comment.CommentId}" class="LikeSVG CommentLikeSVG" id="Glyph" version="1.1"
                            viewBox="0 0 32 32" xml:space="preserve" xmlns="http://www.w3.org/2000/svg"
                            xmlns:xlink="http://www.w3.org/1999/xlink">
                            <path
                              d="M29.845,17.099l-2.489,8.725C26.989,27.105,25.804,28,24.473,28H11c-0.553,0-1-0.448-1-1V13  c0-0.215,0.069-0.425,0.198-0.597l5.392-7.24C16.188,4.414,17.05,4,17.974,4C19.643,4,21,5.357,21,7.026V12h5.002  c1.265,0,2.427,0.579,3.188,1.589C29.954,14.601,30.192,15.88,29.845,17.099z"
                              id="XMLID_254_"></path>
                            <path
                              d="M7,12H3c-0.553,0-1,0.448-1,1v14c0,0.552,0.447,1,1,1h4c0.553,0,1-0.448,1-1V13C8,12.448,7.553,12,7,12z   M5,25.5c-0.828,0-1.5-0.672-1.5-1.5c0-0.828,0.672-1.5,1.5-1.5c0.828,0,1.5,0.672,1.5,1.5C6.5,24.828,5.828,25.5,5,25.5z"
                              id="XMLID_256_"></path>
                          </svg>
                        </label>
                      </div>
                      <div class="CommentDislikeContainer">
                        <p id="NumCDislike${comment.CommentId}">${comment.CDislike}</p>
                        <label class="container">
                          <input type="checkbox" class="CDislike" id="CDislike${comment.CommentId}" value="${comment.CommentId}" />
                          <svg class="LikeSVG DisLikeSVG CommentLikeSVG" id="CDislikeSVG${comment.CommentId}" id="Glyph"
                            version="1.1" viewBox="0 0 32 32" xml:space="preserve" xmlns="http://www.w3.org/2000/svg"
                            xmlns:xlink="http://www.w3.org/1999/xlink">
                            <path
                              d="M2.156,14.901l2.489-8.725C5.012,4.895,6.197,4,7.528,4h13.473C21.554,4,22,4.448,22,5v14  c0,0.215-0.068,0.425-0.197,0.597l-5.392,7.24C15.813,27.586,14.951,28,14.027,28c-1.669,0-3.026-1.357-3.026-3.026V20H5.999  c-1.265,0-2.427-0.579-3.188-1.589C2.047,17.399,1.809,16.12,2.156,14.901z"
                              id="XMLID_259_"></path>
                            <path
                              d="M25.001,20h4C29.554,20,30,19.552,30,19V5c0-0.552-0.446-1-0.999-1h-4c-0.553,0-1,0.448-1,1v14  C24.001,19.552,24.448,20,25.001,20z M27.001,6.5c0.828,0,1.5,0.672,1.5,1.5c0,0.828-0.672,1.5-1.5,1.5c-0.828,0-1.5-0.672-1.5-1.5  C25.501,7.172,26.173,6.5,27.001,6.5z"
                              id="XMLID_260_"></path>
                          </svg>
                        </label>
                      </div>
                    </div>

                  </div>

                </div>`;
    return template
}

export function composerForm(data) {
  const template = `
        <form class="Post" id="PostForm" enctype="multipart/form-data">

          <input class="Title" placeholder="Title" name="Title" />
          <div class="ContentImageContainer">
              <textarea class="TextArea" placeholder="Content" name="Content" ></textarea>
            <label class="custum-file-upload" for="file">
              <div class="icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="" viewBox="0 0 24 24">
                  <g stroke-width="0" id="SVGRepo_bgCarrier"></g>
                  <g stroke-linejoin="round" stroke-linecap="round" id="SVGRepo_tracerCarrier"></g>
                  <g id="SVGRepo_iconCarrier">
                    <path fill=""
                      d="M10 1C9.73478 1 9.48043 1.10536 9.29289 1.29289L3.29289 7.29289C3.10536 7.48043 3 7.73478 3 8V20C3 21.6569 4.34315 23 6 23H7C7.55228 23 8 22.5523 8 22C8 21.4477 7.55228 21 7 21H6C5.44772 21 5 20.5523 5 20V9H10C10.5523 9 11 8.55228 11 8V3H18C18.5523 3 19 3.44772 19 4V9C19 9.55228 19.4477 10 20 10C20.5523 10 21 9.55228 21 9V4C21 2.34315 19.6569 1 18 1H10ZM9 7H6.41421L9 4.41421V7ZM14 15.5C14 14.1193 15.1193 13 16.5 13C17.8807 13 19 14.1193 19 15.5V16V17H20C21.1046 17 22 17.8954 22 19C22 20.1046 21.1046 21 20 21H13C11.8954 21 11 20.1046 11 19C11 17.8954 11.8954 17 13 17H14V16V15.5ZM16.5 11C14.142 11 12.2076 12.8136 12.0156 15.122C10.2825 15.5606 9 17.1305 9 19C9 21.2091 10.7909 23 13 23H20C22.2091 23 24 21.2091 24 19C24 17.1305 22.7175 15.5606 20.9844 15.122C20.7924 12.8136 18.858 11 16.5 11Z"
                      clip-rule="evenodd" fill-rule="evenodd"></path>
                  </g>
                </svg>
              </div>
              <input type="file" id="file" name="file" />
              <button type="button" class="Clear">Clear</button>
            </label>
          </div>
          <div class="Category">
            <p class="CategoriesText">
              Please select at least one category that is related to your post
            </p>
            <div class="customCheckBoxHolder">
              <input type="checkbox" id="cCB1" class="customCheckBoxInput" name="checkbox" value="News" />
              <label for="cCB1" class="customCheckBoxWrapper">
                <div class="customCheckBox">
                  <div class="inner">News</div>
                </div>
              </label>
              <input type="checkbox" id="cCB2" class="customCheckBoxInput" name="checkbox" value="Technology" />
              <label for="cCB2" class="customCheckBoxWrapper">
                <div class="customCheckBox">
                  <div class="inner">Technology</div>
                </div>
              </label>
              <input type="checkbox" id="cCB3" class="customCheckBoxInput" name="checkbox" value="Sports" />
              <label for="cCB3" class="customCheckBoxWrapper">
                <div class="customCheckBox">
                  <div class="inner">Sports</div>
                </div>
              </label>
              <input type="checkbox" id="cCB4" class="customCheckBoxInput" name="checkbox" value="Health" />
              <label for="cCB4" class="customCheckBoxWrapper">
                <div class="customCheckBox">
                  <div class="inner">Health</div>
                </div>
              </label>
              <input type="checkbox" id="cCB5" class="customCheckBoxInput" name="checkbox" value="Education" />
              <label for="cCB5" class="customCheckBoxWrapper">
                <div class="customCheckBox">
                  <div class="inner">Education</div>
                </div>
              </label>
              <input type="checkbox" id="cCB6" class="customCheckBoxInput" name="checkbox" value="Arts" />
              <label for="cCB6" class="customCheckBoxWrapper">
                <div class="customCheckBox">
                  <div class="inner">Arts</div>
                </div>
              </label>
              <input type="checkbox" id="cCB7" class="customCheckBoxInput" name="checkbox" value="Travel" />
              <label for="cCB7" class="customCheckBoxWrapper">
                <div class="customCheckBox">
                  <div class="inner">Travel</div>
                </div>
              </label>
              <input type="checkbox" id="cCB8" class="customCheckBoxInput" name="checkbox" value="Food" />
              <label for="cCB8" class="customCheckBoxWrapper">
                <div class="customCheckBox">
                  <div class="inner">Food</div>
                </div>
              </label>
              <input type="checkbox" id="cCB9" class="customCheckBoxInput" name="checkbox" value="Business" />
              <label for="cCB9" class="customCheckBoxWrapper">
                <div class="customCheckBox">
                  <div class="inner">Business</div>
                </div>
              </label>
              <input type="checkbox" id="cCB10" class="customCheckBoxInput" name="checkbox" value="Science" />
              <label for="cCB10" class="customCheckBoxWrapper">
                <div class="customCheckBox">
                  <div class="inner">Science</div>
                </div>
              </label>
              <input type="checkbox" id="cCB11" class="customCheckBoxInput" name="checkbox" value="Lifestyle" />
              <label for="cCB11" class="customCheckBoxWrapper">
                <div class="customCheckBox">
                  <div class="inner">Lifestyle</div>
                </div>
              </label>
            </div>
          </div>
          <button class="Download-button" type="submit">
            <svg xmlns="http://www.w3.org/2000/svg" height="16" width="20" viewBox="0 0 640 512">
              <path
                d="M144 480C64.5 480 0 415.5 0 336c0-62.8 40.2-116.2 96.2-135.9c-.1-2.7-.2-5.4-.2-8.1c0-88.4 71.6-160 160-160c59.3 0 111 32.2 138.7 80.2C409.9 102 428.3 96 448 96c53 0 96 43 96 96c0 12.2-2.3 23.8-6.4 34.6C596 238.4 640 290.1 640 352c0 70.7-57.3 128-128 128H144zm79-167l80 80c9.4 9.4 24.6 9.4 33.9 0l80-80c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-39 39V184c0-13.3-10.7-24-24-24s-24 10.7-24 24V318.1l-39-39c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9z"
                fill="white"></path>
            </svg>
            <span>Publish</span>
          </button>
        </form>
  `;
  return template;
}

export function conversationList(users) {
  let template = `<div class="DMtitle"> <p>Direct Messages</p> </div>`
  for (let user of users) {
    template = template + conversationItem(user)
  }
  return template
}

export function conversationItem(user) {
  let Status
  if (user.Status === "Online") {
    Status = `<div class="Status" style="background-color: green;"></div>`
  }else {
    Status = `<div class="Status"></div>`
  }

  let Notifications = ""
  if (user.Notifications != 0) {
    Notifications = `<div class="Notifications-container">
                    <p> ${user.Notifications}</p>
                    </div>`
  }
  let template = ` <div class="partner" id="${user.UserId}" value="${user.UserId}" >
                    <div class="PartnerImage-Container">
                      <img class="PartnerImage" id="${user.ProfileImg}" src="../ProfileImages/${user.ProfileImg}" />
                       ${Status}
                    </div>
                    <div class="TextContainer">
                      <p class="Username">${user.Username}</p>
                       <p class="ChatText">${user.LastMessage}</p>
                    </div>
                    ${Notifications}
                     <div class="Typing-container" id="Typing-container${user.UserId}">
                        <p></p>
                    </div>
                  </div>`
  return template
}
/*NumOfNotifications  int*/

export function loginForm(error) {
  let errorElement = "";
  if (error != "") {
    errorElement = `<p id="Error" style="color: red; font-size: small">${error}</p>`;
  }
  const template = `
       <form  class="main_form" id="Login_form" action="/" method="POST" >
        <p class="heading">Log in</p>
         ${errorElement}
        <br>
        <div class="inputContainer">
            <img class="inputIcon" src="../Style/Image/Profile.png">
            <input
              placeholder="Email or Username"
              id="username"
              name="username"
              class="inputField"
              type="text"
            />
          </div>


        <div class="inputContainer">
          <svg
            viewBox="0 0 16 16"
            fill="#2e2e2e"
            height="16"
            width="16"
            xmlns="http://www.w3.org/2000/svg"
            class="inputIcon"
          >
            <path
              d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"
            ></path>
          </svg>
          <input
            placeholder="Password"
            id="password"
            name="password"
            class="inputField"
            type="password"
          />
        </div>
        <button id="button" name="action" value="login" >Submit</button>
        <div class="signupContainer">
          <p>Don't have any account?</p>
            <button class="SignUp" id="SignUp" name="action" value="signup" type="button"> Sign Up</button>
        </div>
      </form>
    `;
  return template;
}

export function signUpForm(error) {
  let errorElement = "";
  if (error != "") {
    errorElement = `<p id="Error" style="color: red; font-size: small">${error}</p>`;
  }
  const template = `
    <form class="main_form" id="Signup_form" action="/SignUp" method="POST">
        <p class="heading">Sign up</p>
        ${errorElement}
        <div class="inputsContainer">
        <div class="inputContainer">
        <svg
            viewBox="0 0 16 16"
            fill="#2e2e2e"
            height="16"
            width="16"
            xmlns="http://www.w3.org/2000/svg"
            class="inputIcon"
          >
            <path
              d="M13.106 7.222c0-2.967-2.249-5.032-5.482-5.032-3.35 0-5.646 2.318-5.646 5.702 0 3.493 2.235 5.708 5.762 5.708.862 0 1.689-.123 2.304-.335v-.862c-.43.199-1.354.328-2.29.328-2.926 0-4.813-1.88-4.813-4.798 0-2.844 1.921-4.881 4.594-4.881 2.735 0 4.608 1.688 4.608 4.156 0 1.682-.554 2.769-1.416 2.769-.492 0-.772-.28-.772-.76V5.206H8.923v.834h-.11c-.266-.595-.881-.964-1.6-.964-1.4 0-2.378 1.162-2.378 2.823 0 1.737.957 2.906 2.379 2.906.8 0 1.415-.39 1.709-1.087h.11c.081.67.703 1.148 1.503 1.148 1.572 0 2.57-1.415 2.57-3.643zm-7.177.704c0-1.197.54-1.907 1.456-1.907.93 0 1.524.738 1.524 1.907S8.308 9.84 7.371 9.84c-.895 0-1.442-.725-1.442-1.914z"
            ></path>
          </svg>
          <input
            placeholder="Email"
            id="email"
            name="email"
            class="inputField"
            type="text"
          />
        </div>
        <div class="inputContainer">
            <img class="inputIcon" src="../Style/Image/Profile.png">
            <input
              placeholder="Username"
              id="username"
              name="username"
              class="inputField"
              type="text"
            />
          </div>
          </div>

           <div class="inputsContainer">
             <div class="inputContainer">
            <img class="inputIcon" src="../Style/Image/Profile.png">
            <input
              placeholder="First Name"
              id="FirstName"
              name="FirstName"
              class="inputField"
              type="text"
            />
          </div>

          <div class="inputContainer">
            <img class="inputIcon" src="../Style/Image/Profile.png">
            <input
              placeholder="Last Name"
              id="LastName"
              name="LastName"
              class="inputField"
              type="text"
            />
          </div>
          </div>

          <div class="inputsContainer">
           <div class="inputContainer">
            <img class="inputIcon" src="../Style/Image/Profile.png">
            <input
              placeholder="Age"
              id="Age"
              name="Age"
              class="inputField"
              type="text"
            />
          </div>

           <div class="inputContainer">
            <img class="inputIcon" src="../Style/Image/Profile.png">
            <select
              placeholder="Gender"
              id="Gender"
              name="Gender"
              class="inputField"
              type="text"
            />
            <option value="" disabled selected>Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            </select>
          </div>
           </div>

        <div class="inputsContainer">
        <div class="inputContainer">
          <svg
            viewBox="0 0 16 16"
            fill="#2e2e2e"
            height="16"
            width="16"
            xmlns="http://www.w3.org/2000/svg"
            class="inputIcon"
          >
            <path
              d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"
            ></path>
          </svg>
          <input
            placeholder="Password"
            id="password"
            name="password"
            class="inputField"
            type="password"
            title="Password must contain at least 8 characters, including at least one letter, one number, and one special character."
          />
        </div>

        <div class="inputContainer">
            <svg
              viewBox="0 0 16 16"
              fill="#2e2e2e"
              height="16"
              width="16"
              xmlns="http://www.w3.org/2000/svg"
              class="inputIcon"
            >
              <path
                d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"
              ></path>
            </svg>
            <input
              placeholder="Confirm Password"
              id="ConfirmPassword"
              name="ConfirmPassword"
              class="inputField"
              type="password"
            />
          </div>
           </div>

        <button id="button" name="action" value="signup">Submit</button>
        <div class="signupContainer">
          <p>Have an account?</p>
          <div>
            <button class="SignUp Login" id="Login" name="action" value="login" type="button"> Log in </button>
          </div>
        </div>
      </form>
    `;
  return template;
}
