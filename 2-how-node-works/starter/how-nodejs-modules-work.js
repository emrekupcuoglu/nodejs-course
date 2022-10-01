//? How requiring modules really work?
//Each JavaScript file is treated as a seperate module
//Node.js uses the CommonJS module system: require(), exports or module.exports
//ES module system is used in browsers (and in node to some extent)
//
//?What happens When We Require() a Module?
//As a very broad overview following steps executed behind the scenes
//First Path to the requierd module is resolved and the file is loaded
//then a prcoess called wrapping happens
//after that module code is executed
//and the module exports are returned
//and finally the entire module gets cached
//
//* How does node know which file to load when we require module
//Because we can load 3 different kinds of modules
//Core modules, our own modules, and 3rd party modules.
//This prcoess is called as resolving the file path
//* PATH RESOLVING: HOW NODE DECIDES WHICH MODULE TO LOAD
//* 1. Start with core modules
//* 2. If it begins with "./" or "../" => Try to load a developer module
//* 3. If no file found => Try to find folder with index.js in it.
// Because we don't have to specify the file extension
// e.x. require("./lib/controller") instead of require("./lib/controller.js")
// node will look for require("./lib/controller.js")
//If there is not a file in this path it will instead
//try to open index.js from the "lib/controller"
//* 4. Else => go to node_modules/ and try to find module there
//*If file can't be found an error is throw and the execution of the app is stopped
//
//* WRAPPING
// After the module is loaded, module's code is wrapped
//into a special function which will give us a couple of special objects.
//This step is where the magic happens.
//It is here where we get the answer to the question
//"Where does the require() funciton comes from, and why do we have access to it?"
//It is because the node.js takes the code of our module and puts it inside the
//immediatly invoked function expression(IIFE) below
//(functions(exports, require, module, __filename, __dirname){
// module code lives here
// })
//So node actually doesn't directly execute the code we write
//but instead it executes the wrapper function that contain our code in it's body.
//It also passes the exports, require, module ,__filename ,__dirname into it
//Thats why in every module we automaticly have access to stuff like the require function.and the __dirname.
//These are basically like global variables that are injected into each and every module
//By doing this node achieves two very important things
//* 1. Giving developers access to all these variables.
//* 2. It keeps the top-level variables that we defined in our modules private
// Scoped only to the current module instead of leaking everything into the global object.
//Imagine we declared a variable x in one of our modules and then included an npm module
//that also used a variable called x. Without this mechanism our own vairable would get overwritten
//and the entire app would not work.
//Each module having it's private module is crucial
//and it is achieved through this clever trick of wrapping our code into this special function.
//
//Let's take a look at each object our module gets
//require: function to require modules
//module: reference to the current module and most importing when exporting data
//exports: a reference to the module.exports, used toexport object from a module and most importing when exporting data
//__filename: absolute path of the current module's file
//__dirname: directory name of thecurrent module
//
//* EXECUTION
// The code in the wrapper function gets executed by the node runtime
//
//* RETURNING EXPORTS
// It is time for the require function to return something
// It returns the exports of the required function
// These exports are stored in the modules.exports object
//!module.exports is the returned object(important)
//In each module we can export variables which will in the end
//be returned by their require function.
//We do that by assigning variables to module.exports
//or to simply exports(which is simply a (pointer to module.exports)

//! When to use module.exports or just exports
//If all you want to do is to export just one variable like one class or one function
//we usually use module.exports and set it equal to the variable you want to export
//e.g.module.exports=Calculator;
//If you are looking to export multiple name variables# like multiple functions
//Then you should create these as properties of the exports object
// e.g.exports.add = (a,b)=>a+b
// exports.multiply =(a,b)=> a*b
//
//
//
//* CACHING
//Modules are cached after the first time they are loaded
//This means that if you require the same module multiple times
//you will always get the same result and the code in the modules
//are only exeuted once in the first call.
//In the subsequent calls the result is simply retrieved from cache
