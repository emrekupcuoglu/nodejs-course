/* eslint-disable no-undef */

// axios doesn't support ES6 modules

import "core-js/stable";
import "regenerator-runtime/runtime";

import { login, logout, sendForgotPasswordEmail } from "./login.mjs";
import {
  updateSettings,
  updatePassword,
  resetPassword,
} from "./updateSettings.mjs";
import { displayMap } from "./mapBox.mjs";

// console.log("axios", axios);

// * DOM ELEMENTS
// This creates an error on pages that don't have the map because we try to parse a data from a DOM element that doesn't exist.
// const locations = JSON.parse(document.getElementById("map").dataset.locations);
// To fix this we first get the DOM element and then only parse the data if it exist.
const mapBox = document.querySelector("#map");
const loginForm = document.querySelector(".form--login");
const logoutBtn = document.querySelector(".nav__el--logout");
const userDataForm = document.querySelector(".form-user-data");
const userPasswordForm = document.querySelector(".form-user-password");

const forgotPasswordForm = document.querySelector(".form-forgot-password");
const resetPasswordForm = document.querySelector(".form-reset-password");

if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.querySelector("#email").value;
    const password = document.querySelector("#password").value;
    login(email, password);
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", (e) => {
    e.preventDefault();
    logout();
  });
}

// Forgot password
if (forgotPasswordForm) {
  forgotPasswordForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.querySelector("#email").value;
    await sendForgotPasswordEmail(email);
  });
}

// Reset Password
if (resetPasswordForm) {
  resetPasswordForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const password = document.querySelector("#password").value;
    const passwordConfirm = document.querySelector("#password-confirm").value;
    resetPassword({ password, passwordConfirm });
  });
}

if (userDataForm) {
  // Update user settings
  const photoUploadBtn = document.querySelector(".form__upload");
  const photoEl = document.querySelector(".form__user-photo");
  const photoNavEl = document.querySelector(".nav__user-img");

  if (photoUploadBtn) {
    photoUploadBtn.addEventListener("change", async (e) => {
      e.preventDefault();
      const form = new FormData();
      form.append("photo", document.querySelector("#photo").files[0]);
      const photoId = await updateSettings(form, "photo");

      if (photoId) {
        photoEl.src = `/img/users/${photoId}`;
        photoNavEl.src = `/img/users/${photoId}`;
      }
    });
  }
  userDataForm.addEventListener("submit", (e) => {
    e.preventDefault();
    // To send files using the API we have built instead of sending using the HTML forms
    // we need to programmatically create multipart form-data
    // To do that we create a new FormData instance
    // and onto that form we keep appending data.
    const form = new FormData();
    // Basically one append for each data we want to send.

    form.append("name", document.querySelector("#name").value);
    form.append("email", document.querySelector("#email").value);
    // To get the photo we user .files instead of .value
    // And these files are actually an array and since there is only one we can just select it
    // form.append("photo", document.querySelector("#photo").files[0]);
    // our AJAX call using axios will recognize this form here as an object and work
    //just the same as it did before.
    updateSettings(form);
  });
}

// Update password

if (userPasswordForm) {
  const passwordCurrentEl = document.querySelector("#password-current");
  const passwordNewEl = document.querySelector("#password");
  const passwordConfirmEl = document.querySelector("#password-confirm");
  userPasswordForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    document.querySelector(".btn--save-password").textContent = "Updating...";
    const passwordCurrent = passwordCurrentEl.value;
    const passwordNew = passwordNewEl.value;
    const passwordConfirm = passwordConfirmEl.value;
    // await updateSettings(
    //   { passwordCurrent, passwordNew, passwordConfirm },
    //   "password"
    // );

    updatePassword({ passwordCurrent, passwordNew, passwordConfirm });

    document.querySelector(".btn--save-password").textContent = "Save password";
    passwordCurrentEl.value = "";
    passwordNewEl.value = "";
    passwordConfirmEl.value = "";
  });
}

if (mapBox) {
  // * DELEGATION
  // We need to get the tour location data but we don't need to do an AJAX request to the API for that
  // We can expose the location data in the HTML and use that in the JavaScript
  const locations = JSON.parse(mapBox.dataset.locations);
  displayMap(locations);
}
