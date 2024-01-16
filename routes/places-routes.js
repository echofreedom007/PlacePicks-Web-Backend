const express = require("express");
const { check } = require("express-validator");

const router = express.Router();

const placesControllers = require("../controllers/places-controllers");
const fileUpload = require("../middleware/file-upload");

// order can matter in the routing
// this path is appended to the path in app.js, so we shouldn't repeat the paths
router.get("/:pid", placesControllers.getPlaceById);

router.get("/user/:uid", placesControllers.getPlacesByUserId);

router.post(
  "/",
  fileUpload.single("image"),
  [
    check("title").not().isEmpty(),
    check("description").isLength({ min: 5 }),
    check("address").not().isEmpty(),
  ],
  placesControllers.createPlace
);

router.patch(
  "/:pid",
  [check("title").not().isEmpty(), check("description").isLength({ min: 5 })],
  placesControllers.updatePlace
);

router.delete("/:pid", placesControllers.deletePlace);

module.exports = router;
