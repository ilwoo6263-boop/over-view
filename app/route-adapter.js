export const demoRoutes = {
  bus: [
    { id: 'r1', lat: 37.5219, lng: 126.9246, heading: 90, etaMinutes: 4 },
    { id: 'r2', lat: 37.5187, lng: 126.9362, heading: 90, etaMinutes: 7 },
    { id: 'r3', lat: 37.5164, lng: 126.9458, heading: 90, etaMinutes: 10 },
    { id: 'r4', lat: 37.5147, lng: 126.9581, heading: 85, etaMinutes: 13 }
  ],
  subway: [
    { id: 'r1', lat: 37.5219, lng: 126.9246, heading: 90, etaMinutes: 5 },
    { id: 'r2', lat: 37.5178, lng: 126.9415, heading: 80, etaMinutes: 8 },
    { id: 'r3', lat: 37.5155, lng: 126.9584, heading: 75, etaMinutes: 12 }
  ],
  walk: [
    { id: 'r1', lat: 37.5219, lng: 126.9246, heading: 90, etaMinutes: 6 },
    { id: 'r2', lat: 37.5184, lng: 126.9358, heading: 88, etaMinutes: 12 },
    { id: 'r3', lat: 37.5148, lng: 126.9487, heading: 85, etaMinutes: 18 }
  ],
  car: [
    { id: 'r1', lat: 37.5219, lng: 126.9246, heading: 90, etaMinutes: 3 },
    { id: 'r2', lat: 37.5178, lng: 126.9392, heading: 90, etaMinutes: 6 },
    { id: 'r3', lat: 37.5147, lng: 126.9581, heading: 88, etaMinutes: 9 }
  ]
};

export function buildDemoRoute(mode) {
  return demoRoutes[mode] || demoRoutes.bus;
}

export function distanceMeters(a, b) {
  const earthRadius = 6371000;
  const lat1 = a.lat * Math.PI / 180;
  const lat2 = b.lat * Math.PI / 180;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadius * Math.asin(Math.sqrt(h));
}

export function nearestRoutePoint(viewPoint, route) {
  return route.reduce((nearest, segment) => {
    const distance = distanceMeters(viewPoint, segment);
    if (!nearest || distance < nearest.distance) return { segment, distance };
    return nearest;
  }, null);
}
