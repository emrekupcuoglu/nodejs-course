// !All errors that we create using the AppError class will we operational errors

// We will create our own error class instead of using the built in oen to streamline the process
// our error class will inherit from the built in Error class
class AppError extends Error {
  constructor(message, statusCode) {
    // We pass in the message to the built in Error class
    // because message is the only parameter the built in Error class accepts.
    super(message);
    this.statusCode = statusCode;
    // We don't need to pass in the status because it depends on the statusCode
    // If the status code starts with 400 it status is "fail" otherwise it is "error"

    this.status = this.statusCode.toString().startsWith("4") ? "fail" : "error";
    // All the errors that we create using this class will be operational errors.
    // We set the isOperational to true.
    // We do this because later we can test for this property
    // and only send back error messages back to the client for these operational error messages.
    // This is useful because some other crazy unexpected errors that might happen in our application
    // for example a programing error or some bug in one of the packages we require in our app
    // and these errors will not have the isOperational property on them.
    this.isOperational = true;

    // As a last step we need to get the stack trace
    // Stack trace shows us where the error happened
    // We need to preserve the stack trace and the same time not add this class to the stack trace
    // captureStackTrace creates a .stack property on the target object, which when accessed returns a string representing
    // the location in the code at which Error.captureStackTrace was called
    // First argument is the current object
    // Second argument is called constructorOpt optional and accepts a function. If given all frames above the function including itself
    // will be omitted from the generated stack trace.
    // The constructorOpt argument is useful for hiding implementation details of error generation from the user.
    Error.captureStackTrace(this);
    // console.log("this", this);
    // console.dir("this.constructor", this.constructor);
  }
}

module.exports = AppError;
