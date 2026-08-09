import { rankViewPoints } from './route-engine.js';
import { computeGoogleRoute } from './google-routes.js';
import { addViewMarker, createMap, drawRoute, loadGoogleMaps } from './google-maps.js';

const pointIcons = { nature: '🌿', landmark: '🏛️', heritage: '🏺', art: '🎨' };
const origin = document.querySelector('#origin');
const destination = document.querySelector('#destination');
const selectedMode = () => document.querySelector('input[name="mode"]:checked')?.value || 'bus';
const startBtn = document.querySelector('#startBtn');
const pointsEl = document.querySelector('#points');
const resultCount = document.querySelector('#resultCount');
const routeSummary = document.querySelector('#routeSummary');
const moment = document.querySelector('#moment');
const momentTitle = document.querySelector('#momentTitle');
const momentText = document.querySelector('#momentText');
const momentMeta = document.querySelector('#momentMeta');
const mapEl = document.querySelector('#map');
const mapStatus = document.querySelector('#mapStatus');
const routeResult = document.querySelector('#routeResult');
const onboarding = document.querySelector('#onboarding');
let map;
let routeLine;
let markers = [];

async function loadPoints() {
  const paths = ['data/points.json', '../data/points.json'];
  for (const path of paths) {
    try {
      const response = await fetch(path);
      if (response.ok) return response.json();
    } catch (_) {
      // Try the next path for local app/ or deployed root hosting.
    }
  }
  throw new Error('View Point data unavailable');
}

function getTimeContext(date = new Date()) {
  const hour = date.getHours();
  if (hour >= 5 && hour < 8) return 'sunrise';
  if (hour >= 18 && hour < 20) return 'sunset';
  return hour >= 20 || hour < 5 ? 'night' : 'day';
}

