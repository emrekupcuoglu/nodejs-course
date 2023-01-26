// const fs = require("fs");
const { async } = require("regenerator-runtime");
const multer = require("multer");
const sharp = require("sharp");
const Tour = require("../models/tourModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const handlerFactory = require("./handlerFactory");

// We don't need this anymore because we are working with a real database now
// const toursData = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// );

// ? Uploading multiple photos

const multerStorage = multer.memoryStorage();
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Not an image! Please upload only images.", 400), false);
  }
};
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

// To upload a single photo we used upload.single
// But here we want to upload multiple files
// And one one them we want to upload 1 image and in the other we want to upload 3 images
// multer is capable of handling this
// For this we are going to use upload.fields
// We pass an array and each of the elements in an
// object where we then specify the field name
exports.uploadTourImages = upload.fields([
  { name: "imageCover", maxCount: 1 },
  { name: "images", maxCount: 3 },
]);
// * If we didn't need the image cover and instead only had one field which accepts multiple files
// * We could of used upload.array("images",3)

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  // console.log(req.files);
  if (!req.files.imageCover || !req.files.images) return next();

  // 1. Cover Image
  // when we have multiple files, it is on req.files NOT req.file
  const imageCover = req.files.imageCover[0];
  // We also need to make it possible so that our update tour handler
  // picks up this imageCover filename to update it.
  // To update the tours we are using the updateOne factory function to create a updateTour handler
  // And that handler updates the tour using the data inside the req.body.
  // So we need to put the imageCoverFileName into the body
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpg`;
  await sharp(imageCover.buffer)
    .resize(2000, 1333)
    .toFormat("jpg")
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  // 2. Images
  // Initialize the array
  req.body.images = [];
  // !!!!!!!!!!IMPORTANT!!!!!!!!!!!!!!!!!!IMPORTANT!!!!!!!!!!!!!!!!!!IMPORTANT!!!!!!!!!!!!!!!!!!IMPORTANT!!!!!!!!!!!!!!!!!!IMPORTANT!!!!!!!!!!!!!!!!!!IMPORTANT!!!!!!!!!!!!!!!!!!
  // ? Jonas said that this would cause the images to be not shown but it is not true
  // ? Even if you do NOT await anything and use a forEach this still works because we are pushing the filename to the database immediately
  // ? and then reloading the page. Iıf we didn't reload the page and need the images to be shown immediately without a refresh
  // ? then we would need to wait them like we did with the user profile picture upload.
  // ? But the functionality here is way different than there.
  // ?But we will use a map and await it because I think it is a good practice to do so.
  // ! There is a problem with async/await here
  // * We have changed the forEach to map to fix it
  // We are not using it correctly because right now the async await is only inside the callback function of the forEach loop
  // and that will not stop the execution of code from reaching the next() because the await happens inside callback of the forEach loop.
  // Fortunately there is a solution. Since the callback is an async function this will return a promise
  // So if we change the forEach to a map and wait the promises the map method returns using Promise.all()
  // We fix the async issue and promises resolve concurrently as well.
  // Use for await of if you need to resolve promises sequentially.
  const imagePromises = req.files.images.map((file, i) => {
    // We need this variable called filename because we need to push this filename into
    // req.body.images. Because req.body.images is an array we can not just do this:
    // req.body.images=`tour-${req.params.id}-${Date.now()}-${i + 1}.jpg`;
    // Because this works with only one file not with an array of files.
    const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpg`;
    req.body.images.push(filename);
    // Jonas didn't add a return statement but we should or otherwise .map() returns nothing
    return sharp(file.buffer)
      .resize(2000, 1333)
      .toFormat("jpg")
      .jpeg({ quality: 90 })
      .toFile(`public/img/tours/${filename}`);
  });
  await Promise.all(imagePromises);

  next();
});

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

// ? Factory Functions
// We have created a general function that creates functions to be used in multiple places
// With this we do not need to write duplicate code for every deleteOne operation
// We can use this for almost every deleteOne operation we need (if it is not too specialized).
// * This works because of closures

exports.getAllTours = handlerFactory.getAll(Tour);

