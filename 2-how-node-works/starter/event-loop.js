// ?Event Loop In Practice
// It is extremely difficult to simulate the event loop properly.
// Because we can't really put many callbacks to all
// of the different callbacks queues all at the same time.
// That situation happens when a lot of request are
// coming into your app, but it is really hard to replicate locally.
const http = require("http");
const fs = require("fs");
const crypto = require("crypto");

// For timing the amount of time that the processes take
const start = Date.now();

// !Changing the default thread pool size
// unfortunately we can't change the thread pool with the code below
// UV_THREADPOOL_SIZE=1
// on Windows. It works on macOS and linux
// To change it on windows we need to change it on the command line before running the script
// We can do it like this
// set UV_THREADPOOL_SIZE=1 & node event-loop.js
// or make a script with these instructions, add it to the package.json
// and run it using the npm
// "scripts": {
//   "start": "set UV_THREADPOOL_SIZE=1 & node event-loop.js"
// },

// * First the top-level code is executed
// * But the order of the other 3 operations
// * are not determined by the event loop
// * Because they are not running in the event loop just yet.
// For that we need to move the setTimeout and the setImmediate inside a callback function
setTimeout(() => console.log("Timer 1 finished"), 0);
setImmediate(() => console.log("Immediate 1 finished"));
let a = 0;
for (let i = 0; i < 10000000000; i++) {
  a++;
}
console.log(a);

console.log(Date.now() - start, "for loop 1 finished");

fs.readFile("./test-file.txt", "utf-8", () => {
  console.log(Date.now() - start, "file read finished");
  let a = 0;
  for (let i = 0; i < 10000000000; i++) {
    a++;
  }
  console.log(a);
  console.log(Date.now() - start, "for loop 2 finished");

  console.log("---------- Running in the event loop --------------");

  // *We have put the setTimeout and the setImmediate inside this callback
  // * so that the event loop can call them
  setTimeout(() => console.log("Timer 2 finished"), 0);
  // Node waits for any timer running or
  // any on going I/O operation before exiting the application
  // Because this tier takes 3 seconds to finish it waits for this timer to expire
  // then finishes the program.
  setTimeout(() => console.log("Timer 3 finished"), 3000);
  setImmediate(() => console.log("Immediate 2 finished"));

  // Next tick is a misleading name because it happens before the next loop phase
  // instead of at the next tick(tick is an entire loop phase)
  // This happens before the stImmediate because next.tick is a microtask
  // And microtask have priority over macro task and can happen at the end of any phase
  // So at the end of the polling phase the next tick is executed and then the setImmediate
  process.nextTick(() => console.log("process.nextTick"));

  // *Thread Pool
  // By default the size of the thread pool is 4
  // There are 4 threads doing computation at the same time
  // Thats why these 4 took approximately the same time
  // and happened basically at the same time.

  // *The sync version blocks the event loop
  crypto.pbkdf2Sync("password", "salt", 100000, 1024, "sha512");
  console.log(Date.now() - start, "password encrypted");

  crypto.pbkdf2("password", "salt", 100000, 1024, "sha512", () => {
    console.log(Date.now() - start, "password encrypted");
  });
  crypto.pbkdf2("password", "salt", 100000, 1024, "sha512", () => {
    console.log(Date.now() - start, "password encrypted");
  });
  crypto.pbkdf2("password", "salt", 100000, 1024, "sha512", () => {
    console.log(Date.now() - start, "password encrypted");
  });
  crypto.pbkdf2("password", "salt", 100000, 1024, "sha512", () => {
    console.log(Date.now() - start, "password encrypted");
  });

  let b = 0;
  for (let i = 0; i < 10000000000; i++) {
    b++;
  }
  console.log(b);
  console.log(Date.now() - start, "for loop 3 finished");
});

console.log("Hello from the top-level code");

// !Important
// The reason that the immediate 2 finished before timer 2
// is because the event loop waits for stuff to happen in the
// polling phase (in the phase were I/O callbacks are handled).
// When the queue of callbacks are empty, which is the case in our example,
// we don't have any I/O callbacks. All we have are timers.
// Then the event loop will wait until there is an expired timer.
// But if we schedule a callback using setImmediate then that callback will actually
// be executed right away after the polling phase even before the expired timer.
// In this example the timer expires right away but the event loop pauses
// in the polling phase so that the setImmediate callback is executed first.

// !!!!!!!!!!!!IMPORTANT!!!!!!!!!!
// If the callback of an async function has synchronous code it will execute as synchronous.
// If there is an async function after the sync code it will have to
// wait for the sync code to finish. To avoid this put the async function above the synch code,
// this way async code still needs to waits the synch code to finish to output it's response
// but it will be running in the background as the sync code runs.
// So instead of starting to execute after the sync code finishes,
// it will start before the sync code
// but will wait the sync code to finish to return the result of it's callback function

// So when the callback function is put in the execution stack it acts like a top level code
// All the code in it will be run synchronously, if there is an async code in it,
// event loop will put it in the thread pool and when it finishes it's operation
// it will call the callback function of the async code to the
// execution stack to be run if the execution stack is empty;
// if it isn't empty it will wait until the execution stacks empty then put it in the execution stack.

// ?Event Driven Architecture
// The modules we used like the http,fs,crypto, timer are built around an event driven architecture.
// We can use this architecture to our own advantage
// In node there are certain objects called event emitters that emit events
// as soon as something important happens in the app like a request hitting a server
// timer expiring or a files finishing to read.
// These events then can be picked up by event listeners that we developers set up
// which will fire callback functions that are attached to each listener.
//  let' take a look at how node uses the event driven architecture to handle
// server requests.
const server = http.createServer();
server.on("request", (req, res) => {
  console.log("Request received");
  res.end("Request received");
});
// This implementation is a bit different than the one we did before
// but it works the exact same way.
// server.on method is actually how we create a listener
// In this case a listener for the request event
// When we have our server running and a new request is made
// server acts as an emitter. Server will emit an event each time
// a request hits the server.
// Since we already have a listener set up for this event
// the callback function we attached to this listener will be called.
// It works this way because behind the scenes server is
// actually an instance of the nodejs EventEmitter class.
// So it inherits all this event emitting and listening logic from
// the EventEmitter class
// *This event emitter logic is called the observer patter in the JavaScript programming.
// The idea is that there is an observer which is the event listener in this case
// which keeps observing the subject that will eventually emit the
// event that the listener is waiting for.
// The opposite of this pattern is simply functions calling other functions.
// The observer patterns was designed to react rather than to call.
// The huge benefit of using this patters is that everything is de-coupled.
// For example we don't have functions from the files system module calling
// functions from the http module because that would be a huge mess
// Instead these modules are nicely de-coupled and self contained, each emitting events
// other functions -even if they come from other modules- can respond to.
// Also using an event driven architecture makes it way more straightforward to
//react multiple times to the same event. ALl we have to do is to set up multiple listeners.
