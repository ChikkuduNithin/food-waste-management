const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    quantity: {
      type: String,
      required: [true, 'Quantity is required'],
      trim: true,
    },
    expiryTime: {
      type: Date,
      required: [true, 'Expiry time is required'],
    },
    location: {
      address: {
        type: String,
        trim: true,
      },
      lat: {
        type: Number,
        required: [true, 'Latitude is required'],
        min: [-90, 'Latitude must be between -90 and 90'],
        max: [90, 'Latitude must be between -90 and 90'],
      },
      lng: {
        type: Number,
        required: [true, 'Longitude is required'],
        min: [-180, 'Longitude must be between -180 and 180'],
        max: [180, 'Longitude must be between -180 and 180'],
      },
    },
    status: {
      type: String,
      enum: ['available', 'requested', 'completed', 'expired'],
      default: 'available',
    },
    category: {
      type: String,
      enum: ['cooked', 'raw', 'packaged', 'beverages', 'other'],
      default: 'other',
    },
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    images: [{ type: String }],
  },
  { timestamps: true }
);

// Index for geospatial queries and status filter
foodSchema.index({ 'location.lat': 1, 'location.lng': 1 });
foodSchema.index({ status: 1 });
foodSchema.index({ donor: 1 });

module.exports = mongoose.model('Food', foodSchema);
