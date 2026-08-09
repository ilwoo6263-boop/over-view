const GOOGLE_MAPS_CALLBACK = '__overViewGoogleMapsReady';

export function loadGoogleMaps(apiKey) {
  if (!apiKey) {
    return Promise.reject(new Error('Google Maps API key is not configured.'));
  }

  if (window.google?.maps) return Promise.resolve(window.google.maps);

  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-over-view-google-maps]');
    if (existing) {
      existing.addEventListener('error', () => reject(new Error('Google Maps failed to load.')));
      window[GOOGLE_MAPS_CALLBACK] = () => resolve(window.google.maps);
      return;
    }

    window[GOOGLE_MAPS_CALLBACK] = () => resolve(window.google.maps);
    const script = document.createElement('script');
    script.dataset.overViewGoogleMaps = 'true';
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&loading=async&callback=${GOOGLE_MAPS_CALLBACK}&language=ko&region=KR`;
    script.onerror = () => reject(new Error('Google Maps failed to load. Check the API key and allowed referrers.'));
    document.head.appendChild(script);
  });
}

export function createMap(container, center = { lat: 37.5219, lng: 126.9245 }) {
  return new google.maps.Map(container, {
    center,
    zoom: 12,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    clickableIcons: false,
  });
}

export function drawRoute(map, path) {
  if (!path?.length) return null;
  return new google.maps.Polyline({
    path,
    geodesic: true,
    strokeOpacity: 0.9,
    strokeWeight: 6,
    map,
  });
}

export function addViewMarker(map, point, onClick) {
  const marker = new google.maps.Marker({
    map,
    position: { lat: point.lat, lng: point.lng },
    title: point.title,
    label: { text: '👀', fontSize: '18px' },
  });
  marker.addListener('click', () => onClick?.(point));
  return marker;
}
