const Review = require("../models/reviewModel");
const handlerFactory = require("./handlerFactory");

// exports.getAllReviews = catchAsync(async (req, res, next) => {
//   const filter = {};
//   // If this is is a regular API call without nested routes then this will not run and the filter simply be the empty object
//   // and will return every review
//   // If this is a API call from a nested route than we will only find reviews for that specific tour.
//   if (req.params.tourId) {
//     filter.tour = req.params.tourId;
//   }
//   const reviews = await Review.find(filter);
//   res.status(200).json({
//     status: "success",
//     results: reviews.length,
//     data: {
//       reviews,
//     },
//   });
// });

exports.setTourAndUserIds = (req, res, next) => {
  // We have turned this into its own function because we want to
  // use the handlerFactory function to create the createReview handler
  // Allow nested routes
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

exports.getAllReviews = handlerFactory.getAll(Review);
exports.getReview = handlerFactory.getOne(Review);
exports.createReview = handlerFactory.createOne(Review);
exports.updateReview = handlerFactory.updateOne(Review);
exports.deleteReview = handlerFactory.deleteOne(Review);
