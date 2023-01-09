/* eslint-disable no-undef */

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

const login = async (email, password) => {
  try {
    const res = await axios({
      method: "POST",
      url: "http://127.0.0.1:8000/api/v1/users/login",
      data: {
        email,
        password,
      },
    });

    if (res.data.status === "success") {
      window.location.assign("/");
    }
    console.log(res);
  } catch (err) {
    console.log(err.response.data);
  }
};

document.querySelector(".form").addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.querySelector("#email").value;
  const password = document.querySelector("#password").value;
  login(email, password);
  // loginFetch(email, password);
});
