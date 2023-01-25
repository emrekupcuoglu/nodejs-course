const mongoose = require("mongoose");
const Tour = require("./tourModel");
const AppError = require("../utils/appError");

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
    // We did reference the tours in the review document using the parent referencing in the course
    // but I think it would be better to embed the tours into the review because we would not query a review without the tour
    // and a review can be for only one tour
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

// ? Preventing Duplicate Reviews
// We want each user to be only able to review each tour only once
// To fix this we need to make both the review and user unique together
// ! If this doesn't work then it is because you already have duplicate reviews in your collection
// First delete them, then the index then run this again
// If it doesn't work then delete the whole collection and import it again
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });
// We can also do this in the reviewCOntroller when creating a review using the updateOne instead of createOne and using the upsert option
// we would query for reviews that have the user id and the tour id and if a review with the user id and the tour id exist
// then it means the user has review that tour and we would update the tour;
//  if there is no review then it means the user has not review that tour and with the upsert option it will create a new review

reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: "user",
    select: "name photo",
  });
  // We have decided not to populate the reviews with tour because it causes an unnecessary populate chaining and it is not good for performance.
  //Because we have the tour being populated with reviews but the reviews also get populated with the tour again and also with the user, the tour inside the review is alto getting populated with guides
  // and it is not really needed to have the tours on the reviews for this user case
  // .populate({
  //   path: "tour",
  //   select: "name",
  // });
  next();
});

// ? Static Methods
// In a static method the this keyword points to the model instead of the document like in the instance methods
// We used a static method because we need the model for the aggregate pipeline
// We use instance methods when we want to operate on a single document
// and static methods when we want to operate on the whole collection
// ! It might be better for performance to calculate averages on create, update, and delete operation instead of using the aggregation pipeline
// I am not sure if it is better for performance but it probably is to just do this when creating, updating or deleting reviews directly in the reviewController
// But if we do this we need changes to the handler factory or out right not use it at all which probably would be the better choice
// const tour = Tour.findById(tour)
// tour.ratingsAverage=(tour.ratingsQuantity*ratingsAverage+newRating)/(tour.ratingsQuantity+1)
// tour.ratingsQuantity=ratingsQuantity+1
// But this is part of the course and we might have done it like this to learn about static methods and why use them instead of instance methods
// and how to update a document with the value from the aggregate pipeline. Or maybe it is better/doesn't affect the performance.
reviewSchema.statics.calcAverageRating = async function (tourID) {
  try {
    const stats = await this.aggregate([
      {
        $match: { tour: tourID },
      },
      {
        $group: {
          _id: "$tour",
          nRatings: { $sum: 1 },
          avgRating: { $avg: "$rating" },
        },
      },
    ]);
    console.log(stats);
    if (stats.length > 0) {
      await Tour.findByIdAndUpdate(tourID, {
        ratingsQuantity: stats[0].nRatings,
        ratingsAverage: stats[0].avgRating,
      });
    } else {
      await Tour.findByIdAndUpdate(tourID, {
        ratingsQuantity: 0,
        ratingsAverage: 4.5,
      });
    }
  } catch (err) {
    throw new Error(err);
  }
};

// We use a post middleware because to calculate the average ratings we need the last rating to be also saved in to the collection
// otherwise only the ratings from before are calculated
reviewSchema.post("save", async function (doc, next) {
  // ! This is important info that is hard to find online
  // We need a way to use the model in this pre hook
  // But in a pre hook the this keyword points to the document
  // And we can not simply do Review.calcAverageRating because Review is not yet defined at this point
  // and we can not put the pre hook after the model has been created because model uses reviewSchema
  // to be created, and if we put this after then we won't have access to this middleware
  // Fortunately there is a work around this
  // We can use the this.constructor
  // Because the document is created from the model this.constructor still points to the model
  try {
    await this.constructor.calcAverageRating(this.tour);
    next();
  } catch (err) {
    next(new AppError("Something Went Wrong!", 500));
  }
});

// ! Important Information About Passing Data From middleware to middleware
// Because the reviews are updated or deleted using findByIdAndUpdate or findByIdAndDelete
// We can not use document middleware. We only have access to query middleware on these events.
// And a query doesn't  have direct access to the current document in order to do something similar to what we did above,
// because we need access to the current review so that from there we can extract the tourID and calculate the statistics from there
// and for these hooks we only have query middleware.
// But we can go around this limitation using this trick.
// We are going to implement a pre middleware for these hooks
// This RegEx will work for findByIdAndUpdate and findByIdAndDelete because findById is just a shorthand for findOne
// reviewSchema.pre(/^findOneAnd/, async function (next) {
// To get access to the current review document we need to execute the query and that will give us the document that is being currently processed.
// But we are using a pre hook and with the pre hook we can not calculate the average ratings for the current review so this review will not be included in the statistics
// and we can't simply use a post hook like we did with the save hook above because if we do that we no longer have access to the query because the query has already executed.

// We need a way to pass information between the pre hook and the post hook
// so we set a property in the pre hook and use it in the post hook
// * We use clone and not FindOne because we execute the query here but then we try to execute the same query in the updateOne factory handler again
// and mongoose thinks that it doesn't make sense so we clone the query
// this.r = await this.clone().findOne();
// console.log(this);
// next();
// });

// reviewSchema.post(/^findOneAnd/, async function (doc, next) {
//   await this.r.constructor.calcAverageRating(this.r.tour);
//   next();
// });
// ! We have done all of the above with the only goal of having access to the document but we can do this without that trick
// We have access to the document inside the post hook because the query is already executed and mongoose makes it available to us
reviewSchema.post(/^findOneAnd/, async (doc, next) => {
  await doc.constructor.calcAverageRating(doc.tour);
});

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
