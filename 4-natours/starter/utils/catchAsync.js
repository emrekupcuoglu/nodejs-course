// ?Using catchAsync Instead of try catch Block
// The function we pass into catchAsync which is called fn inside the catchAsync function
// is an async function.
// Async functions return promises and when there is an error inside an async function
// that basically means that the promise gets rejected.
// In here where we call that function we can catch that error using the .catch() block.
// We catch it here instead of catching it in the try catch block
// const catchAsync = (fn) => {
//   // eslint-disable-next-line no-unused-expressions
//   fn(req, res, next).catch((err)=>next(err));
// };
// Right now the function above has no way of knowing what the req, res, next is
// To pass the req, res, next to the catchAsync function we need to wrap it in a
// wrapper function and let express pass those value to the function
// Express.js can pass in those values because express will call that function not us.
// Express.js need a function not a value to work so we need to return a function
// and then the Express.js can call the function we returned when it needs to.

// eslint-disable-next-line arrow-body-style
module.exports = (fn) => {
  return (req, res, next) => fn(req, res, next).catch((err) => next(err));
};
