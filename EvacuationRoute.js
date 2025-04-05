//EvacuationRoute//
const mongoose = require('mongoose');

const EvacuationRouteSchema = new mongoose.Schema({
  disasterType: { 
    type: String, 
    required: true,
    enum: ['earthquake', 'flood', 'wildfire', 'hurricane', 'tornado']
  },
  startLocation: {
    type: {
      type: String,
      default: 'Point',
      required: true
    },
    coordinates: {
      type: [Number],  // [longitude, latitude]
      required: true
    },
    name: { type: String, required: true }
  },
  safeLocation: {
    type: {
      type: String,
      default: 'Point',
      required: true
    },
    coordinates: {
      type: [Number],  // [longitude, latitude]
      required: true
    },
    name: { type: String, required: true }
  },
  waypoints: {
    type: [{
      coordinates: [Number],
      name: String,
      instructions: String
    }],
    required: true
  },
  distance: { type: Number, required: true }, // in km
  estimatedTime: { type: Number, required: true }, // in minutes
  capacity: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['open', 'closed', 'congested'], 
    default: 'open' 
  },
  lastUpdated: { 
    type: Date, 
    default: Date.now 
  }
});

// Create 2dsphere index for geospatial queries
EvacuationRouteSchema.index({ startLocation: '2dsphere' });
EvacuationRouteSchema.index({ safeLocation: '2dsphere' });

module.exports = mongoose.model('EvacuationRoute', EvacuationRouteSchema);
