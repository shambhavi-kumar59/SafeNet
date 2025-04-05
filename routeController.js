// Evacuation Route Controller
const EvacuationRoute = require('../models/EvacuationRoute');
const Disaster = require('../models/Disaster');
const { calculateOptimalRoute } = require('../services/routeService');

// Helper function to calculate distance between coordinates
const haversineDistance = (coord1, coord2) => {
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

module.exports = {
  /**
   * Get evacuation routes near user location
   */
  getRoutes: async (req, res) => {
    try {
      const { lng, lat, disasterType } = req.query;
      const userLocation = [parseFloat(lng), parseFloat(lat)];

      // Validate coordinates
      if (!lng || !lat || isNaN(userLocation[0]) || isNaN(userLocation[1])) {
        return res.status(400).json({ error: 'Invalid coordinates provided' });
      }

      // Find nearby active disasters
      const disasters = await Disaster.find({
        type: disasterType,
        status: 'active',
        'location.coordinates': {
          $nearSphere: {
            $geometry: {
              type: 'Point',
              coordinates: userLocation
            },
            $maxDistance: 10000 // 10km in meters
          }
        }
      });

      if (disasters.length === 0) {
        return res.status(404).json({ message: 'No active disasters in your area' });
      }

      // Get evacuation routes
      const routes = await EvacuationRoute.find({
        disasterType,
        'startLocation.coordinates': {
          $nearSphere: {
            $geometry: {
              type: 'Point',
              coordinates: userLocation
            },
            $maxDistance: 5000 // 5km in meters
          }
        },
        status: 'open'
      });

      // Calculate optimal route
      const recommendedRoute = calculateOptimalRoute(userLocation, routes);

      res.json({
        userLocation,
        nearbyDisasters: disasters,
        availableRoutes: routes,
        recommendedRoute
      });

    } catch (err) {
      console.error('Route fetch error:', err);
      res.status(500).json({ 
        error: 'Failed to fetch routes',
        details: err.message 
      });
    }
  },

  /**
   * Update route status (open/closed/congested)
   */
  updateRouteStatus: async (req, res) => {
    try {
      const { routeId, status, userId } = req.body;
      
      const updatedRoute = await EvacuationRoute.findByIdAndUpdate(
        routeId,
        { 
          status,
          lastUpdated: new Date(),
          $push: { 
            statusUpdates: { 
              status, 
              reportedBy: userId, 
              timestamp: new Date() 
            } 
          }
        },
        { new: true }
      );

      if (!updatedRoute) {
        return res.status(404).json({ error: 'Route not found' });
      }

      res.json(updatedRoute);
    } catch (err) {
      console.error('Route update error:', err);
      res.status(500).json({ 
        error: 'Failed to update route status',
        details: err.message 
      });
    }
  }
};
