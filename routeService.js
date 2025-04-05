// routService//
const turf = require('@turf/turf');
const natural = require('natural');
const tokenizer = new natural.WordTokenizer();

module.exports = {
  /**
   * Calculate optimal evacuation route based on multiple factors
   * @param {Array} userLocation - [longitude, latitude] 
   * @param {Array} routes - Array of evacuation route documents
   * @returns {Object} Best route with additional metrics
   */
  calculateOptimalRoute: (userLocation, routes) => {
    if (!routes || routes.length === 0) return null;

    const userPoint = turf.point(userLocation);
    const now = new Date();
    
    // Score and enhance each route
    const enhancedRoutes = routes.map(route => {
      // Create Turf.js line string for geospatial calculations
      const routeLine = turf.lineString([
        route.startLocation.coordinates,
        ...route.waypoints.map(wp => wp.coordinates),
        route.safeLocation.coordinates
      ]);
      
      // Calculate key metrics
      const distanceToStart = turf.distance(
        userPoint,
        turf.point(route.startLocation.coordinates),
        { units: 'kilometers' }
      );
      
      const routeDistance = turf.length(routeLine, { units: 'kilometers' });
      const estimatedTime = routeDistance * 15; // 15 min per km (conservative)
      
      // Calculate congestion score (0-1 where 1 is least congested)
      const congestionScore = Math.min(1, route.capacity / (route.users || 1));
      
      // Calculate freshness score (recent updates are better)
      const hoursSinceUpdate = (now - new Date(route.lastUpdated)) / (1000 * 60 * 60);
      const freshnessScore = Math.max(0, 1 - (hoursSinceUpdate / 24));
      
      // Combine scores with weighted factors
      const score = (
        0.3 * (1 / (1 + distanceToStart)) + // Closer is better
        0.2 * (1 / (1 + routeDistance)) +   // Shorter routes are better
        0.3 * congestionScore +             // Less congestion is better
        0.2 * freshnessScore                // Recent updates are better
      );
      
      return {
        ...route.toObject(),
        routeLine: routeLine,
        distanceToStart,
        routeDistance,
        estimatedTime: Math.round(estimatedTime),
        congestionScore,
        freshnessScore,
        overallScore: score,
        safetyInstructions: generateSafetyInstructions(route.disasterType)
      };
    });

    // Return routes sorted by score (descending)
    return enhancedRoutes.sort((a, b) => b.overallScore - a.overallScore);
  },

  /**
   * Generate evacuation polygons for visualization
   */
  generateEvacuationZones: (disasterEpicenter, radiusKm) => {
    const center = turf.point(disasterEpicenter);
    return {
      dangerZone: turf.circle(center, radiusKm, { steps: 64, units: 'kilometers' }),
      warningZone: turf.circle(center, radiusKm * 1.5, { steps: 64, units: 'kilometers' })
    };
  }
};

// Generate appropriate safety instructions based on disaster type
function generateSafetyInstructions(disasterType) {
  const instructions = {
    earthquake: [
      "Avoid buildings and power lines",
      "Cover your head and neck",
      "If indoors, stay inside and take cover under sturdy furniture"
    ],
    flood: [
      "Avoid walking through moving water",
      "Do not drive through flooded areas",
      "Move to higher ground immediately"
    ],
    wildfire: [
      "Wear protective clothing",
      "Breathe through a wet cloth",
      "Move perpendicular to the fire's path"
    ],
    hurricane: [
      "Stay away from windows",
      "Take refuge in a small interior room",
      "Avoid using electrical equipment"
    ],
    default: [
      "Follow official evacuation routes",
      "Stay calm and move quickly",
      "Help others if it's safe to do so"
    ]
  };
  
  return instructions[disasterType] || instructions.default;
}
