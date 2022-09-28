// ?Event Loop In Practice
// It is exrteremely difficult to simulate the event loop properly.
// Because we can't really put many callbacks to all
// of the different callbacks queues all at the same time.
// That situation happens when a lot of request are
// coming into your app, but it is really hard to reolicate locally.

const fs = require("fs");

setTimeout(() => {
  console.log("Timer 1 finished");
}, 0);

setImmediate(() => console.log("Immediate 1 finished"));

fs.readFile("./test-file.txt", "utf-8", () => {
  console.log("I/O finished");
});

console.log("Hello from the top-level code");
