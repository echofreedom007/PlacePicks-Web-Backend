const jwt = require("jsonwebtoken");

const HttpError = require("../models/http-errors");

module.exports = (req, res, next) => {
  // This is to handle a default browser behaviour, when we send requests except a get request, the
  // browser will send a Options request before the actual requests to check if the server supports
  // that to be sent request. Note this request does not need a token.
  // Therefore, this is a required adjustment to ensure that our options request is not blocked. The
  // actual post request which then triggers our place creation logic will still be validated.
  if (req.method === "OPTIONS") {
    return next();
  }

  try {
    const token = req.headers.authorization.split(" ")[1]; // Authorization: 'Bearer Token'
    // the scenatio that the authentication header is not set at all and therefore split fails
    if (!token) {
      throw new Error("Authentication failed!");
    }
    // verify returns the payload which we encoded in the jwt
    const decodedToken = jwt.verify(token, "supersecret_dont_share");
    req.userData = { userId: decodedToken.userId };
    next();
  } catch (err) {
    // the second scenario that the one above succeeds but it doesn't return a
    // valid token (which can be a falsy value)
    const error = new HttpError("Authentication failed!", 401);
    return next(error);
  }
};
