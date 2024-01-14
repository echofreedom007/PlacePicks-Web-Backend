const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

// a middleware to be used
const placesRoutes = require("./routes/places-routes");
const usersRoutes = require("./routes/users-routes");

const app = express();

const HttpError = require("./models/http-errors");

// add middleware before the request reaches the places routes, since the middlewares will be
// parsed from top to bottom, and we want to first parse the body and then reach the routes where we
// need the body.
// it calls next automatically so it reached to the next middleware.
app.use(bodyParser.json());

// Add a middleware before we forward the request to specific routes
app.use((req, res, next) => {
  // Add headers to the response so that when later a response is sent back from our more
  // specific routes, it deos have these headers attached.
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");

  next();
});

// the path just needs to start with `/api/places`, not exactly like it
app.use("/api/places", placesRoutes);

app.use("/api/users", usersRoutes);

app.use((req, res, next) => {
  const error = new HttpError("Could not find this route.", 404);
  throw error;
});

app.use((error, req, res, next) => {
  if (res.headerSent) {
    return next(error);
  }
  res
    .status(error.code || 500)
    .json({ message: error.message || "An unknown error occurred!" });
});

mongoose
  .connect(
    "mongodb+srv://blzhang41:yJeVJzUmBE2T8Sie@cluster0.oxhonrv.mongodb.net/mern?retryWrites=true&w=majority"
  )
  .then(() => {
    //if database connection is successful, start the backend server.
    app.listen(5000);
    console.log("We are connected to database!");
  })
  .catch((err) => {
    console.log(err);
  });

// a database can contain one or multiple collections and a collection can contain
// one or multiple documents.
