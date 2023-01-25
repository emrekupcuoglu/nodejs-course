const { async } = require("regenerator-runtime");
const Tour = require("../models/tourModel");
const catchAsync = require("../utils/catchAsync");

exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.find(req.body);
  res.status(200).json({
    results: tour.length,
    tour,
  });
});
