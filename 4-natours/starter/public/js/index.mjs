/* eslint-disable no-undef */

// axios doesn't support ES6 modules

import "core-js/stable";
import "regenerator-runtime/runtime";

import { login } from "./login.mjs";
import { displayMap } from "./mapBox.mjs";

// console.log("axios", axios);

// * DOM ELEMENTS
// This creates an error on pages that don't have the map because we try to parse a data from a DOM element that doesn't exist.
// const locations = JSON.parse(document.getElementById("map").dataset.locations);
// To fix this we first get the DOM element and then only parse the data if it exist.
const mapBox = document.querySelector("#map");
const loginForm = document.querySelector(".form");

// * VALUES
if (loginForm) {
  const email = document.querySelector("#email");
  const password = document.querySelector("#password");
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    login(email.value, password.value);
  });
}
// * DELEGATION
// We need to get the tour location data but we don't need to do an AJAX request to the API for that
// We can expose the location data in the HTML and use that in the JavaScript
if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);
  displayMap(locations);
}
