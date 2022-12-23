const express = require("express");
const reviewController = require("../controllers/reviewController");
const authController = require("../controllers/authController");

// ? Nested Routes with Express.js and mergeParams
// For reviewRouter to get access to the tourId from the tourRouter
// We need to set the mergeParams option in the express.Router() to true
// We need this option because by default each router only has access to the parameters of their specific routes.
// But here in this route, so in this URL for this POST request there is no tourId
// but we still want to get access to the tourID that  is in the other router.
// In order to access get access to that parameter we need to merge the parameters.
const router = express.Router({ mergeParams: true });

// We protect all routes in the reviewRoutes
router.use(authController.protect);

router
  .route("/")
  .get(reviewController.getAllReviews)
  .post(
    authController.restrictTo("user"),
    reviewController.setTourAndUserIds,
    reviewController.createReview
  );

router
  .route("/:id")
  .get(reviewController.getReview)
  .patch(
    authController.restrictTo("admin", "user"),
    reviewController.updateReview
  )
  .delete(
    authController.restrictTo("admin", "user"),
    reviewController.deleteReview
  );

module.exports = router;
