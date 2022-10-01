// ?Requiring Modules in Practice

//Proving that the node wraps the code inside IIFE

// Arguments is an array and this array contains
// all the values that were passed in to a function
// So if we log this arguments array to the console
// If we actually see some values there then it means we are really inside a function

// console.log(arguments);
// 1st argument is the exports
// 2nd one is the require
// 3rd one is the module inside module we have exports(module.exports )
// 4th one is the __filename
// 5th one is the __dirname

// We can require the "module" module to show the wrapper function
// "module" 's a module node.js uses internally

// console.log(require(`module`).wrapper);

// We can import the exported value and save it into a variable
// We can give it any name we want
const C = require(`./test-module-1`);
const calc1 = new C();
console.log(calc1.add(2, 5));
