const HttpError = require("../models/http-errors");

const uuid = require("uuid");

const { validationResult } = require("express-validator");

// let isLoggedIn = false;

let DUMMY_USERS = [
  {
    id: "u1",
    name: "test01",
    email: "u1@gmail.com",
    password: "12345",
  },
  {
    id: "u2",
    name: "test01",
    email: "u1@gmail.com",
    password: "67890",
  },
];

const getUsers = (req, res, next) => {
  //   if (!allUsers || allUsers.length === 0) {
  //     throw new HttpError("Could not find any users", 404);
  //   }
  res.json({ users: DUMMY_USERS });
};

const signup = (req, res, next) => {
  const { name, email, password } = req.body;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    throw new HttpError("Invalid inputs passed, please check your data.", 422);
  }

  const hasUser = DUMMY_USERS.find((u) => u.email === email);
  if (hasUser) {
    throw new HttpError("Could not create user, email already exists.", 422);
  }
  const createdUser = {
    id: uuid.v4(),
    name,
    email,
    password,
  };

  DUMMY_USERS.push(createdUser);

  res.status(201).json({ user: createdUser });
};

const login = (req, res, next) => {
  const { email, password } = req.body;
  const identifiedUser = DUMMY_USERS.find((u) => u.email === email);
  if (!identifiedUser || identifiedUser.password !== password) {
    throw new HttpError(
      "Could not identify user, credentials seem to be wrong",
      401
    );
  }

  res.json({ message: "Logged in!" });
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
