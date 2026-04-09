const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  image: { type: String, default: "" },
});

module.exports = mongoose.model("Product", productSchema);