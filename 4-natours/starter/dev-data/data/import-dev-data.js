const fs = require("fs");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Tour = require("../../models/tourModel");

dotenv.config({ path: "./config.env" });

const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

mongoose.connect(DB).then((con) => {
  console.log("DB connection successful");
});

// READ JSON FILE

const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/tours-simple.json`, "utf-8")
);

// IMPORT DATA INTO DB
const importData = async () => {
  try {
    // create method can also accept an array of objects
    // In that case it will create a new document for each object in the array
    await Tour.create(tours);
    console.log("Data successfully loaded!");
  } catch (err) {
    console.log(err);
  }
  // process.exit() is kind of an aggressive way of stopping an application
  // But in this case is is not a problem because it is a very small script
  process.exit();
};

// DELETE ALL DATA FROM COLLECTION
const deleteData = async () => {
  try {
    // If we use the deleteMany method without passing anything
    // It deletes every document in the collection
    await Tour.deleteMany();
    console.log("Data successfully deleted!");
  } catch (err) {
    console.log(err);
  }
  // process.exit() is kind of an aggressive way of stopping an application
  // But in this case is is not a problem because it is a very small script
  process.exit();
};

// We have run this command to run this script
// node dev-data/data/import-dev-data.js
// process.argv is an array of arguments of running the node process
// First item is the where node is located
// and the second item is where the import-dev-data.js is located
console.log(process.argv);

// We can add an option with the -- symbols
// When we write this: node dev-data/data/import-dev-data.js --import
// the third item in the argv array becomes --import
// This means that we can use the data inside the argv array to write
// a very simple command line application which will import
// the data when we specify the --import option and will
// delete the data when we specify the --delete option

if (process.argv[2] === "--import") importData();
if (process.argv[2] === "--delete") deleteData();
