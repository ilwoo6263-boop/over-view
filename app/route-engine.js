export function buildPrototypeRoute({ origin, destination, mode }) {
  const presets = {
    bus: [
      { id: 'r1', lat: 37.5219, lng: 126.9244, heading: 110, transportMode: 'bus', etaMinutes: 2 },
      { id: 'r2', lat: 37.5186, lng: 126.9368, heading: 95, transportMode: 'bus', etaMinutes: 4 },
      { id: 'r3', lat: 37.5152, lng: 126.9485, heading: 85, transportMode: 'bus', etaMinutes: 6 },
      { id: 'r4', lat: 37.5132, lng: 126.9607, heading: 75, transportMode: 'bus', etaMinutes: 8 }
    ],
    subway: [
      { id: 'r1', lat: 37.5219, lng: 126.9244, heading: 105, transportMode: 'subway', etaMinutes: 3 },
      { id: 'r2', lat: 37.5170, lng: 126.9410, heading: 90, transportMode: 'subway', etaMinutes: 6 },
      { id: 'r3', lat: 37.5132, lng: 126.9607, heading: 75, transportMode: 'subway', etaMinutes: 9 }
    ],
    walk: [
      { id: 'r1', lat: 37.5219, lng: 126.9244, heading: 90, transportMode: 'walk', etaMinutes: 2 },
      { id: 'r2', lat: 37.5180, lng: 126.9370, heading: 85, transportMode: 'walk', etaMinutes: 5 },
      { id: 'r3', lat: 37.5132, lng: 126.9607, heading: 75, transportMode: 'walk', etaMinutes: 9 }
    ],
    car: [
      { id: 'r1', lat: 37.5219, lng: 126.9244, heading: 105, transportMode: 'car', etaMinutes: 2 },
      { id: 'r2', lat: 37.5170, lng: 126.9420, heading: 90, transportMode: 'car', etaMinutes: 5 },
      { id: 'r3', lat: 37.5132, lng: 126.9607, heading: 75, transportMode: 'car', etaMinutes: 7 }
    ]
  };

  return {
    origin: { label: origin },
    destination: { label: destination },
    mode,
    distanceMeters: 4200,
    durationSeconds: (presets[mode] || presets.walk).at(-1).etaMinutes * 60,
    segments: presets[mode] || presets.walk
  };
}

export function distanceMeters(a, b) {
  const R = 6371000;
  const rad = value => value * Math.PI / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export function bearingDegrees(a, b) {
  const lat1 = a.lat * Math.PI / 180;
  const lat2 = b.lat * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

export function rankViewPoints(points, route, timeContext) {
  return points
    .filter(point => point.transportModes.includes(route.mode))
    .map(point => {
      const nearest = route.segments.reduce((best, segment) => {
        const distance = distanceMeters(point, segment);
        return !best || distance < best.distance ? { segment, distance } : best;
      }, null);
      const routeProximity = nearest ? Math.max(0, 1 - nearest.distance / 1200) : 0;
      const timeFit = point.timing.includes(timeContext) ? 1 : 0.2;
      const directionFit = point.viewingSide === 'front' || nearest ? 0.9 : 0.4;
      const score = (point.visibilityScore || 0) * 0.35 + routeProximity * 0.3 + timeFit * 0.2 + directionFit * 0.15;
      return { ...point, score, etaMinutes: nearest?.segment.etaMinutes ?? null, routeDistanceMeters: Math.round(nearest?.distance ?? 9999) };
    })
    .filter(point => point.routeDistanceMeters < 1500)
    .sort((a, b) => a.etaMinutes - b.etaMinutes || b.score - a.score);
}
