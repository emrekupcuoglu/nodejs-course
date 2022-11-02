const express = require("express");

const userController = require("../controllers/userControllerBeforeRefactor");

// !Creating a router for each resource
// We have created a new router and saved it to a variable.
// So instead of using app like this:
// app
//  .route("/api/v1/tours")
//  .get(getAllTours)
//  .post(createTour);
// We will use router instead of app
const router = express.Router();

// 3. ROUTES
// app.get("/api/v1/tours", getAllTours);

// We use a colon to create an end point that can accept different values
// We essentially create a variable
// To make a parameter optional we can add a question mark after it
// app.get("/api/v1/tours/:id", getTour);

// We use the post method now because that is the kind of request we want to handle
// With the post request we can send data from client to the server
// This data is ideally available on the request
// The request object holds all the data about the request that was done
// If that requests contains some data that was sent than that data should be on the request object
// Out of the box express.js doesn't put that body data on the request.
// In order to have that data available we have to use a middleware
// We'll go into more detail about middleware but for now we will use a simple middleware
// app.post("/api/v1/tours", createTour);
// app.patch("/api/v1/tours/:id", updateTour);
// app.delete("/api/v1/tours/:id", deleteTour);

// *If we needed to change the version or the resource name
// * we would need to change it in everywhere
// *We can use the route() method to simplify this
// *Code below is the same as:
// app.get("/api/v1/tours", getAllTours);
// But with the route method we can chain the post method as well
// because they have the same API end point

router
  .route("/")
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route("/:id")
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
