const express = require("express");
const tourController = require("../controllers/tourController");

// !Creating a router for each resource 
// We have created a new router and saved it to a variable.
// So instead of using app like this:
// app
//  .route("/api/v1/tours")
//  .get(getAllTours)
//  .post(createTour);
// We will use router instead of app

const router = express.Router();



// ?Param Middleware
// A param middleware only runs for ceratin parameters.
// So basically when we have a certain parameter in our url
// In our example (for now) the only parameter we have is the id
// We can write middleware that only runs the id parameter is present in the url

// We first specify the parameter we want to search for
// The parameter for which the middleware is going to run
// Then we specify our middleware function
// In the middleware function addition to he req, res, and next()
// We aldo have acces to a fourth argument
// That argument is the value of the parameter in question
router.param("id", tourController.checkID);



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
// If that requests contains some data that was sent tahtn taht data should be on the request object
// Out of the box express.js doesn't put that body data on the request.
// In order to have that data available we have to use a middleware
// We'll go into more detail about middleware but for now we will use a simple middleware
// app.post("/api/v1/tours", createTour);
// app.patch("/api/v1/tours/:id", updateTour);
// app.delete("/api/v1/tours/:id", deleteTour);

// *If we needed to change the version or the resource name
// * we would need to change it in everywhere
// *We can use the route() mothod to simplify this
// *Code below is the same as:
// app.get("/api/v1/tours", getAllTours);
// But with the route method we can chain the post method as well
// because they have the same API end point 

router
  // Instead of:
  // .route("/api/v1/tours")
  // we use:
  .route("/")
  // because the tourRouter already only runs on "/api/v1/tours"
  // So the root of the tourRouter is already "/api/v1/tours"
  .get(tourController.getAllTours)
  .post(tourController.checkBody, tourController.createTour);

// app
//   .route("/api/v1/tours")
//   .get(getAllTours)
//   .post(createTour);

// *Info About Middleware
// If we put a middleware here and send a get or post request to the
// "/api/v1/tours" middleware will not exucuted
// Because middleware comes after the route handler.
// This happens because route handlers are middleware as well.
// And the route handler ends the request - response cycle.
// By sending a result with the res.json() we end the cycle.
// So the next middleware in the stack will not be called because the cycle is already is finished.
// app.use((req, res, next) => {
//   console.log("Hello from the middleware 2");
//   next();
// });
router
  .route("/:id")
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(tourController.deleteTour);

module.exports = router;
