const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const createHttpError = require("http-errors");
const { roles } = require("../utils/constants");

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: [roles.admin, roles.moderator, roles.client],
    default: roles.client,
  },
});

// middleware for hashing password
// fires whenever someone save a document inside our collection
UserSchema.pre("save", async function (next) {
  try {
    // this refers to the user object that is going to be saved
    // isNew is mongoose property
    // if this user document or object is new then hash otherwise call next()
    if (this.isNew) {
      const salt = await bcrypt.genSalt(10); //8-20 rounds but 10 is optimal for computing power
      const hashedPassword = await bcrypt.hash(this.password, salt);
      this.password = hashedPassword;
      if (this.email === process.env.ADMIN_EMAIL.toLowerCase()) {
        this.role = roles.admin;
      }
    }
    next();
  } catch (error) {
    next(error);
  }
});

UserSchema.methods.isValidPassword = async function (password) {
  try {
    return await bcrypt.compare(password, this.password);
  } catch (error) {
    throw createHttpError.InternalServerError(error.message);
  }
};

// user model
const User = mongoose.model("user", UserSchema);

module.exports = User;
