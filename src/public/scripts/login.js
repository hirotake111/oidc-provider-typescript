const button = document.querySelector("#button");
const username = document.querySelector("#username");
const password = document.querySelector("#password");

button.addEventListener("click", function (e) {
  if (
    username &&
    password &&
    username.value.length > 3 &&
    password.value.length > 3
  ) {
    button.classList.add("button_disabled");
  }
});
