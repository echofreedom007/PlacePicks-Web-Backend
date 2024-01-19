const HttpError = require("../models/http-errors");
const { validationResult } = require("express-validator");
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const getUsers = async (req, res, next) => {
  let users;

  try {
    //`const users = User.find({},'email name' );` also works
    users = await User.find({}, "-password");
  } catch (err) {
    const error = new HttpError(
      "Fetching users failed, please try again.",
      500
    );
    return next(error);
  }

  res.json({ users: users.map((user) => user.toObject({ getters: true })) });
};

const signup = async (req, res, next) => {
  const { name, email, password } = req.body;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      // should not use `throw` error in asynchronous functions, instead, use `return next(error)`.
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      "Signing up failed, please try again later.",
      500
    );
    return next(error);
  }

  if (existingUser) {
    const error = new HttpError(
      "User exists already, please login instead.",
      422
    );
    return next(error);
  }

  let hashedPassword;

  try {
    // hash returns a promise, 12 here is the Salt length, and 12 is a good
    // length for reverse engeineering
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    const error = new HttpError(
      "Could not create user, please try again.",
      500
    );

    return next(error);
  }

  const createdUser = new User({
    name,
    email,
    image: req.file.path,
    password: hashedPassword,
    places: [],
  });

  try {
    await createdUser.save();
  } catch (err) {
    const error = new HttpError("Failed to sign up, please try again.", 500);
    return next(error);
  }

  let token;
  try {
    // sign method will return a string which is the token
    token = jwt.sign(
      // the payload,the data to be encoded into the token, it can be a string, an object or a buffer
      { userId: createdUser.id, email: createdUser.email },
      // private key, confidential server-side key
      "supersecret_dont_share",
      // optional argument
      { expiresIn: "1h" }
    );
  } catch (err) {
    const error = new HttpError("Failed to sign up, please try again.", 500);
    return next(error);
  }

  res
    .status(201)
    .json({ userId: createdUser.id, email: createdUser.email, token: token });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;
  let identifiedUser;
  try {
    identifiedUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      "Failed to log in, please try again later.",
      500
    );
    return next(error);
  }

  if (!identifiedUser) {
    const error = new HttpError(
      "Could not identify user, credentials seem to be wrong",
      401
    );

    return next(error);
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, identifiedUser.password);
  } catch (err) {
    const error = new HttpError(
      "Could not log you in, please check your credentials and try again.",
      500
    );
    return next(error);
  }

  if (!isValidPassword) {
    const error = new HttpError(
      "Invalid credentials, could not log you in.",
      401
    );
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      // the data we want to send back to frontend
      { userId: identifiedUser.id, email: identifiedUser.email },
      // note: make sure we use the same private key here as in signup, if not, when the
      // user later sends a token with a request, we wouldn't be able to validate them
      // correctly on the server.
      "supersecret_dont_share",
      { expiresIn: "1h" }
    );
  } catch (err) {}

  res.json({
    message: "Logged in!",
    userId: identifiedUser.id,
    email: identifiedUser.email,
    token: token,
  });
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
