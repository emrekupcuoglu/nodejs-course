// We are using module.exports when we want to export a single variable
// This is a class expression
// Notice how it doesn't have a name
module.exports = class {
  add(a, b) {
    return a + b;
  }

  multiply(a, b) {
    return a * b;
  }

  divide(a, b) {
    return a / b;
  }
};

