// ?STREAMS
// Streams are used to process (read and write) data piece by piece
// without completing the whole read or write operation,
// and therefore without keeping all the data in memory.
// For example when we read a file using streams
// we read part of the data do something with it
// then free our memory and repeat this until the entire files has been processed.
// Netflix and youtube are called streaming companies because they use the same principle
//Instead of waiting for the whole video to load the processing is done piece by piece
// or in chunks so you can start watching even before the entire files has finish downloading.
//This makes streams the perfect canidate for handling large volumes of data like video
// or data we are recievig piece by piece from an external source.
// Streaming makes the data process,ng more efficient in terms of memory
// because there is no need to keep the data in memory
// and also it is more efficient in terms of time
// because we an star processing data as it arrives
// rather than wait for everything to arrive.

// ?Node.JS Stream Fundamentals
// !Streams are instances of the EventEmitter class
// !All streams can emit and listen to events
// In node there are 4 fundamental types of streams
// --Readable Streams
// --Writable Streams
// --Duplex Streams
// --Transform Streams

// *Readable Streams
// We can read (consume) data from readabe steams
// Streams are everywhere in core node modulse just like events
// The data that comes in when a http server gets a request
// is actually a readable stream.
// So all the data that is sent with the requst comes in piece by piece
// We can also read a file piece by piece by using a read stream from the fs module
// which can be useful for large text files.
// We can listen and emit many events with readable streams
// * The most important events are the data and the end event.
// Data event is emitterd when there is a new piece of data to consume.
// End event is emitted as soon as there is no more data to consume.
// We also have important functions we can use on streams
// In the case of readable streams
// *the most important functions are pipe() and read()
// You'll see more about these functions later.

// *Writable Streams
// Writable streams are streams which we can write data
//http response that we can send back to the client is a writable stream.
// If we wanted to send a big video files to the client
// we would stream that result just like netflix or youtube.
//*The most important events are drain and finish
//*The most important functions are write() and end()

// *Duplex Streams
// Streams that are both readable and writable
// These are less common
// A good example is a web socket from the net module
//A web socket is basically a communication channel between the client
// and server that works in both directions
// and stays open once the connection has been established

// *Transform Streams
// Transform streams are duplex streams that can
//modify or transfor the data as it is read or written.
//a good example is the zlib core module to compress data

// ?Streams in Practice
// Let's say that for some reason we need to read a large file
// from the file system and send it to the client.
// There are multiple ways of doing this
// We'll start with the most basic one and move onto the best way.

const fs = require("fs");
const server = require("http").createServer();

server.on("request", (req, res) => {
  // * 1. Simply read the file into a variable and once that is done sent it to the client
  // his solution is fine in this case
  // But with this solution node will have to load the entire file into memory
  // Because only after that is ready it can send it.
  // This is a problem ifthe file is big and there are tons of request hitting your server.
  // Becasue a node process will queickly run out of resources and your app will quit working
  // This works for creating something small but in a production ready app you can't use this.
  //   fs.readFile(`${__dirname}/test-file.txt`, "utf-8", (err, data) => {
  //     if (err) console.log(err);
  //     res.end(data);
  //   });
  // * 2. Using Streams

  // This creates a stream from the data that is inside the text file.
  // Which we can consume in chunkes.
  //   const readable = fs.createReadStream(`${__dirname}/test-file.txt`);

  // Each time there is a new piece of data we can consume a readable stream emits
  // the data event. We can listen to that event
  //   readable.on("data", (chunk) => {
  // We will write the chunk we get from the readable stream
  // into a writable stream
  //     res.write(chunk);
  //   });

  // We also have the event when all the data is read
  // Basically when the stream finished reading the data from the file
  // We use the end event in this case
  //   readable.on("end", () => {

  // The end method signals that no more data will be written into this writable stream
  //     res.end("End of stream");
  //     console.log("Stream ended");
  //   });
  //   readable.on("error", (err) => {
  //     console.log(err);
  //     res.statusCode = 500;
  //     res.end("File not found");
  //   });

  // This approach works but there is still a problem
  // Our readable stream (the one we are using to read the files from the disk)
  // is much much more faster than actually sending the result with the response
  // writable stream over the network. This will overwhelm the response string
  // which can not handle all this incoming data so fast.
  // This problem is called backpressure
  // In this case backpressure happens because the response can't send the data
  // nearly as fast as it is recieving it from the file.
  // We ill fix it with solution 3

  // * Solution 3
  // The secret is to use the pipe operator
  // The pipe operator is available on all readable streams
  // and allows us to pipe the output of a readable stream
  // into the input of a writable stream.
  // This fixes the problem of backpressure because behind the scenes
  // it will automaticly handle the speed of the data coming in
  // and the speed of the data going out.

  const readable = fs.createReadStream(`${__dirname}/test-file.txt`);

  // We need a readable source and we use the pipe method on it
  // and pass in the writable destination as an argument.
  // readableSource.pipe(writableDest)
  readable.pipe(res);
});

server.listen(8000, "127.0.0.1", () => {
  console.log("started listening");
});

// !!!!!!!!!!!!1IMPORTANT!!!!!!!!!!!!!
// pipeline takes in any number of arguments
// first arguments are the streams to be piped and the last one is a callback function
//We can also promisify the pipeline with the promisify() function from the util module
// and use it with async/await.

// Use the pipeline method instead of pipe
// When we use pipe
// If the response will quit or the client closes the connection
// the read stream is not closed or destroyed which leads to a memory leak.

// pipeline automaticly closes streams when an error occurs
// We can also pass in a callback function to do something after the stream ends
// !BEWARE that when we use the callback function to send a response about the error
// !it will not work because node will destroy the socket before we can send the response

// const server = http.createServer((req, res) => {
//   const fileStream = fs.createReadStream('./fileNotExist.txt');
//   pipeline(fileStream, res, (err) => {
//     if (err) {
//       console.log(err); // No such file
//       // this message can't be sent once `pipeline` already destroyed the socket
//       return res.end('error!!!');
//     }
//   });
// });
