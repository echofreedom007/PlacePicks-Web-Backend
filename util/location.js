const axios = require("axios");
const { response } = require("express");

const API_KEY = "AIzaSyBQ4Cw9oA_v7M-EDu7zuWnP8k9L8gskCpM";

const HttpError = require("../models/http-errors");

async function getCoordsForAddress(address) {
  //   return { lat: 49.1523597, lng: -125.9068902 };
  const response = await axios.get(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}1600+Amphitheatre+Parkway,+Mountain+View,+CA&key=${API_KEY}`
  );

  const data = response.data;
  console.log(data);

  if (!data || data.status === "ZERO_RESULTS") {
    const error = new HttpError(
      "Could not find location for the specified address.",
      422
    );
    throw error;
  }

  const coordinates = data.results[0].geometry.location;

  return coordinates;
}

module.exports = getCoordsForAddress;
