const ROUTES_ENDPOINT = 'https://routes.googleapis.com/directions/v2:computeRoutes';

function waypoint(value) {
  return typeof value === 'string'
    ? { address: value }
    : { location: { latLng: { latitude: value.lat, longitude: value.lng } } };
}

const modeMap = {
  walk: 'WALK',
  car: 'DRIVE',
  bus: 'TRANSIT',
  subway: 'TRANSIT',
};

export async function computeGoogleRoute({ apiKey, origin, destination, mode, departureTime }) {
  if (!apiKey) throw new Error('Google Routes API key is not configured.');

  const body = {
    origin: waypoint(origin),
    destination: waypoint(destination),
    travelMode: modeMap[mode] || 'TRANSIT',
    languageCode: 'ko-KR',
    units: 'METRIC',
    polylineQuality: 'OVERVIEW',
    polylineEncoding: 'ENCODED_POLYLINE',
  };

  if (modeMap[mode] === 'TRANSIT' && departureTime) {
    body.departureTime = new Date(departureTime).toISOString();
  }

  const response = await fetch(ROUTES_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': [
        'routes.distanceMeters',
        'routes.duration',
        'routes.polyline.encodedPolyline',
        'routes.legs.steps',
        'routes.legs.transitDetails',
      ].join(','),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Google Routes API ${response.status}: ${detail}`);
  }

  const data = await response.json();
  const route = data.routes?.[0];
  if (!route) throw new Error('Google Maps에서 경로를 찾지 못했습니다.');

  return {
    provider: 'google',
    mode,
    distanceMeters: route.distanceMeters ?? 0,
    durationSeconds: parseDuration(route.duration),
    encodedPolyline: route.polyline?.encodedPolyline ?? '',
    legs: route.legs ?? [],
  };
}

function parseDuration(value = '0s') {
  return Number.parseFloat(String(value).replace('s', '')) || 0;
}
