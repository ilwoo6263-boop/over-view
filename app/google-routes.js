const ROUTES_ENDPOINT = 'https://routes.googleapis.com/directions/v2:computeRoutes';

const modeMap = { walk: 'WALK', car: 'DRIVE', bus: 'TRANSIT', subway: 'TRANSIT' };

function waypoint(value) {
  return typeof value === 'string'
    ? { address: value }
    : { location: { latLng: { latitude: value.lat, longitude: value.lng } } };
}

function parseDuration(value = '0s') {
  return Number.parseFloat(String(value).replace('s', '')) || 0;
}

function position(location) {
  const latLng = location?.latLng;
  return latLng ? { lat: latLng.latitude, lng: latLng.longitude } : null;
}

function bearingDegrees(a, b) {
  if (!a || !b) return 0;
  const rad = value => value * Math.PI / 180;
  const y = Math.sin(rad(b.lng - a.lng)) * Math.cos(rad(b.lat));
  const x = Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) - Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(rad(b.lng - a.lng));
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

function transitDetails(details) {
  if (!details) return null;
  const line = details.transitLine || {};
  const stops = details.stopDetails || details;
  return {
    vehicle: line.vehicle?.type || line.vehicle?.name || null,
    routeNumber: line.nameShort || line.name || null,
    routeName: line.name || null,
    departureStop: stops.departureStop?.name || null,
    arrivalStop: stops.arrivalStop?.name || null,
    departureTime: stops.departureTime || null,
    arrivalTime: stops.arrivalTime || null,
    stopCount: details.stopCount ?? null,
    headsign: details.headsign || null,
  };
}

export function normalizeGoogleRoute(rawRoute, { origin, destination, mode }) {
  let elapsedSeconds = 0;
  let distanceFromStartMeters = 0;
  const segments = (rawRoute.legs || []).flatMap(leg => (leg.steps || []).map((step, index) => {
    const start = position(step.startLocation);
    const end = position(step.endLocation) || start;
    const durationSeconds = parseDuration(step.staticDuration || step.duration);
    const distanceMeters = step.distanceMeters || 0;
    const segment = {
      id: `google-step-${index}-${elapsedSeconds}`,
      ...(start || {}),
      endLat: end?.lat,
      endLng: end?.lng,
      distanceFromStartMeters,
      durationSeconds,
      etaSeconds: elapsedSeconds,
      heading: bearingDegrees(start, end),
      transportMode: String(step.travelMode || modeMap[mode] || mode).toLowerCase(),
      transit: transitDetails(step.transitDetails),
    };
    elapsedSeconds += durationSeconds;
    distanceFromStartMeters += distanceMeters;
    return segment;
  }));

  return {
    provider: 'google',
    mode,
    origin: { label: typeof origin === 'string' ? origin : '', ...(typeof origin === 'object' ? origin : {}) },
    destination: { label: typeof destination === 'string' ? destination : '', ...(typeof destination === 'object' ? destination : {}) },
    distanceMeters: rawRoute.distanceMeters || 0,
    durationSeconds: parseDuration(rawRoute.duration),
    polyline: rawRoute.polyline?.encodedPolyline || '',
    segments,
  };
}

export async function computeGoogleRoute({ apiKey, origin, destination, mode, departureTime }) {
  if (!apiKey) throw new Error('Google Maps API key is not configured.');
  const travelMode = modeMap[mode] || 'TRANSIT';
  const body = {
    origin: waypoint(origin), destination: waypoint(destination), travelMode,
    languageCode: 'ko-KR', units: 'METRIC', polylineQuality: 'OVERVIEW', polylineEncoding: 'ENCODED_POLYLINE',
  };
  if (travelMode === 'TRANSIT' && departureTime) body.departureTime = new Date(departureTime).toISOString();

  const response = await fetch(ROUTES_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json', 'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': [
        'routes.distanceMeters', 'routes.duration', 'routes.polyline.encodedPolyline',
        'routes.legs.steps.startLocation', 'routes.legs.steps.endLocation',
        'routes.legs.steps.distanceMeters', 'routes.legs.steps.staticDuration',
        'routes.legs.steps.travelMode', 'routes.legs.steps.transitDetails',
      ].join(','),
    }, body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`Google Routes API ${response.status}: ${await response.text()}`);
  const rawRoute = (await response.json()).routes?.[0];
  if (!rawRoute) throw new Error('Google Maps did not return a route.');
  return normalizeGoogleRoute(rawRoute, { origin, destination, mode });
}
