const Tour = require("../models/tourModel");
const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.getOverview = catchAsync(async (req, res, next) => {
  // 1. Get tour data from collection
  const tours = await Tour.find();
  // 2. Build the template

  // 3. Render the template

  // Instead of using .json() we use .render() to render the page.
  // .render() will render the template with the name we pass in.
  // We don't need to specify the .pug extension because Express.js will know we are looking for that file.
  // It will look for this file inside the folder we have specified in the beginning
  // so it will search it in the views folder
  // We can pass in variables to the pug template using an options object
  // These variables are called locals in the pug file
  res.status(200).render("overview", {
    title: "All Tours",
    tours,
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: "reviews",
    fields: "review rating user ",
  });

  if (!tour) return next(new AppError("No tour found", 404));

  res.status(200).render("tour", {
    title: `${tour.name} tour`,
    tour,
  });
});

exports.getLoginForm = (req, res) => {
  res.status(200).render("login");
};
