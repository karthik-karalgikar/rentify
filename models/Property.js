// models/Property.js
const mongoose = require('mongoose');

const PropertySchema = new mongoose.Schema({
  place: { type: String, required: true },
  area: { type: String, required: true },
  bedrooms: { type: Number, required: true },
  bathrooms: { type: Number, required: true },
  hospitalsNearby: { type: String },
  collegesNearby: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true } // Link to user
});

module.exports = mongoose.model('Property', PropertySchema);
