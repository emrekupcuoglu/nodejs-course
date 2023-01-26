// ? multer is a popular middleware for handling multipart form data
// multipart form data is a kind of form encoding that is used to files from a form.
// This is similar to the urlencoded form we have used to update our user data
// because we also had to include a special middleware for that as well.
// We need to configure a so-called multer upload to use it
// If we do not specify a options object and simply use the upload without it
// The uploaded images would be on the memory and not be saved to anywhere on the disk.
// dest is the place where we want the image to be uploaded.
// With this our file is uploaded into a directory in out file system.
// * Images are not directly uploaded into the database, we upload them into our file system
// * then we put a link to that image in the database. So we will have the name of the uploaded file in each user document.
const multer = require("multer");
// sharp is a really nice and eas yto use image processing for node.js.
// There is a lot of stuff we can do with it but where it really shines is
// resizing images in a very simple way.
const { async } = require("regenerator-runtime");
const sharp = require("sharp");
const User = require("../models/userModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const handlerFactory = require("./handlerFactory");

// * We create a multerStorage and a multerFilter and use these to create upload from there

// ! We saved the image to the memory instead of to the disk to do processing on it later.
// We also could of store the file in the memory as a buffer
// so that we can use it later for other processes, we will do this later.
const multerStorageDisk = multer.diskStorage({
  // we can not simply set the destination to the path as we did with upload
  // This is a bit more complex.
  // The destination is a callback function. Callback has access to the request, currently uploaded file
  // and also to a callback function.
  // The callback function is a bit like the next function in express.js.
  destination: (req, file, cb) => {
    // first argument is an error if there is one if not it is null.
    // second argument is the actual destination.
    cb(null, "public/img/users");
  },
  filename: (req, file, cb) => {
    // we want to give the files unique names
    // With this we guarantee that there won't be any images with the same filename
    // If we used only userId then multiple uploads by the same user would overwrite the image.
    // If we only used the timestamp then if two users were uploading an ,mage at the same time
    // they would get the exact same filename.
    // this is the template for file names:
    //user-userId-timestamp.extension
    // user-787878ab78a-12341231231123.jpeg
    const extension = file.mimetype.split("/")[1];
    // We call the callback with an error if there is an error or otherwise with null
    // and the second argument is the the filename
    cb(null, `user-${req.user.id}-${Date.now()}.${extension}`);
  },
});

// We have saved the image to the memory and not to the disk using the multer.diskStorage
// because we are doing processing with it.
// This way the image is stored as a buffer.
// The buffer is available at req.file.buffer
const multerStorageMemory = multer.memoryStorage();

// filter in multer is similar to the callback functions we had before
// * In this function the goal is to test if the uploaded file is an image.
// If it is an image we pass true into the callback function
// otherwise we pass false along with an error to the callback.

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Not an image! Please upload only images.", 400), false);
  }
};

const upload = multer({
  dest: "public/img/users",
  storage: multerStorageMemory,
  fileFilter: multerFilter,
});

// .single because we only want to upload a single
// we pass the name of the form field that is going to hold the image to upload
// upload.single will also put some information about the file into the request object.
exports.uploadUserPhoto = upload.single("photo");

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();
  // When doing image processing after uploading a file like we are doing here
  // then it is best to not save the file to the disk but instead save if to the memory.
  // This is more efficient then wring the file to the disk and then reading it again.
  // We simply keep the image in memory so that we can read it here.

  // !!!!!!!!!!!!!IMPORTANT!!!!!!!!!!!!!!!!!!!!!!!!!!IMPORTANT!!!!!!!!!!!!!!!!!!!!!!!!!!IMPORTANT!!!!!!!!!!!!!!!!!!!!!!!!!!IMPORTANT!!!!!!!!!!!!!!!!!!!!!!!!!!IMPORTANT!!!!!!!!!!
  // We set the filename manually instead of not setting this and just using this below as it is
  // We are doing this because when we save the image to the memory using the .memoryStorage()
  // instead of saving it to the disk using .diskStorage() the filename doesn't get set.
  // But we need the file name in the updateMe() handler because we are updating the path to the image
  // in the database using the req.file.filename.
  // * We need to do this because multer creates the req.file.filename only when storing it to the disk
  // * and not when storing it to the memory. But we are using the sharp library to save the file to the disk
  // * and sharp library doesn't save it so we need to set the req.file.filename manually
  // We don't get the extension from the req.file because we are converting every photo to jpg so the format will always be jpg.
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpg`;

  // Calling the sharp function will create an object on which we can chain multiple methods
  // in order to do image processing.
  // We can specify the width and height in the .resize()
  // We want square images so height and width needs to be the same.
  // This will crop the image so that it cover this entire 500x500 square.
  // We can change the default behavior if we wanted to using an options object.
  // ! We need to await the sharp because otherwise it takes too long for the image to be saved to the filesystem
  // and this causes a broken image to be shown.
  // This happens because I have implemented my solution for updating the user image without refreshing the page.
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat("jpg")
    // We can use the .jpeg() method to compress the image
    // quality is percentage base
    .jpeg({ quality: 90 })
    // Writing it to the disk
    // This method need the entire path to the file
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

const filterObj = (obj, ...allowedFields) => {
  const newObject = {};
  const keys = Object.keys(obj);
  keys.forEach((el) => {
    if (allowedFields.includes(el)) newObject[el] = obj[el];
  });
  return newObject;
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // req.file comes from the multer middleware.
  // console.log("req.file", req.file);
  // console.log("req.body", req.body);
  // 1.Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        "This route is not for password updates. Please use /updatePassword",
        400
      )
    );
  }

  // 2. Update user document

  // We will use findByIdAndUpdate because .update() method doesn't run validators by default
  // and we need the validators off because otherwise we need to send the password and passwordConfirm in the body.
  // For this we can either use save with validators off or use update
  // We set the new to true so that it returns the updated document  instead of the old document

  // ! We can not let the user put anything he wants inside the update query
  // ! Because he can update his role or other sensitive information he should not be able to
  // Like this: body.role:"admin"
  // We want to filter input
  // * We also could of filtered the excluded fields like this
  // But we have opted to allow fields we have specified
  // const excludedFields = ["role", "__v", "_id", "passwordChangedAt"];
  // const filteredBody = { ...req.body };
  // excludedFields.forEach((el) => delete filteredBody[el]);

  const filteredBody = filterObj(req.body, "name", "email");

  // ?Updating the image
  // Checking if there is an image upload
  if (req.file) {
    // We can not just add the photo field to the filterObj function and be done with it
    // because the file is not in the req.body but it is in the req.file.
    // We can change the filterObj function or just do this
    filteredBody.photo = req.file.filename;
  }

  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  }).select("-__v -_id -passwordChangedAt");

  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  if (!req.user) return next("Please login!");

  const user = await User.findById(req.user.id).select("+password");
  if (!(await user.correctPassword(req.body.password))) {
    return next(new AppError("Wrong password", 403));
  }

  user.active = false;
  await user.save({ validateModifiedOnly: true });

  res.status(204).json({
    status: "success",
    data: { user: null },
  });
});

exports.createUser = (req, res) => {
  res.status(201).json({
    status: "success",
    message: "This route is not defined. Please use /signup instead.",
  });
};

exports.getAllUsers = handlerFactory.getAll(User);
exports.getUser = handlerFactory.getOne(User);

// DO NOT use for updating passwords
exports.updateUser = handlerFactory.updateOne(User);

exports.deleteUser = handlerFactory.deleteOne(User);
