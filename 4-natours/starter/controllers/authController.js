//We will implement most of the user related stuff like creating new users
// logging users in or updating passwords in the authenticationController
const { promisify } = require("node:util");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const { appendFile } = require("node:fs");

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

exports.signup = catchAsync(async (req, res, next) => {
  // !This here is a major security flaw
  // Because we are creating the user using all the data that is coming in
  // with the body and like this anyone can specify the role as an admin
  // const newUser = await User.create(req.body);

  // To fix it we only get the data we need from the req.body
  await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
  });
  // !!!!!!!!!!!!IMPORTANT!!!!!!!!!!!!
  // We didn't just create the user and send it because if we do it like that we can not hide the password.
  // Even though the password is hashed it is still a bad practice to leak it.
  // We set the select to false in our schema so when we query for a document it doesn't send the password.
  // But this only works for searching the database not when creating a new user.
  // So we first create a new user then search for that user in the database and send that info
  // and with the select:false in the schema we don't send the password.
  const newUser = await User.findOne({ email: req.body.email });

  // The first argument is the payload, this an object for all the data we want to store
  // Second argument is the secret, configuration file is a perfect place to the secret
  // !Using the standard HSA256 encryption the secret should ne at least 64 characters long
  // !but longer the better. This is where many of the tutorials fail (this one included it told to use 32 characters ).
  // Third argument is an options object
  // We have specified the expiration time. We can use a special string like 90d and the
  // signing algorithm will automatically understand that as 90 days.
  const token = signToken(newUser._id);
  res.status(201).json({
    status: "success",
    token,
    data: {
      user: newUser,
    },
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1. Check if email and password exist
  if (!email || !password) {
    return next(new AppError("Please provide email and password", 400));
  }
  // 2. Check if the users exist && password is correct

  // We hide the password from the schema so we need a way to select it
  // When we want to select a field that is set to select: false by default
  // we need to add the + sign in front of it
  const user = await User.findOne({ email }).select("+password");

  // !We check both the password and the user at the same time because of security
  // We could of check them separately and tell the user if their email or password is wrong
  // but this give a potential attacker information about whether the email or password is correct.
  // But this is more vague we are not specifying what is incorrect.
  if (!user || !(await user.correctPassword(password)))
    return next(new AppError("Incorrect email or password", 401));

  // 3. If everything is ok, send the JWT to the client
  const token = signToken(user._id);
  res.status(200).json({
    status: "success",
    token,
  });
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;

  // *1. Getting the token and check if it exist
  // We check if the header with the authorization exist
  // Then we check if it starts with Bearer
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(
      new AppError("Yo are not logged in! Please log in to get access.", 401)
    );
  }

  // *2. Verification of the JWT
  // Third argument of this function is a callback that runs as soon as verification is completed
  // But we are working with promises for a long time an it is not good to mix callbacks and promises
  // *So lets promisify this function.
  // const promisify = function (token, secret) {
  //   return new Promise((resolve, reject) => {
  //     jwt.verify(token, secret, (err, decoded) => {
  //       resolve(decoded);
  //       reject(err);
  //     });
  //   });
  // };
  // const a = promisify(token, process.env.JWT_SECRET);
  // console.log("a", a);

  // *We can also use the built in node function promisify
  // We call th e promisify method from the utils module
  // and pass in the function.
  // We then call the function
  const jwtVerifyPromise = promisify(jwt.verify);
  const decoded = await jwtVerifyPromise(token, process.env.JWT_SECRET);
  console.log(decoded);

  // *3.Check if user still exist
  // This is the reason why we have the id in the payload
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) return next(new AppError("Please log in", 401));

  // *4. Check if user changed password after the JWT is issued
  // iat stands for issued at
  const isPasswordChanged = currentUser.changedPasswordAfter(decoded.iat);
  if (isPasswordChanged) {
    return next(new AppError("Please log in", 401));
  }

  // GRANT ACCESS TO THE PROTECTED ROUTE
  req.user = currentUser;
  next();
});

// Normally we can not pass in arguments to middleware functions
// To do that we are going to create a wrapper function
// and that function will return a function that we will use as middleware .
// ! This works thanks to closures
// When Express.js calls the function inside as a middleware the wrapper function is already executed and finished.
// So normally the inside function shouldn't have access to the roles variable, but
// because of closures it remembers where it "born" and what variables it had access to when it was "born"
// and because of this it can use the roles variable
// If it was not for closures we would of need to dote the roles array in the global
// scope so that it can continue to store the roles when the function has stopped execution.
exports.restrictTo = (...roles) => catchAsync(async (req, res, next) => {});