// exports.getAllTours = catchAsync(async (req, res, next) => {
//   // ?Getting rid of the try catch blocks
//   // We got rid of the repetitive try catch and changed them with the catchAsync function
//   // *EXECUTE THE QUERY
//   const features = await new APIFeatures(Tour, req.query)
//     // paginate() method needs to be the last because it is an async function
//     // So we have tho wait that and if it is not the last the other methods can not access the query object
//     // because paginate returns a promise that needs to be resolved
//     .filter()
//     .sortQuery()
//     .limitFields()
//     .paginate();
//   // console.log(features.query);
//   const tours = await features.query;

//   // *2. We can use special mongoose methods
//   // Chaining of methods work because these methods do NOT return a promise
//   // Instead they return a thenable. Thenables are different then promises.
//   // They return a Query object. But when we await them
//   // the query executes and it returns the document that match the query.
//   // const query = await Tour.find()
//   //   .where("duration")
//   //   .equals(5)
//   //   .where("difficulty")
//   //   .equals("easy");
//   res.status(200).json({
//     status: "success",
//     // results is not a part of the JSEND specification but it is nice to be able to see the number of results on the client side
//     results: tours.length,
//     data: {
//       // name of this property is tours because the name of the API end point is tours
//       tours: tours,
//     },
//   });
// });

exports.getTour = handlerFactory.getOne(Tour, {
  path: "reviews",
  select: "-__v",
});

// exports.getTour = catchAsync(async (req, res, next) => {
//   // req.params are where all the parameters (variables) we define in the URL are stored

//   // findById finds the document with the matching id
//   // It is a shorthand for the findOne method with a filter object:
//   // findOne({_id:req.params.id})
//   // * We use the .populate() method for referencing
//   // populate populates, basically filles, the field called guides in our model
//   // The guides field only contains the reference and with
//   // populate we are going to fill it with actual data but only in the query not in the database.
//   // populate takes the name of the field we want to populate
//   // Instead of passing as string with the name of the filed we can also pass an options object
//   // and specify which field we want to show up
//   // ! Using populate creates a new query behind the scenes
//   // If you do it once or twice in a small application then that small hit on performance is not a problem at all.
//   // But in a huge application with tons of populates all over the places then that might indeed have some effect on performance.
//   // This works only for this route if we wanted it to work for getAllTours can either copy it and use it in that handler as well
//   // Or create a query middleware which is the better choice in this case.
//   // const tour = await Tour.findById(req.params.id).populate({
//   //   path: "guides",
//   //   select: "-__v -passwordChangedAt",
//   // });
//   const tour = await Tour.findById(req.params.id).populate({
//     path: "reviews",
//     select: "-__v",
//   });

//   // Checking if tour exist
//   if (tour === null) {
//     // If the queried tour doesn't exist mongo return success with tour equal to null
//     // We should send an error to the client if there is no tour with that id
//     // We need to return because other wise code below the next() function
//     // will execute and we will send 2 responses to the client one error message
//     // and one success message.
//     return next(new AppError("There is no tour with that ID", 404));
//   }
//   res.status(200).json({
//     status: "success",
//     data: {
//       tour,
//     },
//   });
// });

exports.createTour = handlerFactory.createOne(Tour);

// exports.createTour = catchAsync(async (req, res, next) => {
//   // !the body.req is an object because of the body parser middleware
//   // We are using the express.json() middleware
//   // And this middleware parses the request
//   // and turns the req.body from a string into an object

//   // Instead of doing this to create a document
//   // const newTour = new Tour({req.body});
//   // await newTour.save();

//   // We can do it in a easier way
//   // This is basically the same thing
//   // Main difference is that with this version
//   // We have called the method directly on the Tour
//   // While on the first version we called the method on the new document
//   // Like the save() method create() method returns a promise as well
//   const newTour = await Tour.create(req.body);

//   res.status(201).json({
//     status: "success",
//     data: {
//       tour: newTour,
//     },
//   });
// });

exports.updateTour = handlerFactory.updateOne(Tour);
// exports.updateTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//     // With this option the new updated document will be returned
//     new: true,
//     // With this each time we update data
//     // validators we have set on our schema will be run again.
//     // If we didn't set this to true
//     // we could changed the price to be a string.
//     // !If we want to validate data on update we need to set the runValidators to true
//     // But because the validators from our schema runs with the update
//     // it checks the data against the schema and because
//     // we allow price to be only a number if we try to enter a string it throws an error.
//     // !We moved the runValidators to the tourModel using a pre findOneAndUpdate hook
//     // !this way it works for every method that uses find findOneAndUpdate not just updateTour
//     // !Look there for more information
//     // runValidators: true,
//     context: "query",
//   });

