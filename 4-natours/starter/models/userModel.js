// Authentication, authorization and is all about user signing up, logging in
// and accessing pages or routes that we grant them permission to do so.
// So it is really all about the users
const crypto = require("node:crypto");

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
  passwordResetToken: String,
  passwordResetExpires: Date,

  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.pre("save", async function (next) {
  // We only want to hash the password if the password field is being updated
  // We don't want to hash the password if the user is changing anything else
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
  next();

  // We will do the hashing using a very well known and popular hashing algorithm called bcrypt.
  // This algorithm will first salt and then hash our password
  // in order to make really strong and protect it against brute force attacks.
});

userSchema.pre("save", function (next) {
  // In this implementation we would update the passwordChanged at property when we create a new document as well
  // but we don't want that. We only want to modify the passwordChangedAt property when we change the password not when we first create it.
  // To fix this we can use the isNew method. isNew method is how mongoose knows whether to create
  // a new document or to update an existing document when using the .save() method.
  // We can use this for our advantage. .isNew() returns true if the document is new and false if it is not.
  // Mongoose sets the isNew property of the document to false as soon as is saves the document to the database
  // so for post save hooks isNew will be set to false even if it is a new document because it is already saved to the database
  // ! This is really hard to know without learning it from someone who knows or
  // ! reading the documentation and realizing it you can use it to solve a problem you have.
  // ! So don't get frustrated when you don't know how to do something and ask someone or read the docs.
  if (!this.isModified("password") || this.$isNew) return next();

  // ! This should work fine in theory but in practice sometimes a small problem happens.
  // The problem is sometimes saving to the database is a bit slower than issuing the JWT.
  // Making it so the changed password time stamp is sometimes set a bit after the JWT has been created.
  // And that makes it so the user will not be able to log in using the new token.
  // So we subtract one second from the date
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

// ? Instance Methods
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
  // To compare, it hashes the plain password again and compares the output with the hashed password.
  // Even though the hash is salted it can still do this because the salt is part of the hash.
  // First part of the hash is the algorithm that is used, it looks like this: $2b$.
  // Second part is the cost factor of the salt string.
  // Third part is the salt string and it consist of 22 characters.
  // Fourth part is the hashed password.
  // console.log(this);
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.changedPasswordAfter = function (JTWTimeStamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = this.passwordChangedAt.getTime() / 1000;

    return JTWTimeStamp < changedTimeStamp;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  // Password reset token needs to be a random string
  // it doesn't need to be as secure as the cryptographically password hash we have created before
  // So we can use the randomBytes function from the built-in crypto module
  // First argument it takes is the number of bytes we want (one chars is equal to one byte)
  // *If a callback function is specified .randomBytes() run in an async way
  // Otherwise it is synchronous but it takes so little time  so we can leave it sync (for now at least)
  // Then we want to convert it to hexadecimal
  const resetToken = crypto.randomBytes(64).toString("hex");
  // We will send this token to the user and the user will use it to reset his password
  // This in a way works like a real password because it can be used to gain access to the system
  // So if a hacker get access to the database he can use this token to get access to those accounts.
  // Just like a password we should never store the plain reset token in the database.
  // So we need to hash it, but tokens don't need as strong hashing as the password
  // because they are only valid for a short time.
  // Built-in crypto module hashing works in a weird way but we can use streams with the .update() method if we ever need it.
  // The .update() method updates the hash with the data it has been passed in.
  // The digest will calculate the digest of all the data passed to  be hashed using the .update() method
  // !We have created the this.passwordResetToken here but NOT saved it to the database yet
  // !We need to use the .save() to save the modified document to the database.
  // !We have done this in the authController in the forgotPassword() function
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Setting the token expiration time to 10 minutes
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  // We return the plain text token because we will send this over the email
  return resetToken;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
