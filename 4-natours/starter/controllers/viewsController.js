const Tour = require("../models/tourModel");
const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const { async } = require("regenerator-runtime");

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
  if (req.user) return res.redirect("/me");
  return res.status(200).render("login", {
    title: "Log in to your account",
  });
};

exports.getAccount = (req, res) => {
  res.status(200).render("account", {
    title: "Your account",
  });
};

// !NOT USED FOR EDUCATION PURPOSES
// We haven't done this like this because we don't want to render an error page
// instead we want to display an error badge when the form fails.
// To do that we send the response and if there is an error we render that error badge on the client-side.
// For this we have used our API.
exports.updateUserData = catchAsync(async (req, res, next) => {
  // We don't pass the whole req.body because we only want these field to be updated.
  // Because a hacker can submit additional fields to the HTML form and submit data like password etc.
  // And also passwords are handled separately because we can NEVER update passwords using findByIdAndUpdate
  // Because that will not run the save middleware which will take care of hashing passwords.
  // const name = req.body.name.trim();
  // ! Sanitizing names are a hard topic that need further read
  const excludedNames = ["", " "];
  const isValidName = !excludedNames.includes(req.body.name);
  if (req.body.name.length === 0 || !isValidName) {
    console.log("123");
    return next(new AppError("Name cannot be empty", 400));
  }
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email,
    },
    {
      new: true,
      runValidators: true,
    }
  );
  // We need to pass the updated user or otherwise the user the template will user is the user coming from the
  // protect middleware and that is the non-updated old user data.
  // This overwrites the res.locals.user = user we have in the protect middleware
  res.status(200).render("account", {
    title: "Your account",
    user: updatedUser,
  });
});