//   // Checking if tour exist
//   if (tour === null) {
//     // If the queried tour doesn't exist mongo return success with tour equal to null
//     // We should send an error to the client if there is no tour with that id
//     // We need to return because other wise code below the next() function
//     // will execute and we will send 2 responses to the client one error message
//     // and one success message.
//     return next(new AppError("There is no tour with that ID", 404));
//   }

//   res.status(200).json({
//     status: "success",
//     data: {
//       tour,
//     },
//   });
// });

exports.deleteTour = handlerFactory.deleteOne(Tour);

// exports.deleteTour = catchAsync(async (req, res, next) => {
//   // 204 is code for no content
//   // We usually do not send any data back
//   // we usually only send null
//   const tour = await Tour.findByIdAndDelete(req.params.id);

//   // Checking if tour exist
//   if (tour === null) {
//     // If the queried tour doesn't exist mongo return success with tour equal to null
//     // We should send an error to the client if there is no tour with that id
//     // We need to return because other wise code below the next() function
//     // will execute and we will send 2 responses to the client one error message
//     // and one success message.
//     return next(new AppError("There is no tour with that ID", 404));
//   }

//   res.status(204).json({
//     status: "Success",
//     data: {
//       tour: null,
//     },
//   });
// });

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
        // We push in the name field as each document goes through this stage
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
    // We can use the limit field to limit the amount of documents being showed
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

// ? Geo-spatial Queries

exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(",");

  // radius is the we want to have as the radius but converted to radians
  // In order to get the radians we need to divide our distance by the radius of the earth.
  const radius = unit === "mi" ? distance / 3963.2 : distance / 6378.1;

  if ((!lat, !lng)) {
    next(
      new AppError(
        "Please provide latitude and longitude in the format lat,lng.",
        400
      )
    );
  }
  // We query for the startLocation because start location is what hold the geo-spatial point where each tour starts.
  // We will use a geo-spatial operator called geoWithin
  // This operator finds documents within a certain geometry and we need to define that geometry in the next step
  // We want to find documents inside of a sphere that starts at the point we have defined using the lat and lng
  // and has the radius as the distance we have defined.
  // We do that by passing a centerSphere to the geoWithin.
  // centerSphere operator takes in an array of coordinates and of the radius
  // and coordinates needs to be in another array
  // And counter-intuitively we need to define the longitude first then the latitude
  // For this radius instead of passing the distance the mongoDB expects the radius in radians.
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  // ! In order to do geo-spatial queries we need to attribute an index to the field where the geo-spatial data we are searching for is stored
  // We need to add an index to startLocation in this case.
  // You can see the geo-spatial data in detail in the compass app
  // It provides a really nice graphical interface with a map
  // You can also replicate the query in there and see if it is working correctly using the provided map
  // ! In order to see the geo-spatial queries on the map in compass all your documents needs to have a startLocation

  res.status(200).json({
    status: "success",
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(",");
  if ((!lat, !lng)) {
    next(
      new AppError(
        "Please provide latitude and longitude in the format lat,lng.",
        400
      )
    );
  }

  // ? Geo-spatial Aggregation
  // For geo-spatial aggregation there is only one stage and that is called geoNear
  // geoNear always needs to be the first stage in the pipeline
  const multiplier = unit === "mi" ? 0.000621371 : 0.001;
  const distances = await Tour.aggregate([
    {
      // geoNear requires that at least one of our fields contains a geo-spatial index
      // If there is only one filed with a geo-spatial index, then the geoNear stage will automatically use that index.
      // If you have multiple fields with geo-spatial indexes then you need to specify
      // the field you want to be used for calculations using the keys parameter.
      $geoNear: {
        // near is the point from which to calculate the distances.
        // So all the distances will be calculated between this point and the startLocations
        // We need to specify this point as GeoJSON
        near: {
          type: "Point",
          coordinates: [Number(lng), Number(lat)],
        },
        // This is the field that will be created and where all the calculated distances will be stored
        distanceField: "distance",
        // The default distance is in meters
        // With the distanceMultiplier field we can convert it to kilometers or any other unit
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);
  res.status(200).json({
    status: "success",
    results: distances.length,
    data: {
      data: distances,
    },
  });
});
