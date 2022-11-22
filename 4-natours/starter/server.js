const mongoose = require("mongoose");
const dotenv = require("dotenv");

// ? UNCAUGHT EXCEPTIONS
// All errors that occur in our synchronous code but are not handled anywhere are called
// uncaught exception.
// Let's pretend we are trying to log some variable that doesn't exist
// console.log(doesNotExist)
// We get a ReferenceError and stack trace printed to the console
// We can fix it similarly to the unhandled rejections
// ! This event listener needs to be before any code
// ! otherwise it can not catch exceptions that happened before it is attached to the uncaught exception event
// ! Because this is at the top even if we have an error in the app.js file we can catch it.

// This time we are listening for the uncaughtException event
// What we are doing inside the callback is very similar as well
// We want to log the error so that it shows up in the logs in our server
// o that we can fix the error.
// Then gracefully closing the application
process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION! Shutting down...");
  console.log(err);
  // ! We don't need the server because uncaught exceptions happen only in synchronous code
  // ! and anything t odo with server is async
  // server.close(() => {
  //   // ! In the unhandled exception crashing the application is optional
  //   // ! but when there is an uncaught exception we really really need to crash the application
  //   // !Because after there is a uncaught exception
  //   // !the entire node process is in a so-called unclean state.
  //   // !To fixed that process needs to be terminated and restarted.
  //   // In production we should have a tool in place to restart the application.
  //   // Many hosting services do that out of the box.
  //   process.exit(1);
  // });

  process.exit(1);
});

// To use the variables inside of the config.env file
// we need to call the dotenv.config() with the path to the config.env file
// This command will read our variables from the file
// and save them into node.js environment variables
dotenv.config({ path: "./config.env" });
const app = require("./app");

const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

// First argument is the connection string
// mongoose returns a promise
mongoose
  .connect(DB)
  // This promise gets access to a connection object
  .then((con) => {
    // console.log(con.connections);
    console.log("DB connection successful");
  });

// To see which environment we are in
// This is set by express
console.log(app.get("env"));

// node.js also sets a lot of environment variables
// console.log(process.env);

const port = process.env.PORT || 3000;
// !!!!!!!!!!!!!!!!!!IMPORTANT!!!!!!!!!!!!!!
// app.listen is a convenience function
// It is same as doing http.createServer(options,app)
// Code below is what the app.listen does behind the scenes
// .this points to the app itself in this case
// app.listen = function () {
//   const server = http.createServer(this);
//   return server.listen.apply(server, arguments);
// };
// If we want to use it with an https
// We need to specify it with http.createServer(credentials,app)
const server = app.listen(port, () => {
  console.log(`app running on port ${port} `);
});

// ! ERRORS OUTSIDE OF EXPRESS.JS
// ? UNHANDLED REJECTIONS
// ! In Node.js it is not really a good practice to just blindly rely on these two error handlers that we have implemented here.
// ! Ideally errors should be handled where they occur.
// ! For example in the problem connection to the database we should add a catch handler there
// ! and not just simply rely on the unhandled rejection callback that we have.
// ! Some people even say we should't even use these at all! But we can use them as a safety net.
// Errors can occur outside of Express.js like when an error occurs
// during mongodb database connection express can not handle that error.
// Imagine the database is down for some reason or for some reason we can not log in.
// ######## This is not he case anymore right now it gives this error MongoServerError: bad auth : Authentication failed. ##########
// In that situation we get an error that says :unhandled promise rejection.
// This means that somewhere in our code there was a promise that got rejected
// but that rejection has not been handled anywhere.
// To handle this rejection we could go to the code block where we are handling the database connection
// and add a catch block so that we handle errors that occur there.
// But in a bigger application it can become a difficult to keep track of all the
// promises that might become rejected at some point.

// We will use even emitters and events to fix this issue globally
// Each time there is an unhandled rejection somewhere in our application
// the process object will emit an event called unhandled rejection.
// We can subscribe to that event just like this:
// * unhandledRejection event allows us to handle all the errors that occur in async code
process.on("unhandledRejection", (err) => {
  console.log(err);
  console.log("UNHANDLED REJECTION! SHUTTING DOWN...");
  // If we can't connect to the database because of the rejected error
  // we can not do much so we will shut down the application.
  // We can pass a code to the process.exit()
  // 0 stands for success and 1 stands for uncaught exception
  // process.exit() is a very abrupt way of ending a program
  // because this will immediately abort all the request that are currently still running
  // or pending.
  // Usually we shut down gracefully where we first close the server
  // and only then we shut down the application
  // By putting the process.exit() inside the server.close()
  // as a callback function we wait for the server to close
  // and then the callback function runs and shuts the app down
  // This way we are giving the server time to finish all the request
  // that is pending or being handled.
  server.close(() => {
    process.exit(1);
  });
  // We don't want top leave the application hanging forever like this.
  // Usually in a production app in a web server we would
  // have some kind of tool in place that would restart the app.
  // Also some of the platforms that host node.js do that on their own.
});

// ? UNCAUGHT EXCEPTIONS
// Uncaught exception handler is above because it needs to be before any code that can cause a uncaught exception error.

// console.log(x);
