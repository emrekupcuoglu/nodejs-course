// ?Event Loop In Practice
// It is exrteremely difficult to simulate the event loop properly.
// Because we can't really put many callbacks to all
// of the different callbacks queues all at the same time.
// That situation happens when a lot of request are
// coming into your app, but it is really hard to reolicate locally.

const fs = require("fs");
const crypto = require("crypto");

// For timing the amount of time that the processes take
const start = Date.now();

// !Changing the default thread pool size
// unfortunately we can't change the threal pool with the code below
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
  // And microtask have priority over macrotask and can happen at the end of any phase
  // So at the end of the polling phase the next tick is executed and then the setImmediate
  process.nextTick(() => console.log("process.nextTick"));

  // *Thread Pool
  // By default the size of the thread pool is 4
  // There are 4 threads doing computation at the same time
  // Thats why these 4 took aproximately the same time
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
// is becasue the event loop waits for stuff to happen in the
// polling phase (in the phase were I/O callbacks are handled).
// When the queue of callbacks are empty, which is the case in our example,
// we don't have any I/O callbacks. All we have are timers.
// Then the event loop will wait until there is an expired timer.
// But if we schedule a callback using setImmediate then that callback will actually
// be executed right away after the pollin phase even befeor the expired timer.
// In this example the timer expires right away but the event loop pauses
// in the polling phase so that the setImmediate callback is executed first.
