const express = require("express");
const tourController = require("../controllers/tourController");
const authController = require("../controllers/authController");
const reviewRouter = require("./reviewRoutes");

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
// A param middleware only runs for certain parameters.
// So basically when we have a certain parameter in our url
// In our example (for now) the only parameter we have is the id
// We can write middleware that only runs the id parameter is present in the url

// We first specify the parameter we want to search for
// The parameter for which the middleware is going to run
// Then we specify our middleware function
// In the middleware function addition to he req, res, and next()
// We also have access to a fourth argument
// That argument is the value of the parameter in question
// !We have refactored the code so the checkID method no longer exist
// router.param("id", tourController.checkID);

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

// ? Nested Routes
// Right now we are calling the review controller in the tour route this doesn't make much sense
// We will fix this later
// We will use an advanced express feature called mergeParams to fix this
// router
//   .route("/:tourId/reviews")
//   .post(
//     authController.protect,
//     authController.restrictTo("user"),
//     reviewController.createReview
//   );

// ? Nested Routes with Express.js
// router.use("/:tourId/reviews",reviewRouter) means that the tourRouter should use the review router in case it ever encounters a route like this
// This is just like how we did it in the app.js
// In there we say that it should use this router if it ever encounters a route that we specify it is the same here as well
// But there is one piece missing, because right one the reviewRouter doesn't have access to the tourId parameter
// We need to enable the reviewRouter to get access to the tourId parameter.
// We have done this in the reviewRouter
router.use("/:tourId/reviews", reviewRouter);

// ?ALIASING
// Let's say that we have a route that is commonly visited
// Like the top 54 and cheapest tours
// We can create a route for that
// This is called aliasing
// We still want to get all the tours so we use that function
// But we want to prefill some of the query fields
// We can use a middleware for that
router
  .route("/top-5-cheap")
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route("/tour-stats").get(tourController.getTourStats);
router
  .route("/monthly-plan/:year")
  .get(
    authController.protect,
    authController.restrictTo("admin", "lead-guide", "guide"),
    tourController.getMonthlyPlan
  );

// We can use a query string for this like
// router.route("/tours-withing?distance=231&center=45&latlng=-40,45&unit=km");
// But we choose to go with the parameter router because it looks cleaner
router
  .route("/tours-within/:distance/center/:latlng/unit/:unit")
  .get(tourController.getToursWithin);

router.route("/distances/:latlng/unit/:unit").get(tourController.getDistances);

router
  // Instead of:
  // .route("/api/v1/tours")
  // we use:
  .route("/")
  // because the tourRouter already only runs on "/api/v1/tours"
  // So the root of the tourRouter is already "/api/v1/tours"
  // *Protecting routes
  // We don't allow users to see all tours without a login
  // We run the protect middleware on routes we want to protect.
  // If the user is authenticated then the next middleware will run
  // If the use is not authenticated then there will be an error and
  // the next middleware in the stack will not run.
  .get(tourController.getAllTours)
  .post(
    // Here we have 2 middlewares in the same post() method
    // Which is fine it runs them from right to left
    // We don't need the checkBody anymore so we comment it out

    // tourController.checkBody,
    authController.protect,
    authController.restrictTo("admin", "lead-guide"),
    tourController.createTour
  );

// app
//   .route("/api/v1/tours")
//   .get(getAllTours)
//   .post(createTour);

// *Info About Middleware
// If we put a middleware here and send a get or post request to the
// "/api/v1/tours" middleware will not executed
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
  .patch(
    authController.protect,
    authController.restrictTo("admin", "lead-guide"),
    tourController.updateTour
  )
  .delete(
    authController.protect,
    // To implement authorization we use the .restrictTo() method
    // We will pass in the user roles that are authorized to interact with this resource.
    // In this case deleting a tour.
    // admins and lead-guides can delete tours but not normal guides or users
    // *This normally doesn't work because express needs to call this middleware function when this route gets a request
    // *But right now we are calling the function
    // *To fix restrictTo returns a function and we use that function as middleware.
    authController.restrictTo("admin", "lead-guide"),
    tourController.deleteTour
  );

module.exports = router;
