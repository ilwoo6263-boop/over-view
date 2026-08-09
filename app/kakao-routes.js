// Kakao route provider — geocoding (Kakao Local) + car directions (Kakao Mobility).
// Produces the SAME normalized route model as google-routes.js so the View
// Intelligence engine (route-engine.js) stays provider-neutral.
//
// NOTE: Kakao Mobility Directions covers driving routes. Kakao does not expose a
// free browser transit-routing API, so walk/bus/subway are approximated by the
// driving path for now; route.mode is still passed through for ranking.
// NOTE: Kakao REST endpoints may require a CORS proxy when called from a browser
// on domains not registered in the Kakao Developers console.

const DIRECTIONS_ENDPOINT = 'https://apis-navi.kakaomobility.com/v1/directions';
const GEOCODE_ENDPOINT = 'https://dapi.kakao.com/v2/local/search/keyword.json';

function bearingDegrees(a, b) {
  if (!a || !b) return 0;
  const rad = value => value * Math.PI / 180;
  const y = Math.sin(rad(b.lng - a.lng)) * Math.cos(rad(b.lat));
  const x = Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) - Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(rad(b.lng - a.lng));
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

// Kakao vertexes are a flat [lng, lat, lng, lat, ...] array.
function roadVertexes(vertexes = []) {
  const coords = [];
  for (let i = 0; i + 1 < vertexes.length; i += 2) coords.push({ lat: vertexes[i + 1], lng: vertexes[i] });
  return coords;
}

export function normalizeKakaoRoute(rawRoute, { origin, destination, mode }) {
  let elapsedSeconds = 0;
  let distanceFromStartMeters = 0;
  const path = [];
  const segments = [];

  (rawRoute.sections || []).forEach(section => {
    (section.roads || []).forEach(road => {
      const coords = roadVertexes(road.vertexes);
      if (!coords.length) return;
      const start = coords[0];
      const end = coords[coords.length - 1];
      coords.forEach(coord => {
        const last = path[path.length - 1];
        if (!last || last.lat !== coord.lat || last.lng !== coord.lng) path.push(coord);
      });
      const durationSeconds = road.duration || 0;
      segments.push({
        id: `kakao-road-${segments.length}`,
        lat: start.lat,
        lng: start.lng,
        endLat: end.lat,
        endLng: end.lng,
        distanceFromStartMeters,
        durationSeconds,
        etaSeconds: elapsedSeconds,
        heading: bearingDegrees(start, end),
        transportMode: 'car',
        transit: null,
      });
      elapsedSeconds += durationSeconds;
      distanceFromStartMeters += road.distance || 0;
    });
  });

  const summary = rawRoute.summary || {};
  const asLabel = value => (typeof value === 'string' ? value : value?.label || '');
  return {
    provider: 'kakao',
    mode,
    origin: { label: asLabel(origin), ...(typeof origin === 'object' ? origin : {}) },
    destination: { label: asLabel(destination), ...(typeof destination === 'object' ? destination : {}) },
    distanceMeters: summary.distance || distanceFromStartMeters,
    durationSeconds: summary.duration || elapsedSeconds,
    path,
    segments,
  };
}

export async function geocodeKakao(query, restKey) {
  if (typeof query !== 'string') return query; // already { lat, lng }
  const response = await fetch(`${GEOCODE_ENDPOINT}?query=${encodeURIComponent(query)}&size=1`, {
    headers: { Authorization: `KakaoAK ${restKey}` },
  });
  if (!response.ok) throw new Error(`Kakao Local API ${response.status}: ${await response.text()}`);
  const doc = (await response.json()).documents?.[0];
  if (!doc) throw new Error(`장소를 찾지 못했습니다: ${query}`);
  return { lat: Number(doc.y), lng: Number(doc.x), label: doc.place_name || doc.address_name || query };
}

export async function computeKakaoRoute({ restKey, origin, destination, mode }) {
  if (!restKey) throw new Error('Kakao REST API key is not configured.');
  const from = await geocodeKakao(origin, restKey);
  const to = await geocodeKakao(destination, restKey);
  const params = new URLSearchParams({
    origin: `${from.lng},${from.lat}`,
    destination: `${to.lng},${to.lat}`,
    priority: 'RECOMMEND',
  });
  const response = await fetch(`${DIRECTIONS_ENDPOINT}?${params.toString()}`, {
    headers: { Authorization: `KakaoAK ${restKey}` },
  });
  if (!response.ok) throw new Error(`Kakao Directions API ${response.status}: ${await response.text()}`);
  const rawRoute = (await response.json()).routes?.[0];
  if (!rawRoute || rawRoute.result_code !== 0) throw new Error(rawRoute?.result_msg || 'Kakao did not return a route.');
  return normalizeKakaoRoute(rawRoute, { origin: from, destination: to, mode });
}
