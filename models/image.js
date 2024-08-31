// models/image.js

const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  requestId: String,
  imageUrl: String,
  status: { type: String, enum: ['processing', 'finished'], default: 'processing' },
  processedImageUrl: String, // Optional: to store the URL of the processed image
});

const Image = mongoose.model('Image', imageSchema);

module.exports = Image;
