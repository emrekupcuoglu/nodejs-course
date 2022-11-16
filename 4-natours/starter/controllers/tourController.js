// const fs = require("fs");
const Tour = require("../models/tourModel");

const APIFeatures = require("../utils/APIFeatures");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

// We don't need this anymore because we are working with a real database now
// const toursData = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// );

// We are creating a middleware so that when the request hits the getAllTours
// queries are already modified
exports.aliasTopTours = (req, res, next) => {
  // Everything the url is a string so we need to set the limit as a string as well
  req.query.limit = "5";
  req.query.sort = "-ratingsAverage price";
  // We only want to send certain fields
  req.query.fields = "name,price,ratingsAverage,summary,difficulty";
  next();
};

// ?Param Middleware
// param middleware might sound unnecessary at first
// but it allows us to keep our code base DRY
// We only need to do this check once
// We of course could made a checkID function and use that function in each
// route handler that uses the id param separately
// but this makes it easy and simpler
// !We don't need this function because mongodb will give an error if we use an invalid id
// exports.checkID = (req, res, next, val) => {
//   console.log(`Tour id is ${val}`);
//   if (Number(req.params.id) > toursData.length) {
//     return res.status(404).json({
//       status: "fail",
//       message: "Invalid ID",
//     });
//   }
//   next();
// };

// !We don't need this anymore because our schema handles it
// exports.checkBody = (req, res, next) => {
//   console.log("req.body", req.body);
//   if (!(req.body.name && req.body.price)) {
//     // 400 is code for bad request
//     return res.status(400).json({
//       status: "fail",
//       message: "missing name or price"
//     });
//   }
//   next();
// };

exports.getAllTours = catchAsync(async (req, res, next) => {
  // ?Getting rid of the try catch blocks
  // We got rid of the repetitive try catch and changed them with the catchAsync function
  // *EXECUTE THE QUERY
  const features = await new APIFeatures(Tour, req.query)
    // paginate() method needs to be the last because it is an async function
    // So we have tho wait that and if it is not the last the other methods can not access the query object
    // because paginate returns a promise that needs to be resolved
    .filter()
    .sortQuery()
    .limitFields()
    .paginate();
  const tours = await features.query;

  // *2. We can use special mongoose methods
  // Chaining of methods work because these methods do NOT return a promise
  // Instead they return a thenable. Thenables are different then promises.
  // They return a Query object. But when we await them
  // the query executes and it returns the document that match the query.
  // const query = await Tour.find()
  //   .where("duration")
  //   .equals(5)
  //   .where("difficulty")
  //   .equals("easy");
  res.status(200).json({
    status: "success",
    // results is not a part of the JSEND specification but it is nice to be able to see the number of results on the client side
    results: tours.length,
    data: {
      // name of this property is tours because the name of the API end point is tours
      tours: tours,
    },
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  // req.params are where all the parameters (variables) we define in the URL are stored

  // findById finds the document with the matching id
  // It is a shorthand for the findOne method with a filter object:
  // findOne({_id:req.params.id})
  const tour = await Tour.findById(req.params.id);

  // Checking if tour exist
  if (tour === null) {
    // If the queried tour doesn't exist mongo return success with tour equal to null
    // We should send an error to the client if there is no tour with that id
    // We need to return because other wise code below the next() function
    // will execute and we will send 2 responses to the client one error message
    // and one success message.
    return next(new AppError("There is no tour with that ID", 404));
  }
  res.status(200).json({
    status: "success",
    data: {
      tour,
    },
  });
});

exports.createTour = catchAsync(async (req, res, next) => {
  // !the body.req is an object because of the body parser middleware
  // We are using the express.json() middleware
  // And this middleware parses the request
  // and turns the req.body from a string into an object

  // Instead of doing this to create a document
  // const newTour = new Tour({req.body});
  // await newTour.save();

  // We can do it in a easier way
  // This is basically the same thing
  // Main difference is that with this version
  // We have called the method directly on the Tour
  // While on the first version we called the method on the new document
  // Like the save() method create() method returns a promise as well
  const newTour = await Tour.create(req.body);

  res.status(201).json({
    status: "success",
    data: {
      tour: newTour,
    },
  });
});

exports.updateTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    // With this option the new updated document will be returned
    new: true,
    // With this each time we update data
    // validators we have set on our schema will be run again.
    // If we didn't set this to true
    // we could changed the price to be a string.
    // !If we want to validate data on update we need to set the runValidators to true
    // But because the validators from our schema runs with the update
    // it checks the data against the schema and because
    // we allow price to be only a number if we try to enter a string it throws an error.
    // !We moved the runValidators to the tourModel using a pre findOneAndUpdate hook
    // !this way it works for every method that uses find findOneAndUpdate not just updateTour
    // !Look there for more information
    // runValidators: true,
    context: "query",
  });

  // Checking if tour exist
  if (tour === null) {
    // If the queried tour doesn't exist mongo return success with tour equal to null
    // We should send an error to the client if there is no tour with that id
    // We need to return because other wise code below the next() function
    // will execute and we will send 2 responses to the client one error message
    // and one success message.
    return next(new AppError("There is no tour with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      tour,
    },
  });
});

