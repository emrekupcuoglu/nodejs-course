/* eslint-disable no-undef */
export const hideAlert = () => {
  const el = document.querySelector(".alert");
  if (el) el.parentElement.removeChild(el);
};

/**
 * @param string type
 * @param string msg */
export const showAlert = (type, msg) => {
  // Hide all alerts before showing a new alert
  hideAlert();
  const markup = `<div class = "alert alert--${type}">${msg}</div>`;
  document.querySelector("body").insertAdjacentHTML("afterbegin", markup);
  setTimeout(() => {
    hideAlert();
  }, 5000);
};
