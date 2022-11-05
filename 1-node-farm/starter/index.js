const hello = "Hello world";
console.log(hello);
// In a browser we would have to include this
// JavaScript file inside the html order to execute it
// But with node all we need to do is to
// write node {filename} to the terminal.
// REPL should be exited before running this code

// We can do thing we normally can not with JavaScript using node modules
// To use the node modules we require them into our code,
// store them in a variable then use them
// Normally modules are imported(required) at the top of the code
// but this is for learning purposes

// Module for reading files is called fs
const fs = require("fs");
const http = require("http");

// !url.parse is deprecated and prone top security issues be careful when using it
const url = require("url");

// slugify is a function we can use to create slugs
// Slug is the last part of a url that contains a unique string
// that identifies the resource that the website is displaying
const slugify = require("slugify");

// When using require there is an exception to using the dot
// Because when using the dot with require dot means the current directory
// not the directory where the script is running from
const replaceTemplate = require("./modules/replaceTemplate");

// **************************
// *FILES
// **************************

// Blocking, synchronous code
const readFile = function () {
  const textIn = fs.readFileSync("./txt/input.txt", "utf-8");
  console.log(textIn);

  const textOut = `This is what we know about the avocado: ${textIn}. \n Created on ${Date.now()}`;

  fs.writeFileSync("./txt/output.txt", textOut);
  console.log("File written!");
};

// readFile()

// Non-blocking, asynchronous code
const readFileAsync = function () {
  fs.readFile("./txt/start.txt", "utf-8", (err, data1) => {
    if (err) return console.log("ERROR!");
    fs.readFile(`./txt/${data1}.txt`, "utf-8", (err, data2) => {
      if (err) return console.log("ERROR!");

      console.log(data2);
      fs.readFile("./txt/append.txt", "utf-8", (err, data3) => {
        if (err) return console.log("ERROR!");

        fs.writeFile(
          "./txt/final.txt",
          `${data2}\n${data3}`,
          "utf-8",
          (err) => {
            console.log("Your file have been written 😀");
          }
        );
      });
    });
  });

  console.log("Start reading file");
};

// readFileAsync()

// We will implement this using the synchronous version instead of the async one
// This is not a problem because the top-level code will be executed only once
// But the code inside the servers callback will executed every time that code is called
// And that code is called every tme there is a request to the server
// We are using the sync version because it is easy to handle that data
// because that simply puts the data into a variable that we can use right away.
const data = fs.readFileSync(`${__dirname}/dev-data/data.json`, "utf-8");
const dataObj = JSON.parse(data);

const tempOverview = fs.readFileSync(
  `${__dirname}/templates/template-overview.html`,
  "utf-8"
);
const tempCard = fs.readFileSync(
  `${__dirname}/templates/template-card.html`,
  "utf-8"
);
const tempProduct = fs.readFileSync(
  `${__dirname}/templates/template-product.html`,
  "utf-8"
);

const slugs = dataObj.map((el) => slugify(el.productName, { lower: true }));
console.log("slugs", slugs);

