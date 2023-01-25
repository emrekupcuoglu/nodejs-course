/* eslint-disable no-undef */
/* eslint-disable import/prefer-default-export */
import axios from "axios";
import { async } from "regenerator-runtime";
import { showAlert } from "./alerts.mjs";

// !NOT USED FOR EDUCATION PURPOSES
// We haven't done this like this because we don't want to render an error page
// instead we want to display an error badge when the form fails.
// To do that we send the response and if there is an error we render that error badge on the client-side.
// For this we have used our API.

/**
 * @param string name
 * @param string email
 */
export const updateUserData = async (name, email) => {
  const excludedNames = ["", " "];
  const isValidName = !excludedNames.includes(name);
  if (!isValidName) {
    return showAlert("error", "Invalid name");
  }
  try {
    const res = await axios.patch("http://127.0.0.1:8000/submit-user-data", {
      name,
      email,
    });
    console.log(res);
    if (res.statusText === "OK") {
      showAlert("success", "User data successfully changed");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  } catch (err) {
    console.log(err);
    showAlert("error", err.response.data.message);
  }
};

/**
 * @param {Object} data - Data object to be sent.
 * @param {string|string} [type="data"] - Default value is "data", if updating photo type is "photo", if value is "password" it updates the password.
 */

export const updateSettings = async (data, type = "data") => {
  // Name validation is a complex topic that needs further read
  const excludedNames = ["", " "];
  const isValidName = !excludedNames.includes(data.userName);
  if (!isValidName) return showAlert("error", "Invalid name");
  const url =
    type === "password"
      ? "http://127.0.0.1:8000/api/v1/users/updatePassword"
      : "http://127.0.0.1:8000/api/v1/users/updateMe";
  try {
    if (type === "photo") {
      const res = await axios.patch(url, data);
      return res.data.data.user.photo;
    }
    const res = await axios.patch(url, data);
    showAlert("success", `${type} updated successfully`);
  } catch (err) {
    console.log(err);
    showAlert("error", err.response.data.message);
  }
};
