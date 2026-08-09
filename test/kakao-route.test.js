import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeKakaoRoute } from '../app/kakao-routes.js';
import { rankViewPoints } from '../app/route-engine.js';

test('normalizes kakao roads into provider-neutral segments', () => {
  const raw = {
    summary: { distance: 1200, duration: 300 },
    sections: [{
      roads: [
        { distance: 600, duration: 120, vertexes: [127.0, 37.5, 127.005, 37.503] },
        { distance: 600, duration: 180, vertexes: [127.005, 37.503, 127.01, 37.51] },
      ],
    }],
  };
  const route = normalizeKakaoRoute(raw, { origin: 'A', destination: 'B', mode: 'car' });
  assert.equal(route.provider, 'kakao');
  assert.equal(route.distanceMeters, 1200);
  assert.equal(route.durationSeconds, 300);
  assert.equal(route.segments.length, 2);
  assert.equal(route.segments[0].etaSeconds, 0);
  assert.equal(route.segments[1].etaSeconds, 120); // accumulated from first road
  assert.equal(route.segments[0].transportMode, 'car');
  // consecutive duplicate vertex between roads is de-duplicated
  assert.equal(route.path.length, 3);
});

test('kakao segments feed the ranking engine like google segments do', () => {
  const raw = {
    summary: { distance: 1000, duration: 200 },
    sections: [{ roads: [{ distance: 1000, duration: 200, vertexes: [127.0, 37.5, 127.01, 37.51] }] }],
  };
  const route = normalizeKakaoRoute(raw, { origin: 'A', destination: 'B', mode: 'car' });
  const points = [{ id: 'near', latitude: 37.5002, longitude: 127.0002, viewingSide: 'left', visibilityScore: 1, transportModes: ['car'], timing: ['day'] }];
  const ranked = rankViewPoints(points, route, 'day');
  assert.equal(ranked.length, 1);
  assert.equal(ranked[0].etaSeconds, 0);
});
