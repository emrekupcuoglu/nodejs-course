// Authentication, authorization and is all about user signing up, logging in
// and accessing pages or routes that we grant them permission to do so.
// So it is really all about the users
const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "User needs a name"],
  },
  email: {
    type: String,
    required: [true, "please enter your email address"],
    unique: true,
    lowercase: true,
    validate: {
      validator: function (val) {
        return validator.isEmail(val);
      },
      message: "Please provide a valid e-mail",
    },
  },
  photo: String,
  role: {
    type: String,
    enum: ["user", "guide", "lead-guide", "admin"],
    default: "user",
    select: false,
  },
  password: {
    type: String,
    required: [true, "Enter a password"],
    minlength: [8, "Password must be at least 8 characters"],
    // We need to set the select to false because even though the passwords are hashed
    // we still should't send them to the client and expose them.
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, "Confirm password"],
    validate: {
      validator: function (val) {
        if (this.op === "find") {
          return (
            this.getUpdate().$set.password ===
            this.getUpdate().$set.passwordConfirm
          );
        }
        return this.password === val;
      },
    },
  },
  passwordChangedAt: Date,
  createdAt: {
    type: Date,
    // We use Date.now instead of Date.now() because we don't want to call the function
    // instead atlas will call it for us.
    default: Date.now,
    select: false,
  },
});

userSchema.pre("save", async function (next) {
  // We only want to hash the password if the password field is being updated
  // We don't want to hash the password if the user is changing the anything else
  // for example the email field.
  if (!this.isModified("password")) return next();
  // First parameter is the password to be hashed
  // Second parameter is the cost parameter
  // We can do this in two ways:
  // First is to manually generate the salt and then use that salt in the hash function.
  // Or to make it a bit easier we can pass in a cost parameter in to the function
  // Cost is the measure of how CPU intensive the operation will be.
  // The default value is 10 but it is a bit better to use 12
  // because computer become more and more powerful.
  // Higher the cost better the password hashing but it is more CPU intensive.
  // This function is the async version but there is also the sync version.
  // But we don't want to use the synchronous version because that will block the event loop.

  this.password = await bcrypt.hash(this.password, 12);

  // We need to delete the passwordConfirm field from the database
  // because we only have the real password hashed so we should't store the passwordConfirm as plain text
  // and there is no point in hashing the passwordConfirm and storing it in the database.
  // to delete a field so that it is not persistent in the database is to simply set it to undefined
  // *We also could of used a virtual field for the passwordConfirm so
  // *that we wouldn't need to delete it in the first place
  this.passwordConfirm = undefined;

  // We will do the hashing using a very well known and popular hashing algorithm called bcrypt.
  // This algorithm will first salt and then hash our password
  // in order to make really strong and protect it against brute force attacks.
});

// *Instance method is a method that is going to be available on all documents of a certain collection.
// It is the opposite of static methods. So it is just a normal class method
//The this keyword points to the document in instance methods
// *We can also create instance methods by passing them to the schema inside the option object.
userSchema.methods.correctPassword = async function (candidatePassword) {
  // We only passed in the candidate password not the userPassword because even though
  // we hide it in the schema using the select: false we made it available again
  // in the authController using the .select(+password) method
  // so we can get the userPassword from the this keyword.
  // .compare() method takes the plain password as the first argument
  // and the hashed password as the second argument and compares them.
  // To compare it hashes the plain password again and compares the output with the hashed password.
  // Even though the hash is salted it can still do this because the salt is part of the hash.
  // First part of the hash is the algorithm that is used, it looks like this: $2b$.
  // Second part is the cost factor of the salt string.
  // Third part is the salt string and it consist of 22 characters.
  // Fourth part is the hashed password.
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.changedPasswordAfter = function (JTWTimeStamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = this.passwordChangedAt.getTime() / 1000;

    return JTWTimeStamp < changedTimeStamp;
  }
  return false;
};

const USER = mongoose.model("USER", userSchema);

module.exports = USER;
