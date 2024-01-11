const uuid = require("uuid");

const HttpError = require("../models/http-errors");

let DUMMY_PLACES = [
  {
    id: "p1",
    title: "Tofino, British Columbia",
    description:
      "A popular year-round tourism destination, Tofino's summer population swells to many times its winter size. It attracts surfers, hikers, nature lovers, bird watchers, campers, whale watchers, fishers, or anyone just looking to be close to nature.",
    imageUrl:
      "https://www.travelandleisure.com/thmb/30qfukQH1j5olGSTkZQqsM4phoI=/750x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/TAL-tofino-BEAUTYCANADA0623-6d4980ad850c4b668185364daf4ce7fd.jpg",
    address: "411 Campbell Street, Tofino",
    location: {
      lat: 49.1523597,
      lng: -125.9068902,
    },
    creator: "u1",
  },
  {
    id: "p2",
    title: "To",
    description: "A popular destination.",
    imageUrl:
      "https://www.travelandleisure.com/thmb/30qfukQH1j5olGSTkZQqsM4phoI=/750x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/TAL-tofino-BEAUTYCANADA0623-6d4980ad850c4b668185364daf4ce7fd.jpg",
    address: "411 Campbell Street, Tofino",
    location: {
      lat: 49.1523597,
      lng: -125.9068902,
    },
    creator: "u2",
  },
  {
    id: "p3",
    title: "Tofino",
    description: "A popular year-round tourism destination.",
    imageUrl:
      "https://www.travelandleisure.com/thmb/30qfukQH1j5olGSTkZQqsM4phoI=/750x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/TAL-tofino-BEAUTYCANADA0623-6d4980ad850c4b668185364daf4ce7fd.jpg",
    address: "411 Campbell Street, Tofino",
    location: {
      lat: 49.1523597,
      lng: -125.9068902,
    },
    creator: "u2",
  },
];

const getPlaceById = (req, res, next) => {
  const placeId = req.params.pid;
  const place = DUMMY_PLACES.find((p) => p.id === placeId);

  if (!place) {
    // we can choose either to use throw to throw the error here, or to use next to forward the error to
    // app.js, but the better option is to use next. The reason is that we might be using a asynchronous middleware.
    //-------
    // throw can cancel the function execution, no need for return
    throw new HttpError("Could not find a place for the provided id.", 404);
  }

  res.json({ place });
};

const getPlacesByUserId = (req, res, next) => {
  const userId = req.params.uid;
  //find only return the first element when the condition is true, while filter can return
  // an array of elments that meet the condition
  const places = DUMMY_PLACES.filter((p) => p.creator === userId);

  // `!places` does not contain the case that place is an empty array
  if (!places || places.length === 0) {
    // next does not cancel the function execution as throw does, so need to return it
    return next(
      new HttpError("Could not find a place for the provided user id.", 404)
    );
  }
  res.json({ places });
};

// GET request does not have a request body, while POST request does
const createPlace = (req, res, next) => {
  // get the properties out of the request body
  const { title, description, coordinates, address, creator } = req.body;

  const createdPlace = {
    id: uuid.v4(),
    title, //short for title: title
    description,
    location: coordinates,
    address,
    creator,
  };
  DUMMY_PLACES.push(createdPlace); // unshift(createdPlace) if want to add to the beginning

  res.status(201).json({ place: createdPlace });
};

const updatePlaceById = (req, res, next) => {
  const placeId = req.params.pid;
  const { title, description } = req.body;

  //update the properties in an immutable manner. Store the updated data in a variable, and only
  // when this process is done successfully, will we update the array with this variable.
  const updatedPlace = { ...DUMMY_PLACES.find((p) => p.id === placeId) };
  const placeIndex = DUMMY_PLACES.findIndex((p) => p.id === placeId);
  updatedPlace.title = title;
  updatedPlace.description = description;

  DUMMY_PLACES[placeIndex] = updatedPlace;

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

  res.status(200).json({ places: updatedPlace });
};

const deletePlaceById = (req, res, next) => {
  const placeId = req.params.pid;

  //filter() return a brand new array, adhering to the immutablility principle

  DUMMY_PLACES = DUMMY_PLACES.filter((p) => p.id !== placeId);

  res.status(200).json({ mesage: "Deleted place.", place: DUMMY_PLACES });
};

exports.getPlaceById = getPlaceById; // note: use getPlaceById instead of getPlaceById() since we don't call it here.
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlaceById = updatePlaceById;
exports.deletePlaceById = deletePlaceById;
