// models/image.js

const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  requestId: String,
  serialNumber: String,  // Add Serial Number
  productName: String,   // Add Product Name
  imageUrl: String,
  status: { type: String, enum: ['processing', 'finished', 'error'], default: 'processing' },
  processedImageUrl: String, // Optional: to store the URL of the processed image
  errorMessage: String, // Optional: to store any error messages
});

const Image = mongoose.model('Image', imageSchema);

module.exports = Image;
