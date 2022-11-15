module.exports = (err, req, res, next) => {
  // This shows us the stack trace
  // console.log(err.stack);

  // We need to read which code to send from the error object
  // We need to define a default because there will be errors that are not coming from us
  // for example errors created by the node application
  // These errors might not have error status code so we need a default error code.
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });
};
