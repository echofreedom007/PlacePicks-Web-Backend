const express = require("express");

const router = express.Router();

const placesControllers = require("../controllers/places-controllers");

// order can matter in the routing

// this path is appended to the path in app.js, so we shouldn't repeat the paths
router.get("/:pid", placesControllers.getPlaceById);

router.get("/user/:uid", placesControllers.getPlacesByUserId);

router.post("/", placesControllers.createPlace);

router.patch("/:pid", placesControllers.updatePlaceById);

router.delete("/:pid", placesControllers.deletePlaceById);

module.exports = router;