// **************************
// *SERVER
// **************************
//We create the server using the createServer method of the https module
//createServer will accept a callback function which will be fired of
//each time a request hits our server.
// This callback function has access to two very important and fundamental variables
//The request and the respond variable
const server = http.createServer((req, res) => {
  // We used res.end to send a very simple response to the client

  // We need to pass in true to parse the query into an object
  // query is the part of the url after "?"
  // If we don't pass in true it shows the query like this
  // query: "id=0"
  // When we pass in true it shows like this:
  // query: [Object: null prototype] {id:"0"}
  // !url.parse is deprecated and prone top security issues be careful when using it
  const { query, pathname } = url.parse(req.url, true);
  // const pathName = req.url;

  // *OVERVIEW PAGE
  if (pathname === "/" || pathname === "/overview") {
    res.writeHead("200", {
      "Content-type": "text/html",
    });

    const cardsHtml = dataObj
      .map((el) => replaceTemplate(tempCard, el))
      .join("");
    const output = tempOverview.replace("{%PRODUCT_CARDS%}", cardsHtml);
    res.end(output);
  }

  // *PRODUCT PAGE
  else if (pathname === "/product") {
    res.writeHead("200", {
      "Content-type": "text/html",
    });
    const product = dataObj[query.id];
    const output = replaceTemplate(tempProduct, product);
    res.end(output);
  }
  // *API
  else if (pathname === "/api") {
    // Writing the path like that is not ideal
    // Because the dot in front represents the current directory where we are running the node from
    // If we were to run this from desktop than the dot would point to the desktop
    // fs.readFile("./dev-data/data.json");
    // There is a better way to do this

    // All Node.js scripts gets access to a variable called __dirname
    // And that variable always translates to the directory in which
    // the script we are currently executing is located
    // In this case it is the sme place but it can be executed from a different place
    // and in that case the program wouldn't work. So use this variable to save yourself the headache.
    // When using the require there is an exception to that
    // Because when using the dot there is means the current directory
    // not the directory where the script is running from
    // * COMMENTED OUT CODE STARTS HERE
    // fs.readFile(`${__dirname}/dev-data/data.json`, "utf-8", (err, data) => {
    // The data is in JSON so we need to parse it
    // JSON.parse will take the JSON(which is actually a string)
    // and turn it into a JavaScript object or an array in this case.
    // const productData = JSON.parse(data);

    // We need to tell the browser the type of the data we are sending
    // res.writeHead("200", {
    //   "Content-type": "application/json"
    // });

    // res.end method needs to send a string not an object
    // So we want to send the data directly without parsing it
    // res.end(data);

    // This works but it is not efficient
    // We are reading the data every time a user goes into the "/api"
    // Instead we can read the data once at the beginning and send
    // that data to the user that request it.
    // Implementation is above.

    // });

    res.writeHead("200", {
      "Content-type": "application/json",
    });
    res.end(data);
  }
  // *NOT FOUND
  else {
    // With write Head we can change the status code
    // And writeHead can also send header
    // We create an object and put the header there
    // An HTTP header is a piece of information
    // about the response we are sending back
    // We will learn more about this later
    // But know that there are many standard headers
    // that we can specify to inform the browser
    // or whatever client is receiving our response
    // about the response itself.
    // One of the standard headers informs the browser of the content type
    // If we set the content type to "Content-type": "html" browser will expect html
    // No that the browser is expecting html we can send an h1 element
    // We can also specify our own made up header
    // !Headers and the status code ALWAYS needs to be set up before we send the response
    res.writeHead("404", {
      "Content-type": "text/html",
      "my-own-header": "hello-world",
    });
    res.end("<h1>Page not found!</h1>");
  }
});

// Listening to incoming request from the client.
// listen accepts a couple of parameters first one is the port
// The port we usually use in node is 8000
// But you will see other numbers such as 3000
// A port is a sub-address on a certain host
// Second parameter is the host
// If we don't specify the host it will default
// to the local host. Local host is the current computer
// "127.0.0.1" ia the local host's ip address
// as on optional argument we can specify a callback function
// which will be run as soon as the server starts listening.
server.listen(8000, "127.0.0.1", () => {
  console.log("Listening to requests on port 8000");
});

// Summary: We created a server and passed in a callback
// that is executed each time a request hits the server.
// Than we started listening for incoming requests on local host port 8000
// Once we had all this running we did the request by hitting the url
// Than under the hood of node.js and event was fired
// and that event caused the callback function to be executed
// And as a result of that callback function we got the
// "Hello from the server" response

// Routing
// Routing basically means implementing different actions for different urls
// Routing can became very complicated in a big real world application
// In a real world application we use a tool like Express.js.
// We are going to do that in the next big project
// We will use Express.js to do all of that in that project
// But as we are starting to learn node we will learn
// how to do everything from scratch without any dependencies

// First step to routing is to analyze the url
// We use a built in node module for that which is called url

// API
// In the context of web API's an API is a service from which
// we can request some data
