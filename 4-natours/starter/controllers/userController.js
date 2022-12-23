const User = require("../models/userModel");
const APIFeatures = require("../utils/APIFeatures");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const handlerFactory = require("./handlerFactory");

const filterObj = (obj, ...allowedFields) => {
  const newObject = {};
  const keys = Object.keys(obj);
  keys.forEach((el) => {
    if (allowedFields.includes(el)) newObject[el] = obj[el];
  });
  return newObject;
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1.Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        "This route is not for password updates. Please use /updatePassword",
        400
      )
    );
  }

  // 2. Update user document

  // We will user findByIdAndUpdate because .update() method doesn't run validators by default
  // and we need the validators off because otherwise wee need to send the password and passwordConfirm in the body.
  // For this we can either use save with validators off or use update
  // We set the new to true so that it returns the updated document  instead of the old document

  // ! We can not let user put anything he wants inside the update query
  // ! Because he can update his role or other sensitive information he should not be able to
  // Like this: body.role:"admin"
  // We want to filter input
  const filteredBody = filterObj(req.body, "name", "email");
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  if (!req.user) return next("Please login!");

  const user = await User.findById(req.user.id).select("+password");
  if (!(await user.correctPassword(req.body.password))) {
    return next(new AppError("Wrong password", 403));
  }

  user.active = false;
  await user.save({ validateModifiedOnly: true });

  res.status(204).json({
    status: "success",
    data: { user: null },
  });
});

exports.createUser = (req, res) => {
  res.status(201).json({
    status: "success",
    message: "This route is not defined. Please use /signup instead.",
  });
};

exports.getAllUsers = handlerFactory.getAll(User);
exports.getUser = handlerFactory.getOne(User);

// DO NOT use for updating passwords
exports.updateUser = handlerFactory.updateOne(User);

exports.deleteUser = handlerFactory.deleteOne(User);
