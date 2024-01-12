const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const placeSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  //img should be stoed as a url in the database instead of the actual file. One reason is
  // to store large files into the databse can slow down the process of databse.
  image: { type: String, required: true },
  address: { type: String, required: true },
  // mongoose supports to add nested object here
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  creator: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
});

// this specified name `Place` will auto-generate the collection name into `places`.
module.exports = mongoose.model("Place", placeSchema);
