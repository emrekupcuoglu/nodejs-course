/* eslint-disable import/prefer-default-export */
/* eslint-disable no-undef */
import axios from "axios";

import { showAlert } from "./alerts.mjs";

const loginFetch = async (email, password) => {
  // To make this work we can import the AppError utility class here as well and then create an error using that in a json format than thro that error
  // and in the catch block we can use JSON.parse to parse the stringified JSON back into an object and print that
  // or we can just use axios
  // or if we don't need the stack trace etc. or if we only have a handful of items in the error object we can just use it as it is like here
  try {
    const res = await fetch("http://127.0.0.1:8000/api/v1/users/login", {
      method: "POST",
      headers: {
        //With this we tell the API the data we are
        //going to send will be in a json format
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    console.log(data);
    if (!res.ok) throw new Error(`${data.message} ${data.error.statusCode}`);
  } catch (err) {
    console.log("ERROR", err);
  }
};

export const login = async (email, password) => {
  try {
    // console.log(email, password);
    const res = await axios({
      method: "POST",
      url: "http://127.0.0.1:8000/api/v1/users/login",
      data: {
        email,
        password,
      },
    });

    if (res.data.status === "success") {
      showAlert("success", "Logged in successfully!");
      setTimeout(() => {
        window.location.assign("/");
      }, 1500);
    }
    console.log(res);
  } catch (err) {
    showAlert("error", err.response.data.message);
  }
};

export const logout = async () => {
  try {
    const res = await axios("http://127.0.0.1:8000/api/v1/users/logout");
    if (res.data.status === "success") {
      // ! It is very important to set this to true
      // ! This forces the reload to happen from the server instead of the cache
      showAlert("success", "Logged out successfully!");
      setTimeout(() => {
        window.location.assign("/");
      }, 1500);
    }
  } catch (err) {
    showAlert("error", err.response.data.message);
  }
};
