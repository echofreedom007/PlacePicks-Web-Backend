const HttpError = require("../models/http-errors");
const { validationResult } = require("express-validator");
const User = require("../models/user");

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

  const createdUser = new User({
    name,
    email,
    image: req.file.path,
    password,
    places: [],
  });

  try {
    await createdUser.save();
  } catch (err) {
    const error = new HttpError("Failed to sign up, please try again.", 500);
    console.log(err);
    return next(error);
  }

  res.status(201).json({ user: createdUser.toObject({ getters: true }) });
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

  if (!identifiedUser || identifiedUser.password !== password) {
    const error = new HttpError(
      "Could not identify user, credentials seem to be wrong",
      401
    );

    return next(error);
  }

  res.json({
    message: "Logged in!",
    user: identifiedUser.toObject({ getters: true }),
  });
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
