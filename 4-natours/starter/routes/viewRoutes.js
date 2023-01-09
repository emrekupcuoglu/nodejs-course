const express = require("express");
const viewController = require("../controllers/viewsController");
const authController = require("../controllers/authController");

const router = express.Router();

router.use(authController.isLoggedIn);

// ? Rendering Pages
// We usually always use GET for rendering pages on the browsers
router.get("/", viewController.getOverview);
router.get("/tour/:slug", viewController.getTour);
router.get("/login", viewController.getLoginForm);

module.exports = router;
