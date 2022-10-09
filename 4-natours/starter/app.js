const fs = require("fs");
const express = require("express");
const exp = require("constants");
const { reverse } = require("dns");
// Express module return a funciton and we run that function
// and save its results to a variable caled app
const app = express();

// middleware
// A middleware is basically a function that can modify request data
// It is callled middleware because it stands in the middle of the request and response.
// It is just a step that the request goes through while it is beaing processed.
// The step the request goes through in this exapmle is really simple
// The data from the body is added to the request object.
// We need to use app.use to use middleware
app.use(express.json());

// *Creating our own middleware
// We need to the app.use to use the middleware
// We will pass in the function we want as middleware to the app.use as an argument
// In each middleware function we have access to the request and the response
// as well as the next function
app.use((req, res, next) => {
  console.log("Hello from the middleware");
  // We need to call the next() function
  // If we didn't call it the request - response cycle would get stuck
  // And we would not be able to move on to the next steps
  // And we would not be able to send a response to the client.
  next();
  // !The middleware we have created applies to every request because we didn't specify any route
  // !It will work on every request if it comes before route handlers
  // !If it comes after a route handler it will not work for that route

});

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});


// Routing in Express
// Routing is basically means to determine
// how and application responds to a certain client request
// The route is basically the url
// and the http method, which is get in this case
// app.get("/",
// This is similiar to the native way
// but in express the req and the res objects have a lot more data and methods

// (req, res) => {
// We need to add the status before we send the response to the client
// res.status(200).send("Hello from the server-side");

// send method sends a string but instead of sending a string
// we can send a json using the json method
// And by using the json() it will automaticly set our Content-type to application/json
//   res.status(200).json({
//     message: "Hello from the server-side",
//     app: "Natours"
//   });

// });

// app.post("/",
//   (req, res) => {
//     res.send("You can post to this URL");
//   });


// app.get("/api/v1/tours", (req, res) => {

// });

// const port = 3000;
// app.listen(port, () => {
//   console.log(`App running on port ${port}...`);
// });

// We use the postman to test this API


// ?What is an API?
// API stands for: Application Programming Interface
// It is a piece of software that can be used by another piece of software
//in order to allow applications to talk to each other.

// We have talked aboutweb API before and thery are the most commonly used APIs
// But there are more than web APIs.
// Application in API can be other things:
// Node.js' fs or http APIs("node APIs")
// Browser's DOM JavaScript API
// With object-oriented programming when exposing methods to the public
// we are creating an API
// And many more API for different purpouses.

// *REST Architecture
// REST stands for: Represantational State Transfer
// It is a way of building web APIs in a logical way making them easy to consume.
// We build an API for ourselves or for others to consume.
// We want to process of using the API as smooth as possible for the user.
// To build RESTful APIs we need to follow a couple of principles

// *1. Seperate API into logical resources
// *2. Expose structured resource-baed URLs
// *3. To perform different actions on data like reading writing or deleting data
// the API should use the http method NOT the URL
// *4. Send data as JSON (usually)
// *5. Be stateless

// *1. Resources
// The key abstraction of information in REST is a resource.
// Therefore all the data we want to share in the API should be divided into logical resources.
// Resource: Object or represantation of something, which has data associated to it.
// Any information that can be named can be a resource (name NOT a verb)
// In the context of the Natours API it can be:
// tours, users, reviews

// *2 Exposing
// Exposing the data using structured url taht the cllient can send request to.
// for example: https://www.natours.com/addNewTour
// for example: https://www.natours.com/getTour
// The entire adress is called an URL
// the /addNewTour is called an API endpoint
// Our API will have many differnt endpoints
// each of which wll send different data back to the client
// or perform different actions.
// !Endpoints should contain only resources(nouns), and use HTTP methods for actions
// So add addNewTour and getTour are bad choices for API endpoints
// Instead use GET /tours
// Instead use POST /tours
// We used the same API endpoint and change the method(verb)
// We can use the GET meethod to gert all the toursor
// or we can use and id or a name to oget a specific tour like:
// GET /tours/7
// We can use the POST method to create a new tour

// To update the resources either a PUT or a PATCH request should be made tp the endpoint
// Difference between them is wiht PUT the clilent supposed to send the entie updated object
// while with PATCH it is only supposed to send the part of the object that has been changed.
// POST is for creatingi a new  rsource whlie PUT and PATCH are for updating an existing resource

// Top delete a resource there is the DELETE http method

// *These operation are called CRUD: Create, Read, Update, Delete

// https://www.natours.com/getToursByUser
// https://www.natours.com/deleteToursByUser
// These end points can be transformed into
// "Get tours from user number 3"
// GET    https://www.natours.com/users/3/tours
// "Delete tour 9 from user number 3"
// DELETE https://www.natours.com/users/3/tours/9


// *What is JSON
// JSON is a very lightweight data interchange format,
// which is heavily used by web APIs coded in any programming language.
// It is not just related to JavaScript
// It is widely used because it is easy for both humans and computers to write JSON
// JSON looks like a JavaScript object with all the key/value pairs
// But there are some differences
// The most important one is that all the keys have to be strings
// It is also typical for valurs to be strings as well, but they be other things
// like numbers, true/false values, other objects, or even arrays of other values.

