// ?Events in Practice

// To use the built in node events we nee to require the events module
// EventEmitter is a class
const EventEmitter = require("events");
const http = require("http");

// !If you were to use this pattern in real life ist is best to create a new class that inherits from the node event emitter
// This mechanism of extending the EventEmitter class is basically how other core node modules
// like https, fs and many others implement events internally.
// So all of them inherit from the EventEmitter class
class Sales extends EventEmitter {
  constructor() {
    super();
  }
}
// To create a new emitter we create an instance of the class we imported
const myEMitter = new Sales();
// EventEmitters can emit named events and we can listen to these event (basically subscribe to them)
// and react accordingly.
// It's a bit like setting up an event listener on a DOM event.

// We are creating the listener and
// the callback function that will be executed as soon as the event is emitted.
myEMitter.on("newSale", () => {
  console.log("There was a new sale");
});

// Let's add another event listener, one of the nice things about event emitters
// is that we can add multiple listeners for the same event.
myEMitter.on("newSale", () => {
  console.log("Customer name: Emre");
});

myEMitter.on("newSale", (stock) => {
  console.log(`There are ${stock} items remaining in stock`);
});

// Let's pretend that we are building an online store
// We can make up any event name we want.
// emitter emits the event and the listeners observe the emitter
// and wait until it emits a new sale event.
// We can also pass in arguments to the event listener by passing them as
// additional arguments in the emitter
myEMitter.emit("newSale", 9);

//##################
// *Creating a small web server and listening to events it emits
const server = http.createServer();

server.on("request", (req, res) => {
  console.log("Request received");
  res.end("Request received");
});
server.on("request", (req, res) => {
  console.log("Another request received");
});

server.on("close", () => console.log("Server closed"));

// We start the server with server.listen
server.listen(8000, "127.0.0.1", () => {
  console.log("Waiting for requests...");
});