exports.deleteTour = catchAsync(async (req, res, next) => {
  // 204 is code for no content
  // We usually do not send any data back
  // we usually only send null
  const tour = await Tour.findByIdAndDelete(req.params.id);

  // Checking if tour exist
  if (tour === null) {
    // If the queried tour doesn't exist mongo return success with tour equal to null
    // We should send an error to the client if there is no tour with that id
    // We need to return because other wise code below the next() function
    // will execute and we will send 2 responses to the client one error message
    // and one success message.
    return next(new AppError("There is no tour with that ID", 404));
  }

  res.status(204).json({
    status: "Success",
    data: {
      tour: null,
    },
  });
});

// ?AGGREGATION PIPELINE
// !Aggregation pipeline doesn't cast types and doesn't respect the schema
// !!So be careful when using it and only use it when necessary
// !Additional info on mongo-db-aggregation-pipeline.txt
// MongoDB aggregation pipeline is an extremely powerful and extremely useful mongoDb framework for data aggregation

// Ideal is that we basically define a pipeline that all the documents
// from a certain collection go through where they are precessed step
// by step in order to transform them into aggregated results.
// For example we can use the aggregation pipeline to calculate averages, min and max values,
// we can calculate distances even and we can do all kinds of stuff it is so powerful.

// We are going to a function that will calculate a couple of statistics about our tours
exports.getTourStats = catchAsync(async (req, res, next) => {
  // The Aggregation pipeline is a mongoDB feature
  // But we use the mongoose driver to access it
  // Aggregation pipe lin is a bit like a regular query
  // The difference is that with aggregation we can manipulate the data in a couple of different steps
  // To define the steps we pass in an array of so-called stages
  // The documents will pass through these stages one by one in the define sequence as we defined it
  // Each elements of the array will be one step.
  // There are ton of different stages we can choose from
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    // Group allows us to group documents together using accumulators
    // You can even calculate an average with the accumulator

    {
      $group: {
        // The first thing that we always have to specify is the id
        // Because this is where we want to specify what we want to group by
        // We set it to null for now because we want everything to be in the same group
        // so that we can calculate the statistics for all of the tours together and not separate it by groups
        // We can also group by difficulty and then calculate the average for the easy tours or the hard tours etc.
        // _id: null,
        // If we want to group them by a field we prefix the
        // field we want to group by with a dollar sign($)
        // _id: "$difficulty",
        // We can also make the difficulty uppercase for fun
        _id: { $toUpper: "$difficulty" },
        // Number of tours
        // This is a bit trickier
        // To get the number of documents we basically add 1 for each document
        numTours: { $sum: 1 },
        // We can use the sum mongoDB operator to get the total number of reviews
        numRatings: { $sum: "$ratingsQuantity" },
        // To calculate the average rating we specify a new field
        // $avg is a mongoDB operator that calculates the averages
        // When we are specifying the field that we are calculating the average from
        // We need to prefix it with a dollar sign ($)
        averageRating: { $avg: "$ratingsAverage" },
        avrPrice: { $avg: "$price" },
        // We use the min and max for calculating minimums and maximums
        minPrice: { $min: "$price" },
        maxPrice: { $max: "$price" },
      },
    },
    {
      // Here in the sorting stage we need to specify the field names we have used up in the grouping stage
      // We can no longer use the old names because at this point they are already gone.
      // At this point in the aggregation pipeline we only have the result from the group stage
      // So they are basically our documents in this stage and we only have the fields we have specified in the grouping stage
      // 1 is for ascending sorting
      $sort: { avrPrice: 1 },
    },
    // We can also repeat stages
    // This is just to show that we can repeat stages and to show the not equal operator
    // We have already specified the _id up in the code
    // We want the _id to be not equal to "EASY"
    // This removes the "EASY" grouping
    // {
    // $match: { _id: { $ne: "EASY" } },
    // },
  ]);
  res.status(200).json({
    status: "Success",
    data: {
      stats,
    },
  });
});

// Let's say that we want how many tours are happening each month
// to figure out our monthly expenses and such
// We can do this with an aggregation pipeline
// To calculate it we want to have one tour for each date in the startingDates array
exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = Number(req.params.year);
  const plan = await Tour.aggregate([
    {
      // unwind will deconstruct an array field from the input documents
      // and then output one document for each element of the array.
      $unwind: "$startDates",
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: "$startDates" },
        numTourStarts: { $sum: 1 },
        // We also want to know which tours are starting
        // We use an array for that because we have more than one entry for the field
        // We use the $push operator for creating an array
        //We push in the name field as each document goes through this stage
        tours: { $push: "$name" },
        durations: { $push: "$duration" },
      },
    },
    // We use the $addFields operator to add fields
    // Right now the value of the month is stored in the _id field
    // We want to have its own field
    {
      $addFields: {
        month: "$_id",
        // Setting the weeks programmatically using the map operator
        weeks: {
          $map: {
            input: "$durations",
            as: "el",
            in: { $divide: ["$$el", 7] },
          },
        },
      },
    },
    // We use project to get rid of the _id because the client doesn't need to know it
    {
      $project: { _id: 0 },
    },
    {
      $sort: {
        numTourStarts: -1,
      },
    },
    // We can use the imit field to limit the amount of documents being showed
    // Just like the limit method of the query object
    {
      // This is just for learning purposes so we set it to twelve so that no documents get cut off
      // because we only have 12 months
      $limit: 12,
    },
  ]);
  res.status(200).json({
    status: "Success",
    data: {
      plan,
    },
  });
});
