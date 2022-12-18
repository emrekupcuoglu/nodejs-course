const mongoose = require("mongoose");
const User = require("./userModel");
const Tour = require("./tourModel");

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, "Enter a review"],
      minlength: [50, "A review must be at least 50 characters long"],
    },
    rating: {
      type: Number,
      required: [true, "A review must have a rating"],
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    tour: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tour",
      required: [true, "A review must belong to a tour"],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "A review must belong to a user"],
    },
  },
  {
    // In case of error "Cannot use 'in' operator to search for 'transform' in true" remember to use toObject like toObject:{virtuals:true}. toObject:true throws an error
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
);

reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: "user",
    select: "name photo",
  });
  // We have decided not to populate the reviews with tour because it causes an unnecessary populate chaining and it is not good for performance
  // and it is not really needed to have the tours on the reviews for this user case
  // .populate({
  //   path: "tour",
  //   select: "name",
  // });
  next();
});

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
