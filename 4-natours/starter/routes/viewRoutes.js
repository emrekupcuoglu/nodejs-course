const express = require("express");
const viewController = require("../controllers/viewsController");

const router = express.Router();

// ? Rendering Pages
// We usually always use GET for rendering pages on the browsers
router.get("/", viewController.getOverview);

router.get("/tour/:slug", viewController.getTour);

module.exports = router;
