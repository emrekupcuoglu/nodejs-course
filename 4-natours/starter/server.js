const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });
const app = require("./app");

// To use the variables inside the config.env file
// we need to call the dotenv.config() with the path to the config.env file
// This command will read our variables from the file
// and save them into node.js environment variables

// To see which environment we are in
// This is set by epxress
console.log(app.get("env"));

// node.js also sets a lot of environment variables
// console.log(process.env);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`app running on port ${port} `);
});


