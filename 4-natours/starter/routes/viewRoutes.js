const express = require("express");
const viewController = require("../controllers/viewsController");
const authController = require("../controllers/authController");

const router = express.Router();

// ? Rendering Pages
// We usually always use GET for rendering pages on the browsers
router.get("/", authController.isLoggedIn, viewController.getOverview);
router.get("/tour/:slug", authController.isLoggedIn, viewController.getTour);
router.get("/login", authController.isLoggedIn, viewController.getLoginForm);
router.get("/me", authController.protect, viewController.getAccount);
// We haven't used this route to update user data
// this is for educational purposes
// router.patch(
//   "/submit-user-data",
//   authController.protect,
//   viewController.updateUserData
// );

module.exports = router;
