const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const APIFeatures = require("../utils/APIFeatures");

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
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
    const newDoc = await Model.create(req.body);

    res.status(201).json({
      status: "success",
      data: {
        newDoc,
      },
    });
  });

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    // 204 is code for no content
    // We usually do not send any data back
    // we usually only send null
    const doc = await Model.findByIdAndDelete(req.params.id);

    // Checking if doc exist
    if (doc === null) {
      // If the queried doc doesn't exist mongo return success with doc equal to null
      // We should send an error to the client if there is no doc with that id
      // We need to return because other wise code below the next() function
      // will execute and we will send 2 responses to the client one error message
      // and one success message.
      return next(new AppError("There is no document with that ID", 404));
    }

    res.status(204).json({
      status: "Success",
      data: {
        tour: null,
      },
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
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

    // Checking if document exist
    if (doc === null) {
      // If the queried document doesn't exist mongo return success with document equal to null
      // We should send an error to the client if there is no document with that id
      // We need to return because other wise code below the next() function
      // will execute and we will send 2 responses to the client one error message
      // and one success message.
      return next(new AppError("There is no document with that ID", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        doc,
      },
    });
  });

/**
 * @param {Class} Model - Model class
 * @param {Object|null} [popOptions=null]
 */

exports.getOne = (Model, popOptions = null) =>
  catchAsync(async (req, res, next) => {
    // req.params are where all the parameters (variables) we define in the URL are stored

    // findById finds the document with the matching id
    // It is a shorthand for the findOne method with a filter object:
    // findOne({_id:req.params.id})
    // * We use the .populate() method for referencing
    // populate populates, basically filles, the field called guides in our model
    // The guides field only contains the reference and with
    // populate we are going to fill it with actual data but only in the query not in the database.
    // populate takes the name of the field we want to populate
    // Instead of passing as string with the name of the filed we can also pass an options object
    // and specify which field we want to show up
    // ! Using populate creates a new query behind the scenes
    // If you do it once or twice in a small application then that small hit on performance is not a problem at all.
    // But in a huge application with tons of populates all over the places then that might indeed have some effect on performance.
    // This works only for this route if we wanted it to work for getAllTours can either copy it and use it in that handler as well
    // Or create a query middleware which is the better choice in this case.
    // const tour = await Tour.findById(req.params.id).populate({
    //   path: "guides",
    //   select: "-__v -passwordChangedAt",
    // });

    // ? Checking if popOptions exist and populating if it does
    const query = Model.findById(req.params.id);
    if (popOptions) {
      query.populate(popOptions);
    }
    const doc = await query;
    // Checking if doc exist
    if (doc === null) {
      // If the queried doc doesn't exist mongo return success with doc equal to null
      // We should send an error to the client if there is no doc with that id
      // We need to return because other wise code below the next() function
      // will execute and we will send 2 responses to the client one error message
      // and one success message.
      return next(new AppError("There is no document with that ID", 404));
    }
    res.status(200).json({
      status: "success",
      data: {
        doc,
      },
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    // ? To allow for nested GET reviews on tour
    // ! This here is a hack because we only need these for the getAllReviews handler
    // It would be better to fix it in a different way but this is just for learning purposes
    const filter = {};
    if (req.params.tourId) {
      filter.tour = req.params.tourId;
    }

    // ?Getting rid of the try catch blocks
    // We got rid of the repetitive try catch and changed them with the catchAsync function
    // *EXECUTE THE QUERY
    const features = await new APIFeatures(Model, Model.find(filter), req.query)
      // paginate() method needs to be the last because it is an async function
      // So we have tho wait that and if it is not the last the other methods can not access the query object
      // because paginate returns a promise that needs to be resolved
      .filter()
      .sortQuery()
      .limitFields()
      .paginate();
    // console.log(features.query);

    // ? INDEXES
    // Indexes are explained in the indexes.txt file
    // The explain method gives statistics about the query
    // const docs = await features.query.explain();

    const docs = await features.query;

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
      results: docs.length,
      data: {
        docs: docs,
      },
    });
  });
