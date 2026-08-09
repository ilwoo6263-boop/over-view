import { rankViewPoints } from './route-engine.js';
import { computeGoogleRoute } from './google-routes.js';
import { addViewMarker, createMap, drawRoute, loadGoogleMaps } from './google-maps.js';

const pointIcons = { nature: '🌿', landmark: '🏙️', heritage: '🏛️', art: '🎨' };
const origin = document.querySelector('#origin');
const destination = document.querySelector('#destination');
const mode = document.querySelector('#mode');
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

let map;
let routeLine;
let markers = [];

async function loadPoints() {
  const response = await fetch('../data/points.json');
  if (!response.ok) throw new Error('View Point data unavailable');
  return response.json();
}

function getTimeContext(date = new Date()) {
  const hour = date.getHours();
  if (hour >= 5 && hour < 8) return 'sunrise';
  if (hour >= 18 && hour < 20) return 'sunset';
  if (hour >= 20 || hour < 5) return 'night';
  return 'day';
}

function decodePolyline(encoded) {
  let index = 0, lat = 0, lng = 0;
  const path = [];
  while (index < encoded.length) {
    let result = 0, shift = 0, byte;
    do { byte = encoded.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
    lat += (result & 1) ? ~(result >> 1) : result >> 1;
    result = 0; shift = 0;
    do { byte = encoded.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
    lng += (result & 1) ? ~(result >> 1) : result >> 1;
    path.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return path;
}

function renderPoints(points) {
  resultCount.textContent = `${points.length} discoveries`;
  pointsEl.innerHTML = points.map((point, index) => `
    <article class="point ${index === 0 ? 'point-featured' : ''}" data-point-id="${point.id}">
      <div class="point-top"><div class="point-icon">${pointIcons[point.category] || '👀'}</div><span>${point.etaMinutes ?? '—'}분 후</span></div>
      <h3>${point.title}</h3><p>${point.description}</p>
      <div class="point-footer"><span class="tag">${point.tags.join(' · ')}</span><span>${point.viewingSide === 'left' ? '← 왼쪽' : point.viewingSide === 'right' ? '오른쪽 →' : '↑ 정면'}</span></div>
    </article>`).join('');
}

function renderMoment(point, timeContext, selectedMode) {
  if (!point) { moment.hidden = true; return; }
  moment.hidden = false;
  momentTitle.textContent = '잠깐, 창밖을 보세요.';
  const side = point.viewingSide === 'left' ? '왼쪽' : point.viewingSide === 'right' ? '오른쪽' : '정면';
  const timeText = timeContext === 'sunset' ? '일몰이 가까워' : timeContext === 'night' ? '야경이 살아나는 시간이라' : timeContext === 'sunrise' ? '아침 빛이 좋아' : '지금 시간대에';
  momentText.textContent = `${point.etaMinutes ?? 1}분 후 ${point.title}이 보입니다. 진행 방향 기준 ${side}을 바라보세요. ${timeText} 특히 보기 좋습니다.`;
  momentMeta.textContent = `${selectedMode.toUpperCase()} · ${timeContext.toUpperCase()} · ROUTE ${point.routeDistanceMeters ?? '—'}m`;
}

async function initMap() {
  const key = window.OVER_VIEW_CONFIG?.googleMapsApiKey;
  try {
    await loadGoogleMaps(key);
    map = createMap(mapEl);
    mapStatus.textContent = 'Google Maps 연결됨';
  } catch (error) {
    mapStatus.textContent = 'Google Maps API 키를 설정하면 실제 지도를 사용할 수 있습니다.';
    console.warn(error.message);
  }
}

async function runRoute() {
  startBtn.disabled = true;
  startBtn.textContent = '실제 경로를 계산하는 중…';
  try {
    const points = await loadPoints();
    const selectedMode = mode.value;
    const timeContext = getTimeContext();
    const apiKey = window.OVER_VIEW_CONFIG?.googleMapsApiKey;
    if (!apiKey) throw new Error('Google Maps API key is not configured.');

    const route = await computeGoogleRoute({ apiKey, origin: origin.value, destination: destination.value, mode: selectedMode, departureTime: new Date() });
    const ranked = rankViewPoints(points, route, timeContext);
    routeSummary.textContent = `${origin.value} → ${destination.value} · 약 ${(route.distanceMeters / 1000).toFixed(1)}km · ${Math.ceil(route.durationSeconds / 60)}분 · Google Maps`;
    renderPoints(ranked);
    renderMoment(ranked[0], timeContext, selectedMode);

    if (map) {
      markers.forEach(marker => marker.setMap(null));
      markers = [];
      routeLine?.setMap(null);
      const path = decodePolyline(route.encodedPolyline);
      routeLine = drawRoute(map, path);
      ranked.slice(0, 8).forEach(point => {
        if (Number.isFinite(point.lat) && Number.isFinite(point.lng)) {
          markers.push(addViewMarker(map, point));
        }
      });
      if (path.length) {
        const bounds = new google.maps.LatLngBounds();
        path.forEach(position => bounds.extend(position));
        map.fitBounds(bounds, 60);
      }
    }
  } catch (error) {
    console.error(error);
    routeSummary.textContent = error.message.includes('API key') ? 'Google Maps API 키를 먼저 설정해주세요.' : `경로를 계산하지 못했습니다: ${error.message}`;
    pointsEl.innerHTML = '<p>Google Maps 경로를 불러오지 못했습니다.</p>';
    moment.hidden = true;
  } finally {
    startBtn.disabled = false;
    startBtn.textContent = '실제 경로에서 볼거리 찾기';
  }
}

initMap();
startBtn.addEventListener('click', runRoute);