function decodePolyline(encoded = '') {
  let index = 0;
  let lat = 0;
  let lng = 0;
  const path = [];
  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte;
    do { byte = encoded.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
    lat += (result & 1) ? ~(result >> 1) : result >> 1;
    result = 0;
    shift = 0;
    do { byte = encoded.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
    lng += (result & 1) ? ~(result >> 1) : result >> 1;
    path.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return path;
}

function etaLabel(seconds) {
  if (!Number.isFinite(seconds)) return '곧';
  return seconds < 60 ? '1분 이내' : `${Math.ceil(seconds / 60)}분 후`;
}

function renderPoints(points) {
  resultCount.textContent = `${points.length} discoveries`;
  pointsEl.innerHTML = points.map((point, index) => `<article class="point ${index === 0 ? 'point-featured' : ''}"><div class="point-top"><div class="point-icon">${pointIcons[point.category] || '👀'}</div><span>${etaLabel(point.etaSeconds)}</span></div><h3>${point.title}</h3><p>${point.description}</p><div class="point-footer"><span class="tag">${point.tags.join(' · ')}</span><span>${point.viewingSide === 'left' ? '← 왼쪽' : point.viewingSide === 'right' ? '오른쪽 →' : '↑ 정면'}</span></div></article>`).join('');
}

function renderMoment(point, timeContext, selectedModeValue) {
  if (!point) { moment.hidden = true; return; }
  moment.hidden = false;
  momentTitle.textContent = '잠깐, 창밖을 보세요.';
  const side = point.viewingSide === 'left' ? '왼쪽' : point.viewingSide === 'right' ? '오른쪽' : '정면';
  const timeText = timeContext === 'sunset' ? '일몰이 가까워' : timeContext === 'night' ? '야경이 살아나는 시간이라' : timeContext === 'sunrise' ? '아침 빛이 좋아' : '지금 시간대에';
  momentText.textContent = `${etaLabel(point.etaSeconds)} ${point.title}이 보입니다. 진행 방향 기준 ${side}을 바라보세요. ${timeText} 특히 보기 좋습니다.`;
  const transit = point.transit?.routeNumber ? ` · ${point.transit.routeNumber}${point.transit.headsign ? ` → ${point.transit.headsign}` : ''}` : '';
  momentMeta.textContent = `${selectedModeValue.toUpperCase()} · ${timeContext.toUpperCase()} · ROUTE ${point.routeDistanceMeters ?? '—'}m${transit}`;
}

function buildDemoRoute(points, mode) {
  const path = points.map(point => ({ lat: point.latitude, lng: point.longitude }));
  const segmentCount = Math.max(1, path.length - 1);
  const segments = path.map((position, index) => ({
    ...position,
    endLat: path[Math.min(index + 1, path.length - 1)]?.lat ?? position.lat,
    endLng: path[Math.min(index + 1, path.length - 1)]?.lng ?? position.lng,
    transportMode: mode,
    etaSeconds: index * 240,
    heading: 0,
    transit: mode === 'bus' ? { routeNumber: 'DEMO', headsign: destination.value || '목적지' } : null,
  }));
  return {
    mode,
    distanceMeters: Math.max(900, segmentCount * 650),
    durationSeconds: Math.max(600, segmentCount * 240),
    polyline: '',
    segments,
    demo: true,
    path,
  };
}

async function initMap() {
  const apiKey = window.OVER_VIEW_CONFIG?.googleMapsApiKey;
  if (!apiKey) {
    mapStatus.textContent = '웹 미리보기 모드';
    return;
  }
  try {
    await loadGoogleMaps(apiKey);
    map = createMap(mapEl);
    mapStatus.textContent = 'Google Maps 연결됨';
  } catch (error) {
    mapStatus.textContent = 'Google Maps를 불러오지 못했습니다.';
    console.warn(error.message);
  }
}

async function runRoute() {
  startBtn.disabled = true;
  startBtn.textContent = '경로를 준비하는 중…';
  try {
    const points = await loadPoints();
    const transport = selectedMode();
    const timeContext = getTimeContext();
    const apiKey = window.OVER_VIEW_CONFIG?.googleMapsApiKey;
    const route = apiKey
      ? await computeGoogleRoute({ apiKey, origin: origin.value, destination: destination.value, mode: transport, departureTime: new Date() })
      : buildDemoRoute(points, transport);
    const path = route.demo ? route.path : decodePolyline(route.polyline);
    const ranked = rankViewPoints(points, route, timeContext);
    routeSummary.textContent = `${origin.value} → ${destination.value} · 약 ${(route.distanceMeters / 1000).toFixed(1)}km · ${Math.ceil(route.durationSeconds / 60)}분 · ${route.demo ? 'Preview' : 'Google Maps'}`;
    routeResult.hidden = false;
    renderPoints(ranked);
    renderMoment(ranked[0], timeContext, transport);
    if (map) {
      markers.forEach(marker => marker.setMap(null));
      markers = [];
      routeLine?.setMap(null);
      routeLine = drawRoute(map, path);
      ranked.slice(0, 8).forEach(point => markers.push(addViewMarker(map, point)));
      if (path.length) {
        const bounds = new google.maps.LatLngBounds();
        path.forEach(position => bounds.extend(position));
        map.fitBounds(bounds, 60);
      }
    } else {
      mapEl.innerHTML = '<div class="map-placeholder demo-map"><strong>over-view Preview</strong><br />Google Maps API 키 없이도 핵심 UX를 먼저 체험할 수 있습니다.<br /><span>실제 지도는 API 키 설정 후 표시됩니다.</span></div>';
    }
  } catch (error) {
    console.error(error);
    routeSummary.textContent = `경로를 계산하지 못했습니다. ${error.message}`;
    pointsEl.innerHTML = '<p>View Point를 불러오지 못했습니다.</p>';
    moment.hidden = true;
  } finally {
    startBtn.disabled = false;
    startBtn.textContent = '경로에서 볼거리 찾기';
  }
}

document.querySelector('#startExperience').addEventListener('click', () => onboarding.classList.add('is-hidden'));
document.querySelector('#themeToggle').addEventListener('click', () => document.body.classList.toggle('dark'));
initMap();
startBtn.addEventListener('click', runRoute);
