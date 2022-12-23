// ?REFACTORING THE CODE INTO A CLASS
class APIFeatures {
  constructor(model, query, queryStr) {
    this.model = model;
    this.query = query;
    this.queryStr = queryStr;
  }

  filter() {
    // *BUILD THE QUERY
    const queryObj = { ...this.queryStr };
    const excludedFields = ["page", "sort", "limit", "fields"];
    excludedFields.forEach((el) => delete queryObj[el]);

    // ?There are two ways to make queries with mongoose
    // *1. We can use a filter object like we did in the mongo shell
    // To read documents from the database we use the find() method
    // just like we used in the mongo shell
    // When we don't pass anything into it it will return all the documents in the collection
    // It also converts the documents into JavaScript objects for us
    // This also returns a promise so we have to await it
    // const tours = await Tour.find();

    // ?FILTERING
    // If we add a filter object we can make a query
    // const tours = await Tour.find({ duration: 5, difficulty: "easy" });
    // req.query is similar to the { duration: 5, difficulty: "easy" } object so we just use
    // req.query (queryObj because it is the same but it enables excluding certain keywords)
    // We can not await it right away because if we do
    // we can not implement sorting or pagination features later on.
    // So we will have the tours below and await them there
    // and turn the tours here into query
    // const tours = await Tour.find(queryObj);
    // const query = Tour.find(queryObj);

    // ? ADVANCED FILTERING
    // !Putting the operator in the brackets is a feature of the qs library
    // Express.js uses this library to parse URL's
    // You also configure it differently from the default settings

    // If we want to make a query with the $gte operator
    // first we need to modify our get request
    // we add the operator we want to use in square brackets
    // like this: /duration[gte]=5
    // We need a filter object like this
    // { duration: {$gte: 5 } }
    // But we get something like this when we log this
    // { duration: {gte: 5 } }
    // Solution is to add the $ sign before every operator

    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replaceAll(
      /\bgte|gt|lte|lt\b/g,
      (match) => `$${match}`
    );

    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  sortQuery() {
    // ?SORTING
    // !If using skip() with sort(), be sure to include at least one field in your sort that contains unique values, before passing results to skip();
    // !You can use the _id is for making sure it works
    if (this.queryStr.sort) {
      let sortBy = this.queryStr.sort;
      // If we want to sort by a second criteria all we have to do
      // is to add that criteria as well
      // like this query.sort("price ratingsAverage")
      // Because we can not have spaces in a url
      // we separate them with a comma in the url
      // then replace the commas with a space
      sortBy = sortBy.split(",").join(" ");
      this.query = this.query.sort(sortBy);
    } else {
      // In case the user doesn't specify a sort we will still add a default sort the to query
      this.query = this.query.sort("-createdAt _id");
    }
    return this;
  }

  limitFields() {
    // ?FIELD LIMITING
    // For a client it is always ideal to receive as little data as possible
    // in order to reduce the bandwidth that is consumed with each request.
    // This is especially important when we have data heavy datasets

    if (this.queryStr.fields) {
      const fields = this.queryStr.fields.split(",").join(" ");
      // This operation of selecting only certain field names is called query projection
      // With this we only send the included fields back to the client
      this.query = this.query.select(fields);
    } else {
      // a default limiting if the user doesn't specify it
      // We remove the __v
      // mongoose uses __v internally so disabling it is not a good idea
      // instead we can excluded it so that it doesn't get sent
      // If we put a minus (-) before the field we exclude it instead of including it
      this.query = this.query.select("-__v");
      // !WE CAN ALSO EXCLUDE FIELDS FROM THE SCHEMA
      // !THIS CAN BE USEFUL WHEN WE HAVE SENSITIVE DATA THAT SHOULD ONLY
      // !BE USED INTERNALLY LIKE A PASSWORD
    }
    return this;
  }

  /**
   *
   * @tutorial This is an async function. Because of that this function needs to be the last in chaining
   */
  async paginate() {
    // ?PAGINATION
    // limit is the amount of data that should be showed
    // and the skip is the amount of data that should be skipped before starting to show data
    // Let's say that the user wants the page number 2 with 10 results per page
    // /page=2&limit=10
    // This means that the results 1-10 are on the first page
    // and the results 11-20 are on the second page.
    // This means that we have to skip over the first 10 results
    const page = Number(this.queryStr.page) || 1;
    const limitedBy = this.queryStr.limit || 100;
    const skippedBy = (page - 1) * limitedBy;
    this.query = this.query.skip(skippedBy).limit(limitedBy);

    if (this.queryStr.page) {
      // Count documents returns a Query Object and that Query Object returns the number of documents
      const numTours = await this.model.countDocuments();
      if (skippedBy >= numTours) throw new Error("This page does not exist");
      // !IMPORTANT

      // Date.now() we have used in the schema gives the date in miliseconds but mongo automatically converts it so it makes sense
      // When we use call the Date.now() ourselves all the documents get the same createdAt value
      // And this creates a problem when we use sorting and pagination together
      // it returns the same tours in each page
      // this happens because we need a unique value to sort items
      // To fix it we can give it an additional value to sort thorough
      // !If using skip() with sort(), be sure to include at least one field in your sort that contains unique values, before passing results to skip();
      // !You can use the _id is for making sure it works
      // Or let the atlas cloud run the Date.now() method

      // We have fixed it by letting atlas call the method
      // When atlas cloud runs it even if we send them all at the same time
      // There will still be a milisecond difference when they are created at the server
      // This is called the server timestamp
    }
    return this;
  }
}

module.exports = APIFeatures;
