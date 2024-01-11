const express = require("express");

const { check } = require("express-validator");

const router = express.Router();

const usersControllers = require("../controllers/users-controllers");

router.get("/", usersControllers.getUsers);

router.post(
  "/signup",
  [
    check("email").normalizeEmail().isEmail(),
    check("name").not().isEmpty(),
    check("password").isLength({ min: 6 }),
  ],
  usersControllers.signup
);

router.post("/login", usersControllers.login);

module.exports = router;
