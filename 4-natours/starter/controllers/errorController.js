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
    console.error("ERROR", err);

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
    sendErrorProd(err, res);
  }
};
