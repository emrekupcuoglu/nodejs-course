const express = require("express");

const userController = require("../controllers/userController");
const authController = require("../controllers/authController");

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

// /signup route doesn't follow the REST philosophy
// normally in REST philosophy name of the url has nothing to do with the cation that is being performed
// but here we are signing the user in so the url is related to the action.
// But we can have some other end point that don't follow it if we need to
router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/forgotPassword", authController.forgotPassword);
// This is path because only the users password is modified
router.patch("/resetPassword/:token", authController.resetPassword);

// ? After this point we need the authController.protect middleware on all routes
// We can add them to all of the routes manually or we can do better
// Because the protect is a middleware and middlewares are run in sequence
// and the router that we have created at the beginning is like a middle application
// and just like with the regular app we can use middleware on this router as well.
// This will run the authController.protect middleware on all of the routes starting from now
// This middleware won't run for the code above because middleware runs in sequence.
router.use(authController.protect);

router.patch("/updatePassword", authController.updatePassword);
router.get("/me", userController.getMe, userController.getUser);
router.patch("/updateMe", userController.updateMe);
router.delete("/deleteMe", userController.deleteMe);

// Because all the routes below this require admin access
// we used a middleware instead of adding it manually to all routes
router.use(authController.restrictTo("admin"));

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
