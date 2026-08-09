// Kakao Maps renderer — mirrors the function surface of google-maps.js
// (loadMaps / createMap / drawRoute / addViewMarker / fitRoute) so app.js can
// treat Google and Kakao interchangeably through providers.js.

const SDK_ID = 'over-view-kakao-sdk';

export function loadKakaoMaps(jsKey) {
  if (!jsKey) return Promise.reject(new Error('Kakao JavaScript key is not configured.'));
  if (window.kakao?.maps?.Map) return Promise.resolve(window.kakao.maps);

  return new Promise((resolve, reject) => {
    const ready = () => window.kakao.maps.load(() => resolve(window.kakao.maps));
    const existing = document.getElementById(SDK_ID);
    if (existing) {
      existing.addEventListener('load', ready);
      existing.addEventListener('error', () => reject(new Error('Kakao Maps failed to load.')));
      if (window.kakao?.maps) ready();
      return;
    }
    const script = document.createElement('script');
    script.id = SDK_ID;
    script.async = true;
    // autoload=false lets us call kakao.maps.load() after the SDK is fetched.
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(jsKey)}&autoload=false&libraries=services`;
    script.onload = ready;
    script.onerror = () => reject(new Error('Kakao Maps failed to load. Check the JavaScript key and registered platform domain.'));
    document.head.appendChild(script);
  });
}

export function createMap(container, center = { lat: 37.5219, lng: 126.9245 }) {
  return new kakao.maps.Map(container, {
    center: new kakao.maps.LatLng(center.lat, center.lng),
    level: 7,
  });
}

export function drawRoute(map, path) {
  if (!path?.length) return null;
  const line = new kakao.maps.Polyline({
    path: path.map(point => new kakao.maps.LatLng(point.lat, point.lng)),
    strokeWeight: 6,
    strokeColor: '#2b6cff',
    strokeOpacity: 0.9,
    strokeStyle: 'solid',
  });
  line.setMap(map);
  return line;
}

export function addViewMarker(map, point, onClick) {
  const marker = new kakao.maps.Marker({
    map,
    position: new kakao.maps.LatLng(point.lat, point.lng),
    title: point.title,
  });
  if (onClick) kakao.maps.event.addListener(marker, 'click', () => onClick(point));
  return marker;
}

export function fitRoute(map, path) {
  if (!path?.length) return;
  const bounds = new kakao.maps.LatLngBounds();
  path.forEach(point => bounds.extend(new kakao.maps.LatLng(point.lat, point.lng)));
  map.setBounds(bounds);
}
