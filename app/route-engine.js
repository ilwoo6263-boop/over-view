export function distanceMeters(a, b) {
  const rad = value => value * Math.PI / 180;
  const dLat = rad(b.lat - a.lat); const dLng = rad(b.lng - a.lng);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function pointPosition(point) { return { lat: point.lat ?? point.latitude, lng: point.lng ?? point.longitude }; }
function isCompatible(point, route, segment) {
  const supported = point.transportModes || [];
  if (supported.includes(route.mode)) return true;
  return supported.includes(segment.transportMode?.toLowerCase());
}

function sideFit(point, segment, target) {
  if (point.viewingSide === 'front' || !segment.heading) return 0.75;
  const end = { lat: segment.endLat ?? segment.lat, lng: segment.endLng ?? segment.lng };
  const dx = end.lng - segment.lng; const dy = end.lat - segment.lat;
  const cross = dx * (target.lat - segment.lat) - dy * (target.lng - segment.lng);
  const actualSide = cross > 0 ? 'left' : 'right';
  return actualSide === point.viewingSide ? 1 : 0.15;
}

export function rankViewPoints(points, route, timeContext) {
  return points.map(point => {
    const target = pointPosition(point);
    const candidates = route.segments.filter(segment => Number.isFinite(segment.lat) && isCompatible(point, route, segment));
    const nearest = candidates.reduce((best, segment) => {
      const distance = distanceMeters(target, segment);
      return !best || distance < best.distance ? { segment, distance } : best;
    }, null);
    const routeProximity = nearest ? Math.max(0, 1 - nearest.distance / 1200) : 0;
    const timeFit = point.timing?.includes(timeContext) ? 1 : 0.2;
    const directionFit = nearest ? sideFit(point, nearest.segment, target) : 0;
    const transportFit = nearest ? 1 : 0;
    const score = (point.visibilityScore || 0) * 0.30 + routeProximity * 0.20 + transportFit * 0.15 + directionFit * 0.15 + timeFit * 0.10 + 0.10;
    return { ...point, lat: target.lat, lng: target.lng, score, etaSeconds: nearest?.segment.etaSeconds ?? null, routeDistanceMeters: Math.round(nearest?.distance ?? Infinity), transit: nearest?.segment.transit ?? null };
  }).filter(point => point.routeDistanceMeters < 1200).sort((a, b) => a.etaSeconds - b.etaSeconds || b.score - a.score);
}