// Let's say that this is a data that we have in our database for a GET request to
// https://www.natours.com/tours/5
const JSON0 = {
  "id": 5,
  "tourName": "The Park Camper",
  "rating": "4.9",
  "guides": [
    {
      "name": "Steven Miller",
      "role": "Lead Guide",
    },
    {
      "name": "Lisa Brown",
      "role": "Tour Guide",
    }
  ],
};
// We could send it back like this to the client
// but we usually do some simple response formatting
// There are a couple of standarts for this
// we will use a very basic one called JSend
// We simply create a new object and add a status message to it
// in order to inform the clilent whether the was a success, failed, or error
// then we put our original data into a new object called data
// There are other standarts for response formatting like:
// JSON:API or ODATA JSON Protocol
const JSEND =
{
  "status": "data",

  "data": {
    "id": 5,
    "tourName": "The Park Camper",
    "rating": "4.9",
    "guides": [
      {
        "name": "Steven Miller",
        "role": "Lead Guide",
      },
      {
        "name": "Lisa Brown",
        "role": "Tour Guide",
      }
    ],
  }
};

// *5 Be Stateless
// ALl state is handled on the client
// This meand that each request must contain all the information
// neccessary to process a certain request.
// The server should not have to remember previous requests

// Exapmles of state: loggedIN    currentPage

// We call the JSON.parse to turn the JSON into a JavaScript object
// We do this because json() method of express.js automaticly turns JAvaScript object into JSON
// By calling the JSON.stringify() method

const toursData = JSON.parse(fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`));

const getAllTours = (req, res) => {
  console.log(req.requestTime);
  res.status(200).json({
    status: "success",
    requestedAt: req.requestTime,
    // results is not a part of the JSEND specification but it is nice to bea able to see the number of results on the client side 
    results: toursData.length,
    data: {
      // name of this property is tours because the name of the API end point is tours
      tours: toursData

    }
  });
};

const getTour = (req, res) => {
  // req.params are where all the parameters of (variables) we define here are stored
  console.log(req.params);
  const id = Number(req.params.id);
  const tour = toursData.find(el => el.id === id);


  if (!tour) return res.status(404).json({ status: "Fail", message: "Invalid ID" });

  res.status(200).json({
    status: "Success",
    data: {
      tour
    }
  });
};

const createTour = (req, res) => {

  const newID = toursData[toursData.length - 1] + 1;
  // newTour is the req.body + the newID 
  // We can use Object.assign for this
  const newTour = Object.assign({ id: newID }, req.body);
  toursData.push(newTour);
  // !When we write to the file it shouldn't appear when we try to acces it with a get method
  // !But it works because when we make a cahgne to the tours-simple.json file(manually or by an API)
  // !It save and restarts our server because of nodemon

  fs.writeFile(`${__dirname}/dev-data/data/tours-simple.json`, JSON.stringify(toursData), err => {
    // 201 stands for created
    res.status(201).json({
      status: "succes",
      data: {
        tour: newTour
      }
    });
  });

  // We always have to send back somethingin order to finish the
  // so called request - response cycle.
  // res.send("Done");

};

const updateTour = (req, res) => {
  // We will not implement this here
  // Will do that later when we work with a database instead of files
  res.status(200).json({
    status: "Success",
    data: {
      tour: "<Updated Tour>"
    }
  });
};

const deleteTour = (req, res) => {
  // We will not implement this here
  // Will do that later when we work with a database instead of files

  // 204 is code for no content
  // We usually do not send any data back
  // we usually only send null
  res.status(204).json({
    status: "Success",
    data: {
      tour: null
    }
  });

};

// app.get("/api/v1/tours", getAllTours);

// We use a colon to create an end point that can accept different values
// We essentially create a variable
// To make a parameter optional we can add a question mark after it
// app.get("/api/v1/tours/:id", getTour);

// We use the post method now because that is the kind of request we want to handle
// With the post request we can send data from client to the server
// This data is ideally available on the request
// THerequest object holds all the data about the request that was done
// If that requests contains some data that was sent tahtn taht data should be on the request object
// Out of the box express.js doesn't put that body data on the request.
// In order to have that data available we have to use a middleware
// We'll go into more detail about middleware but for now we will use a simple middleware
// app.post("/api/v1/tours", createTour);
// app.patch("/api/v1/tours/:id", updateTour);
// app.delete("/api/v1/tours/:id", deleteTour);

// *If we needed to change the version or the resource name
// * we would need to change it in everywhere
// *We can use the route() mothod to simplify this
// *Code below is the same as:
// app.get("/api/v1/tours", getAllTours);
// But with the route method we can chain the post method as well
// because they have the same API end point 
app
  .route("/api/v1/tours")
  .get(getAllTours)
  .post(createTour);

// *Info About Middleware
// If we put a middleware here and send a get or post request to the
// "/api/v1/tours" middleware will not exucuted
// Because middleware comes after the route handler.
// This happens because route handlers are middleware as well.
// And the route handler ends the request - response cycle.
// By sending a result with the res.json() we end the cycle.
// So the next middleware in the stack will not be called because the cycle is already is finished.
// app.use((req, res, next) => {
//   console.log("Hello from the middleware 2");
//   next();
// });
app
  .route("/api/v1/tours/:id")
  .get(getTour)
  .patch(updateTour)
  .delete(deleteTour);

const port = 3000;
app.listen(port, () => {
  console.log("app running on port 3000");
})







