//We will implement most of the user related stuff like creating new users
// logging users in or updating passwords in the authenticationController
const crypto = require("crypto");
const { promisify } = require("node:util");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const sendEmail = require("../utils/email");

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    // expires property makes it so the browser deletes the cookie after a certain time passes.
    // We can not just use Date.now() because Date.now() returns a number and we need a Date object
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    // secure property makes it so the cookie will only be sent over an encrypted connection
    // so basically we are using HTTPS
    // This ensures that man in the middle attacks don't work
    // *We added this conditionally below because we are using http, that is why it is commented out
    // secure: true,
    // httpOnly property makes it so the cookie can not be accessed or modified in any way by the browser
    // This is important to prevent XSS attacks
    httpOnly: true,
  };
  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

  // ? Sending a cookie
  // To send a cookie we attach it to the response object using the .cookie() method
  // First argument is the name of the cookie
  //Second is the data we actually want to send in the cookie
  // Third argument is the options object
  res.cookie("jwt", token, cookieOptions);
  // Remove password from the output
  user.password = undefined;
  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

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
  // !Using the standard HSA256 encryption the secret should be at least 64 characters long
  // !but longer the better. This is where many of the tutorials fail (this one included, it told to use 32 characters ).
  // Third argument is an options object
  // We have specified the expiration time. We can use a special string like 90d and the
  // signing algorithm will automatically understand that as 90 days.

  createSendToken(newUser, 201, res);
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
  createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  // We have created the token as a let because we want to access it from outside the  if statement
  // let token;

  // *1. Getting the token and check if it exist
  // We check if the header with the authorization exist
  // Then we check if it starts with Bearer
  // !We are using cookies so this is not necessary anymore
  // if (
  //   req.headers.authorization &&
  //   req.headers.authorization.startsWith("Bearer")
  // ) {
  //   token = req.headers.authorization.split(" ")[1];
  // }

  const token = req.cookies.jwt;

  if (!token) {
    return next(
      new AppError("You are not logged in! Please log in to get access.", 401)
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
  // *We need role field in the next middleware
  // *Instead  of querying for it again and taxing the database
  // *We will make it selectable here
  const currentUser = await User.findById(decoded.id).select("+role");
  if (!currentUser) return next(new AppError("Please log in", 401));

  // *4. Check if user changed password after the JWT is issued
  // iat stands for issued at
  const isPasswordChanged = currentUser.changedPasswordAfter(decoded.iat);
  if (isPasswordChanged) {
    return next(new AppError("Please log in", 401));
  }

  // GRANT ACCESS TO THE PROTECTED ROUTE
  // ! Storing the currentUser in to the request is really crucial
  // !Otherwise we wouldn't get access to the user in the next middleware restrictTo which we use for authorization.
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
exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    // we need to include role because we set select to false in the schema
    // We did this on the protect handler above
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action!", 403)
      );
    }
    next();
  };

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1. Get users based on POSTed email
  const user = await User.findOne({ email: req.body.email });

  if (!user)
    return next(
      new AppError(
        "If there is an account associated with that email we have sent a reset link"
      )
    );

  // 2. Generate random token
  const resetToken = user.createPasswordResetToken();

  // 3. Save it to the database
  // We have assigned a value to the passwordResetToken but not saved it to the database
  // We need to use the .save() method to save it to the database
  // ! We need to pass in the validateModifiedOnly for it to work because
  // ! .save() methods runs validators by default
  // ! problem arises when it tries to validate the passwordConfirm but it can not find it in the user document
  // ! it can not find it because we have deleted the passwordConfirm so that it doesn't waster any space in the database
  // ! and because passwordConfirm is required it fails.
  // ! This is why it only fails on passwordConfirm even though the password field is also required.
  // ! In a large codebase this bug might be hard to find to solve this we can be more explicit and use a virtual field for the passwordConfirm. (this might now work)
  await user.save({ validateModifiedOnly: true });

  // 4. Send it as email

  // A URL needs to start with http or https which is the protocol
  // We get which protocol we are using from the request
  // Then we get the host
  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to:${resetURL}.\nIf you didn't forget your password please ignore this email.`;

  // We need a try catch block we can not simply use the catchAsync function we have created
  // because we want to do more than just sending the error to the user.
  // If there is an error we want to delete the passwordReset and passwordResetExpires field from the user document.
  try {
    await sendEmail({
      email: user.email,
      subject: "Your password reset token (valid for 10 mins)",
      message,
    });

    res.status(200).json({
      status: "success",
      message: "Token sent to email!",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateModifiedOnly: true });

    // ! This is a security vulnerability because we are sending if we have sent an email or not.
    // ! look for password reset strategies on OWASP for more robust implementation
    return next(new Error(err));
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1. Get user based on the token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");
  // 2. If token not expired and user exist set the new password
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    // With Date.now() we get a timestamp but we store the date as a date time string
    // behind the scenes mongoDB will do some converting to be able to compare them so we don't have to
    // passwordResetExpires: { $gt: Date.now() },
  });
  console.log(user);

  if (!user) return next(new AppError("Token is invalid or expired", 400));
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  // We do not want to pass in validateModifiedOnly because we want to validate
  // if password and the passwordConfirm exist and they are the same.
  await user.save();
  // 3. Update passwordChangedAt property
  // 4. Log the user in
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1. Get user from collection
  if (!req.user) return next(new AppError("Please login", 401));
  const user = await User.findById(req.user.id).select("+password");
  // 2. Check if POSTed password is correct
  const currentPassword = req.body.passwordCurrent;
  if (!(await user.correctPassword(currentPassword)))
    return next(new AppError("Wrong password. Try again.", 401));
  // 3. If so update the password
  user.password = req.body.newPassword;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // 4. Log the user in, send JWT
  const token = signToken(user._id);
  res.status(200).json({
    status: "success",
    token,
  });
});
