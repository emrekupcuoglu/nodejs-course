const mongoose = require("mongoose");
const dotenv = require("dotenv");

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
app.listen(port, () => {
  console.log(`app running on port ${port} `);
});