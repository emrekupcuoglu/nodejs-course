const mongoose = require("mongoose");
const slugify = require("slugify");
const validator = require("validator");

// ?SCHEMA
// We pass in the schema as an object ot the mongoose.Schema() method
// W can also pass in options to the schema
// but that is for a later time
const tourSchema = new mongoose.Schema(
  {
    // We use the built in JavaScript types to specify types of data the name, rating, price will receive
    // We specified the data types we expect for each field
    // This is the most basic way of describing a schema
    // We can take it one step further by defining something called
    // Schema Type Options for each field or only for some specific field
    //
    // name: String,
    // rating: Number,
    // price: Number,
    //We pass in another object and set the type property to the type of data we are expecting
    // We can also specify additional options
    // We can make the field required
    // We can specify the error we want to be shown when the required filed is missing
    // To do that we create an array and the first one is the true/false and
    // the second one is the error message.
    // We can also make the names unique
    // That way no two tour can have the same name
    name: {
      // ?VALIDATORS
      // Validation is checking if the entered values are in the right format for each field in
      // our document schema and also that values have actually been entered for all of the required fields.
      // We will do the data validation on the model because of the fat model, thin controller philosophy.
      // Mongoose comes with bunch of data validation tools out of the box.
      // !If we want to run validation on update we need to set the runVAlidators option to true in the update methods(updateOne, updateMany, findByIdAndUpdate, etc.)
      type: String,
      // required is a data validator
      required: [true, "A tour must have a name"],
      // maxlength is use top specify the maximum length a string can have
      // if it is longer than that it going to produce an error
      maxlength: [
        40,
        "A tour name must have less than or equal to 40 characters.",
      ],
      // We also have minlength to specify the minimum length a string can have
      minlength: [
        10,
        "A tour name must have more than or equal to 10 characters",
      ],
      // ?Third Party Validator
      // With the validator.js validator is an object and on that object we have methods
      // One of those methods is the isAlpha, this methods check if the string
      // that is passed in only contains letters
      // If we don't want to pass in options to the isAlpha method we can use it like this
      // We don't call it mongoose will call it for us when it is validating it
      // validate:[validator.isAlpha, "Tour must only contain letters"]
      // ıf we want to pass in options we need to create a function
      // and then call the validator we want inside that function.
      // When mongoose is validating it will run the function we have wrote
      // So we are just writing a function we are not calling the function ourselves
      // mongoose call the function.

      validate: {
        validator: function (val) {
          // isAlpha by default doesn't allow spaces
          // We need to pass an option to make it work with spaces
          // We enter the character we want ignored as a string or RegExp and this fixes it
          return validator.isAlpha(val, "tr-TR", { ignore: " " });
        },
        message: "Tour must only contain letters",
      },
      // unique will throw an error if it is not met but it is technically not a data validator
      unique: true,
      // trim only works with string.
      // It removes the white space from the beginning and the end of the string.
      trim: true,
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, "A tour must have a duration"],
    },
    maxGroupSize: {
      type: Number,
      required: [true, "A tour must have a group size"],
    },
    difficulty: {
      type: String,
      // we turn the input to lower case so that use can enter
      // either "easy", "medium", "hard" or "EASY", "MEDIUM", "HARD"
      lowercase: true,
      required: [true, "A tour must have a difficulty"],
      // enum validator
      // We want to only have 3 difficulties
      // If the use passes anything other than the specified values we throw an error
      // We use an enum for this
      // We create an array with the values we want
      enum: {
        values: ["easy", "medium", "difficult"],
        message: "A tour must have either easy, medium or difficult difficulty",
      },
    },
    // We can set a default value as well
    ratingsAverage: {
      type: Number,
      default: 4.5,
      // On numbers we have the min and max validators
      // A rating must be between 1 and 5
      min: [1, "Rating must be higher than 1.0"],
      max: [5, "Rating must be lower than 5.0"],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },

    price: {
      type: Number,
      required: [true, "A tour must have a price"],
    },
    //? CUSTOM VALIDATORS
    // Sometimes the built in validators are not enough and we need custom validators.
    // Validators are functions that returns either true or false.
    // If it returns false than it means there is an error
    // If it returns true than the validation is correct and the input can be accepted.
    // We will create a custom validator that will check if the discountPrice is lower than the price
    priceDiscount: {
      type: Number,
      // We use the validate property to use our validator
      // We have a callback function as the value and the
      // !About this keyword
      // callbacks function's this keyword points to the document when we are creating a new document
      // but it won't have access to the document when we are updating it
      // Because of that this function will not work on update
      // The callback function also has access to the value that was inputted as a parameter
      validate: {
        validator: function (val) {
          // !!!!!!!!!!!!!IMPORTANT!!!!!!!!!!!!!!!!
          // !There are so many caveats of using update validators so always check the docs and test them
          // ! Below is just one of them:
          // !update validators might have problems validating because at the time of validation the document might not be in memory
          // !If that is the case then it throws an error.

          // !Using the code below for update validators

          // This keywords doesn't points to the document
          // But we can get the operation from this.op
          // I tried with this.op===findOneAndUpdate
          // But even though I updated the document this.op is equals to find
          // it defaults to find because of how mongoose works
          // If we use the method below it will work both for create and findOneAndUpdate
          console.log(this.op);
          if (this.op === "find") {
            // .getUpdate() method Returns the current update operations as a JSON object.
            // We have the $set operation and in there we have access to the price and the priceDiscount
            // With this method we have to send both the price and the priceDiscount
            // in the body of the request when we want to update the priceDiscount
            // otherwise it won't work.
            console.log("0", this.getUpdate());
            console.log("1", this.getUpdate().$set.priceDiscount);
            console.log("2", this.getUpdate().$set.price);
            return (
              this.getUpdate().$set.priceDiscount < this.getUpdate().$set.price
            );
          }
          // ? Option 2: We can also replace the whole document using replaceOne

          // ? Option 3: We can also use the const tour=await Tour.findById(id) (we need to pass in the id
          // ? instead of the value we want which is the priceDiscount right now we can use a middleware for this)
          // ? I haven't tried these solutions but if we can't pass in both the id and the priceDiscount
          // ? We can pass them in together and use JavaScript to parse them apart then use them
          // ? then use Tour.price>val
          return val < this.price;
        },
        // We can set an error message as well
        // This message also has access to the value
        // This works in a weird way and this is internal to mongoose
        // This has nothing to do with JavaScript
        // To use the value in the message we use it like this {VALUE}
        message: "priceDiscount ({VALUE}) must be lower than price",
      },
    },
    summary: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      // This is a string because it is just the name of the image
      // We retrieve the image from the file system with the name
      // This is basically a reference to the image
      // This is a common practice
      // We can store the images in the database itself as well
      // but that is usually not a good idea.
      type: String,
      trim: true,
      required: [true, "A tour must have a cove image"],
    },
    // Here we have multiple images and we want to save those images
    // As an array of strings
    images: [String],
    createdAt: {
      type: Date,
      // Date.now() gives the date in miliseconds but mongo automatically converts it so it makes sense
      // When we use call the Date.now() ourselves all the documents get the same createdAt value
      // And this creates a problem when we use sorting and pagination together
      // it returns the same tours in each page
      // this happens because we need a unique value to sort items
      // To fix it we can give it an additional value to sort thorough
      // Or let the atlas cloud run the Date.now() method
      // When atlas cloud runs it even if we send them all at the same time
      // There will still be a milisecond difference when they are created at the server
      // This is called the server timestamp
      default: Date.now,
      // !WE CAN ALSO EXCLUDE FIELDS FROM THE SCHEMA
      // !THIS CAN BE USEFUL WHEN WE HAVE SENSITIVE DATA THAT SHOULD ONLY
      // !BE USED INTERNALLY LIKE A PASSWORD
      // Let's say that we don't want our users to see the createdAt property because it might be an old tour
      // we set the select to false and thats is
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      // Instead of making the normal tours default to false and querying for
      // the normal tours in the pre find hook like Jonas did
      // I have selected to only have the secretTour field for secret tours
      // so that the normal tours doesn't have an extra field to occupy space on the database
      // and use the query operator $exist to check if the secretTour field exist
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// !If we try to put data that is not in the schema like difficulty in for example
// !It will not be inside the document because we didn't specify it in the schema

// ?VIRTUAL PROPERTIES
// !By default, Mongoose does not include virtuals when you convert a document to JSON.
// !For example, if you pass a document to Express' res.json() function, virtuals will not be included by default.
// !To include virtuals in res.json(), you need to set the toJSON schema option to { virtuals: true }.

// !By default, Mongoose does not include virtuals in console.log() output.
// !To include virtuals in console.log(), you need to set the toObject schema option to { virtuals: true }, or use toObject() before printing the object.

// !When we set the toJSON: { virtuals: true }, toObject: { virtuals: true } we also see an id field in our documents
// !The reason for this the mongoose automatically adds a virtual getter to every schema by default and that virtual getter is the id
// !But the virtual id is type of string while the _id is type of ObjectId

// Virtual properties are fields that we can define in our schema but they are not persisted
// So they will not be saved to the data base in order to save us some space there.
// Most of the time we really want to save our data to the database
// But virtual properties make a lot of sense for fields that can be derived from one other
// e.g conversion from km to mile
// So let's define a virtual property that contains the tour duration in weeks
// We convert the duration we have already to weeks easily

// We define the virtual properties on the schema
// We pass in the name of the virtual property as an argument
// And we need to define the get method
// because this virtual property will be created each time
// we get some data out of the data base
// The get function here is called a getter
// This is not hte same get as the one we use for routing
// that one comes from the express.js and this one comes from mongoose
// and they serve different purposes
// Get takes a function as an argument and it can not be an arrow function
// Because an arrow function have a lexical .this keyword
// but we want the .this keyword to point to the mongoose document
// !We can NOT use this virtual property in a query because they are technically not part of the database
tourSchema.virtual("durationWeeks").get(function () {
  return this.duration / 7;
});

// ?MIDDLEWARE
// Just like Express.js mongoose also has the concept of middleware
// Middleware is an absolutely fundamental concept in mongoose just like in Express js
// We will use middleware throughout this project.
// Just like with Express js we can use mongoose middleware to make something happen between two events
// e.g. for each time a document is saved to the database we can run a function between when the save command is issued
// and the actual saving of the document or after the actual saving.
// Because we can define actions to run before or after a certain event mongoose middleware is divided into two kinds pre hook and post hook
// There are 4 types of middleware in mongoose: Document, query, aggregate, and model middleware

// Just like virtual properties we define a middleware on the schema

// ?DOCUMENT MIDDLEWARE
// Document middleware is a middleware that can act on the currently processed document
// This is the pre middleware this will run before an actual event
// This takes the event as the first argument and a callback function as the second argument
// This runs before the .save() and .create() method but not on .insertMany()
tourSchema.pre("save", function (next) {
  // In a "save" middleware the this keyword will point to the currently processed document.
  // This is the reason it is called Document Middleware
  // it is because in this function we have access to the document that is being processed.
  // *We need to define the slug property in our schema for it to show up
  this.slug = slugify(this.name, { lower: true });
  next();
});

// In the case of a post middleware the callback function has access
// to the document that was just saved to the database as well as the next function.
// *Post middleware functions are executed after all the pre middleware functions are executed.
// eslint-disable-next-line prefer-arrow-callback
tourSchema.post("save", function (doc, next) {
  // console.log("this of post middleware", typeof this, this);
  // console.log("doc of post middleware", typeof doc, doc);
  next();
});

// ?QUERY MIDDLEWARE
// Query middleware allows us to run functions before or after a certain query is executed.
// This middleware is going to run before any find query is executed
// The big difference is that the this keyword will now point at the current query instead of the current document.
// Because we are not processing a document we will process a query.
// Let's say that we can have secret tours in our database
// like for tours that are offered only internally or for a very small VIP group that the public shouldn't know about.
// Since these tours our secret we don't want these tours to ever appear at the result outputs.
// So we are going to create a secret tour field and query only for tours that are not secret.
// !This has a problem we can not query for secret fields with the code base we have right now.
// !So this is more for learning purposes.
tourSchema.pre(/^find/, function (next) {
  // Jonas' way
  // this.find({ secretTour: { $ne: true } });
  // My way
  this.find({ secretTour: { $exists: false } });
  // console.log(this);
  // Checking how long it takes to execute the current query
  this.start = Date.now();
  next();
});

// !RUNNING VALIDATORS ON UPDATE MIDDLEWARE
// With the code below we can run update validators one every update that uses the findOneAndUpdate
// We can also expand it with other pre hooks if we want (e.g. we can add one for update as well)

tourSchema.pre("findOneAndUpdate", function (next) {
  console.log("hello from update");
  this.setOptions({ runValidators: true });
  next();
});

// !If we want to run update validators on multiple schemas not just on tourSchema
// !We can use plugins.
// !Plugins will run for every schema in our project they are awesome!

// function setRunValidators() {
//   this.setOptions({ runValidators: true });
// }
// mongoose.plugin((schema) => {
//   schema.pre("findOneAndUpdate", setRunValidators);
//   schema.pre("updateMany", setRunValidators);
//   schema.pre("updateOne", setRunValidators);
//   schema.pre("update", setRunValidators);
// });

// "find" pre hook doesn't work for findOne so we can see the secretTour using its id
// To make it so the middleware works for the findOne as well we need to specify that as well
// Or instead of repeating ourselves we can use a regular expression that matches any hook that starts with find
// So it will be triggered for find, findOne, findOneAndDelete, etc.
// tourSchema.pre("findOne", function (next) {
//   this.find({ secretTour: { $exists: false } });
//   next();
// });

// *The post middleware has access to the actual docs returned from the database instead of the query like the pre middleware
// This is because post middleware runs after the query has already executed
// therefore it has access to the documents that we returned.
// *This keyword still points to the Query object
tourSchema.post("find", function (docs, next) {
  // Checking how long it takes to execute the current query
  const time = Date.now() - this.start;
  console.log(`The query took ${time} miliseconds to finish`);
  next();
});

// ?AGGREGATE MIDDLEWARE
// Aggregate middleware allows us to run functions before or after an aggregation happens.
// Right now secret tours are still being used in aggregation.
// When we use the getTourStats() method we get 10 tours instead of 9
// Because when we are aggregating data we are still using the secret tours in our statistics
// The this keyword in aggregation middleware points to the Aggregate object
tourSchema.pre("aggregate", function (next) {
  // pipeline method returns <ARRAY> the current pipeline.
  // The current pipeline is similar to the operation that will be executed.
  console.log(this.pipeline());
  // We need to add another match statement to the beginning of the pipeline
  // When we want to add something to the beginning of an array we use the unshift method
  // With this mongoose adds the aggregation operation we want
  // to the beginning of the aggregation pipeline before sending it to the mongoDB server.
  this.pipeline().unshift({ $match: { secretTour: { $exists: false } } });
  next();
});

// ?MODEL
// We create the model like this
// First argument of the mongoose.model() method is the name of the model
// It is a convention to always start with an uppercase pn model names and variables
// Second argument is the schema
// *save() method creates a collection automatically for us
// It takes the name of the model which is "Tour" in this case
// turns it in to lower case and pluralizes it
// mongoose tries to guess the plural form but it can make mistakes
// If we want to manually specify what the name of the collection should be
// We can pass in an additional argument and the value we pass in becomes the name of the collection
// Third argument can be a string or an object
// both of them will work
// const Tour = mongoose.model("Tour", tourSchema,"tours");
// const Tour = mongoose.model("Tour", tourSchema,{collection:"tours"});

const Tour = mongoose.model("Tour", tourSchema);

module.exports = Tour;

// ****This part was for before refactoring for the MVC architecture
// We have created a new document from the model
// testTour is a document

// const testTour = new Tour({
//   name: "The Forest Hiker",
//   rating: 4.7,
//   price: 497,
// });
// The testTour we have created is an instance of the Tour model
// So it has a few methods on it we can use
// in order to interact with the database

// We can use the save method on the document instance to
// save the document to the database
// This will save this to the tours collection in the database
// The save method will return a promise we can then consume.
// For now let's use then() in the future we will use async/await
// In th then() method we have access to the document that was just saved to the database
// So the resolved value of the promise that the save() method returns
// is the final document as it is in the database.

// testTour
//   .save()
//   .then((doc) => {
//     console.log(doc);
//   })

// If anything goes wrong during the saving of the document to the database
// we catch that error.

// .catch((err) => {
//   console.log("ERROR:", err);
// });
//******************** */
