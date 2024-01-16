const fs = require("fs");
const { validationResult } = require("express-validator");

const HttpError = require("../models/http-errors");

const getCoordsForAddress = require("../util/location");

const Place = require("../models/place");
const User = require("../models/user");
const mongoose = require("mongoose");

// note: must use async and await
const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid;
  let place;

  // Note: the folowing 2 error handlers are dif, the first one is to catch the case that
  // out get request generally has some problems (i.e. missing information), while
  // the second one is to handle the case such as we don't have our places id in our
  // in the database.

  try {
    // compared to the save method, findById method does not return a real promise (although
    // we can still use then cach blocks or async await), we can use exec() to get a real promise.
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not find a place.",
      500
    );
    return next(error);
  }

  if (!place) {
    // we can choose either to use throw to throw the error here, or to use next to forward the error to
    // app.js, but the better option is to use next. The reason is that we might be using a asynchronous middleware.
    // throw can cancel the function execution, no need for return

    const error = new HttpError(
      "Could not find a place for the provided id.",
      404
    );

    return next(error);
  }

  res.json({ place: place.toObject({ getters: true }) });
};

const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;
  //Array.find only return the first element when the condition is true, while filter can return
  // an array of elments that meet the condition
  let places;

  try {
    // this mongoose find method will return all the results that meet the requirements
    places = await Place.find({ creator: userId });
  } catch (err) {
    const error = new HttpError(
      "Fetching places failed, please try again.",
      500
    );
    return next(error);
  }

  // `!places` does not contain the case that place is an empty array
  if (!places) {
    // next does not cancel the function execution as throw does, so need to return it
    return next(
      new HttpError("Could not find a place for the provided user id.", 404)
    );
  }

  // The toObject method is applicable to individual Mongoose documents, not to an array
  // of documents directly. If you want to convert an array of documents to an array
  // of plain JavaScript objects, you should use map or another iteration method.
  res.json({ places: places.map((p) => p.toObject({ getters: true })) });
};

// GET request does not have a request body, while POST request does
const createPlace = async (req, res, next) => {
  // after we set up check apis in the places route, we should also return error object here, then
  // we can set up the full validations.
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }

  // get the properties out of the request body
  const { title, description, address, creator } = req.body;
  let coordinates;
  try {
    coordinates = await getCoordsForAddress(address);
  } catch (error) {
    return next(error);
  }

  const createdPlace = new Place({
    title, //short for title: title
    description,
    address,
    location: coordinates,
    image: req.file.path,
    creator,
  });

  let user;
  try {
    user = await User.findById(creator);
  } catch (err) {
    const error = new HttpError(
      "Failed to create places, please try again.",
      500
    );
    return next(error);
  }

  if (!user) {
    const error = new HttpError("Could not find user for provided id.", 404);
    return next(error);
  }
  console.log(user);

  try {
    // session and transaction
    const sess = await mongoose.startSession();
    sess.startTransaction();
    // auto-generate the unique id for added places and store them in mongodb
    await createdPlace.save({ session: sess });

    // This push method is not JavaScript array push, instead, it is a Mongoose method
    // to establish the connection between the two models we are referring to behind the scene.
    user.places.push(createdPlace);
    await user.save({ session: sess });
    // Note: only at this point, the changes are really saved in the db. If anything
    // gone wrong in the tasks that are part of the session and transaction, all changes
    // would have been rolled back automatically by MongoDB.
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Creating place failed, please try again.",
      500
    );
    return next(error);
  }

  res.status(201).json({ place: createdPlace });
};

const updatePlace = async (req, res, next) => {
  const placeId = req.params.pid;
  const { title, description } = req.body;
  let place;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }

  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError(
      "Failed to update places, please try again.",
      500
    );
    return next(error);
  }

  // //update the properties in an immutable manner. Store the updated data in a variable, and only
  // // when this process is done successfully, will we update the array with this variable.
  // const updatedPlace = { ...DUMMY_PLACES.find((p) => p.id === placeId) };
  // const placeIndex = DUMMY_PLACES.findIndex((p) => p.id === placeId);

  place.title = title;
  place.description = description;

  try {
    await place.save();
  } catch (err) {
    const error = new HttpError(
      "Failed to update places, please try again.",
      500
    );
    return next(error);
  }

  // const updatedPlaces = DUMMY_PLACES.map((p) => {
  //   if (p.id === placeId) {
  //     return {
  //       ...p,
  //       title,
  //       description,
  //     };
  //   }
  //   return p;
  // });

  res.status(200).json({ places: place.toObject({ getters: true }) });
};

const deletePlace = async (req, res, next) => {
  const placeId = req.params.pid;
  let place;

  try {
    // populate method is to refer to the property in other collections
    place = await Place.findById(placeId).populate("creator");
    // console.log(place);
  } catch (err) {
    // console.log(err);
    const error = new HttpError(
      "Failed to delete places, please try again.",
      500
    );
    return next(error);
  }

  if (!place) {
    const error = new HttpError("Could not find place for this id.", 404);
    return next(error);
  }

  const imagePath = place.image;

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    // document.remove() is descrepted, now using deleteOne()
    await place.deleteOne({ session: sess });

    // pull method will automatically remove the id
    place.creator.places.pull(place);
    // save the newly created user
    await place.creator.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    // console.log(err);
    const error = new HttpError(
      "Failed to delete places, please try again.",
      500
    );
    return next(error);
  }

  fs.unlink(imagePath, (err) => {
    console.log(err);
  });

  // if (!DUMMY_PLACES.find((p) => p.id === placeId)) {
  //   throw new HttpError("COuld not find a place for that id.", 404);
  // }
  // //filter() return a brand new array, adhering to the immutablility principle
  // DUMMY_PLACES = DUMMY_PLACES.filter((p) => p.id !== placeId);

  res.status(200).json({ message: "Deleted place." });
};

exports.getPlaceById = getPlaceById; // note: use getPlaceById instead of getPlaceById() since we don't call it here.
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
