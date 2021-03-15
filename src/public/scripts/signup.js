const username = document.querySelector("#username");
const password1 = document.querySelector("#password1");
const passwrod2 = document.querySelector("#password2");
const flash = document.querySelector("#flash");

/**
 * Check the length of usename and password, validate 2 passwords.
 * If everything seems OK submit the form to the server
 */
document.querySelector("form").addEventListener("submit", (ev) => {
  if (username.value.length < 4 || username.value.length > 20) {
    flash.innerHTML =
      "username length should be greater than 4 or less than 20";
    ev.preventDefault();
  }

  if (password1.value.length < 8 || password1.value.length > 20) {
    flash.innerHTML =
      "password length should be greater than 8 or less than 20";
    ev.preventDefault();
  }

  if (password1.value !== passwrod2.value) {
    flash.innerHTML = "password doesn't match";
    ev.preventDefault();
  }
});
