// Provider registry — the vendor-neutral seam described in docs/route-mvp.md.
// Each provider exposes the same interface so app.js never depends on a specific
// map vendor:
//   isConfigured() · loadMaps() · createMap(el) · computeRoute(opts)
//   routePath(route) · drawRoute(map, path) · addViewMarker(map, point) · fitRoute(map, path)

import { computeGoogleRoute } from './google-routes.js';
import { loadGoogleMaps, createMap as createGoogleMap, drawRoute as drawGoogleRoute, addViewMarker as addGoogleMarker } from './google-maps.js';
import { computeKakaoRoute } from './kakao-routes.js';
import { loadKakaoMaps, createMap as createKakaoMap, drawRoute as drawKakaoRoute, addViewMarker as addKakaoMarker, fitRoute as fitKakaoRoute } from './kakao-maps.js';

// Google Routes returns an encoded polyline; decode it into {lat,lng} points.
export function decodePolyline(encoded = '') {
  let index = 0; let lat = 0; let lng = 0; const path = [];
  while (index < encoded.length) {
    let result = 0; let shift = 0; let byte;
    do { byte = encoded.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
    lat += (result & 1) ? ~(result >> 1) : result >> 1; result = 0; shift = 0;
    do { byte = encoded.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
    lng += (result & 1) ? ~(result >> 1) : result >> 1; path.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return path;
}

function googleProvider(config) {
  return {
    name: 'google',
    label: 'Google Maps',
    isConfigured: () => Boolean(config.googleMapsApiKey),
    loadMaps: () => loadGoogleMaps(config.googleMapsApiKey),
    createMap: element => createGoogleMap(element),
    computeRoute: options => computeGoogleRoute({ apiKey: config.googleMapsApiKey, ...options }),
    routePath: route => (route.path?.length ? route.path : decodePolyline(route.polyline)),
    drawRoute: drawGoogleRoute,
    addViewMarker: addGoogleMarker,
    fitRoute: (map, path) => {
      if (!path?.length) return;
      const bounds = new google.maps.LatLngBounds();
      path.forEach(point => bounds.extend(point));
      map.fitBounds(bounds, 60);
    },
  };
}

function kakaoProvider(config) {
  return {
    name: 'kakao',
    label: '카카오맵',
    isConfigured: () => Boolean(config.kakaoJsKey && config.kakaoRestKey),
    loadMaps: () => loadKakaoMaps(config.kakaoJsKey),
    createMap: element => createKakaoMap(element),
    computeRoute: options => computeKakaoRoute({ restKey: config.kakaoRestKey, ...options }),
    routePath: route => route.path || [],
    drawRoute: drawKakaoRoute,
    addViewMarker: addKakaoMarker,
    fitRoute: fitKakaoRoute,
  };
}

export function getProvider(config = {}) {
  const name = config.provider || (config.kakaoJsKey ? 'kakao' : 'google');
  return name === 'kakao' ? kakaoProvider(config) : googleProvider(config);
}
