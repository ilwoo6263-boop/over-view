import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeGoogleRoute } from '../app/google-routes.js';
import { rankViewPoints } from '../app/route-engine.js';
test('normalizes transit details into provider-neutral segments', () => {
  const route = normalizeGoogleRoute({ distanceMeters: 800, duration: '240s', polyline: { encodedPolyline: 'abc' }, legs: [{ steps: [{ startLocation: { latLng: { latitude: 37.5, longitude: 127 } }, endLocation: { latLng: { latitude: 37.51, longitude: 127.01 } }, distanceMeters: 800, staticDuration: '240s', travelMode: 'TRANSIT', transitDetails: { headsign: 'City Hall', transitLine: { name: '740', vehicle: { type: 'BUS' } }, stopDetails: { departureStop: { name: 'A' }, arrivalStop: { name: 'B' } } } }] }] }, { origin: 'Origin', destination: 'Destination', mode: 'bus' });
  assert.equal(route.polyline, 'abc'); assert.equal(route.segments[0].transit.routeNumber, '740'); assert.equal(route.segments[0].transit.departureStop, 'A');
});
test('ranks latitude/longitude points against actual route segments', () => {
  const points = [{ id: 'nearby', latitude: 37.5002, longitude: 127.0002, viewingSide: 'left', visibilityScore: 1, transportModes: ['bus'], timing: ['day'] }];
  const route = { mode: 'bus', segments: [{ lat: 37.5, lng: 127, endLat: 37.51, endLng: 127.01, etaSeconds: 42, transportMode: 'transit' }] };
  const ranked = rankViewPoints(points, route, 'day'); assert.equal(ranked.length, 1); assert.equal(ranked[0].etaSeconds, 42);
});
