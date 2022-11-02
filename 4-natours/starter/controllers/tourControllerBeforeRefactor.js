const fs = require("fs");

const toursData = JSON.parse(
  fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
);

// ?Param Middleware
// param middleware might sound unnecessary at first
// but it allows us to keep our code base DRY
// We only need to do this check once
// We of course could made a checkID function and use that function in each
// route handler that uses the id param separately
// but this makes it easy and simpler
exports.checkID = (req, res, next, val) => {
  console.log(`Tour id is ${val}`);
  if (Number(req.params.id) > toursData.length) {
    return res.status(404).json({
      status: "fail",
      message: "Invalid ID",
    });
  }
  next();
};

exports.checkBody = (req, res, next) => {
  console.log("req.body", req.body);
  if (!(req.body.name && req.body.price)) {
    // 400 is code for bad request
    return res.status(400).json({
      status: "fail",
      message: "missing name or price",
    });
  }
  next();
};

exports.getAllTours = (req, res) => {
  console.log(req.requestTime);
  res.status(200).json({
    status: "success",
    requestedAt: req.requestTime,
    // results is not a part of the JSEND specification but it is nice to be able to see the number of results on the client side
    results: toursData.length,
    data: {
      // name of this property is tours because the name of the API end point is tours
      tours: toursData,
    },
  });
};

exports.getTour = (req, res) => {
  // req.params are where all the parameters (variables) we define here are stored
  console.log("req.params", req.params);
  const id = Number(req.params.id);
  const tour = toursData.find((el) => el.id === id);

  res.status(200).json({
    status: "Success",
    data: {
      tour,
    },
  });
};

exports.createTour = (req, res) => {
  const newID = toursData[toursData.length - 1] + 1;
  // newTour is the req.body + the newID
  // We can use Object.assign for this
  const newTour = Object.assign({ id: newID }, req.body);
  toursData.push(newTour);
  // !When we write to the file it shouldn't appear when we try to access it with a get method
  // !But it works because when we make a change to the tours-simple.json file(manually or by an API)
  // !It save and restarts our server because of nodemon

  fs.writeFile(
    `${__dirname}/dev-data/data/tours-simple.json`,
    JSON.stringify(toursData),
    (err) => {
      // 201 stands for created
      res.status(201).json({
        status: "success",
        data: {
          tour: newTour,
        },
      });
    }
  );

  // We always have to send back something in order to finish the
  // so called request - response cycle.
  // res.send("Done");
};

exports.updateTour = (req, res) => {
  // We will not implement this here
  // Will do that later when we work with a database instead of files
  res.status(200).json({
    status: "Success",
    data: {
      tour: "<Updated Tour>",
    },
  });
};

exports.deleteTour = (req, res) => {
  // We will not implement this here
  // Will do that later when we work with a database instead of files

  // 204 is code for no content
  // We usually do not send any data back
  // we usually only send null
  res.status(204).json({
    status: "Success",
    data: {
      tour: null,
    },
  });
};
