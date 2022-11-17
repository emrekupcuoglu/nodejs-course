const AppError = require("../utils/appError");

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};
const handleDuplicateErrorDB = (err) => {
  const entry = Object.entries(err.keyValue)[0];
  const key = entry[0];
  const value = entry[1];

  const message = `Duplicate field:${key} value: ${value}. Please use another value.`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  // We can either do this or just use the message mongoose gives us
  // like this return new AppError(err.message)
  // We have used this for better customization of the error messages and learning purposes
  const keys = Object.keys(err.errors);
  const errors = keys.map((key) => err.errors[key].message);
  const message = `Invalid input data. ${errors.join(". ")}`;
  return new AppError(message, 400);
};
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to the client.
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });

    // Programming or other unknown error: do not leak error details.
  } else {
    // 1. Log error for developers
    // There are real logging libraries on npm that we could use here instead of just having this simple console.error
    // but just logging the error to hte console will make it visible onb the hosting platforms that we are going to use.
    // In a simple app like this it is enough.
    console.error("ERROR bomb:", err.name);

    // 2. Send generic error message to the client
    res.status(err.statusCode).json({
      status: "error",
      message: "Something went very wrong!",
    });
  }
};

module.exports = (err, req, res, next) => {
  // This shows us the stack trace
  // console.log(err.stack);

  // We need to read which code to send from the error object
  // We need to define a default because there will be errors that are not coming from us
  // for example errors created by the node application
  // These errors might not have error status code so we need a default error code.
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, res);
  }
  if (process.env.NODE_ENV === "production") {
    // We are creating a copy of the err
    // because it is not a good practice to change the arguments of a function
    let error = { ...err };
    // console.log(error);

    // Marking errors coming from mongoose as operational
    // Types of the errors mongoose is throwing is written in the value property of the error
    // Cast Error happens when mongoose tries to cast types and fails
    if (err.name === "CastError") {
      // We will create a new function and pass the error to that function
      // and that function will return a new error created from our own AppError class
      error = handleCastErrorDB(err);
    }

    // duplicate error doesn't have a name because it doesn't come from
    // mongoose but it comes from mongoDB and mongo has codes for errors.
    if (err.code === 11000) {
      error = handleDuplicateErrorDB(err);
    }

    // Handling Validation Errors
    if (err.name === "ValidationError") {
      error = handleValidationErrorDB(err);
    }
    sendErrorProd(error, res);
  }
};
