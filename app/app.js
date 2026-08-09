import { buildPrototypeRoute, rankViewPoints } from './route-engine.js';

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

function renderPoints(points) {
  resultCount.textContent = `${points.length} discoveries`;
  pointsEl.innerHTML = points.map((point, index) => `
    <article class="point ${index === 0 ? 'point-featured' : ''}">
      <div class="point-top"><div class="point-icon">${pointIcons[point.category] || '👀'}</div><span>${point.etaMinutes ?? '—'}분 후</span></div>
      <h3>${point.title}</h3>
      <p>${point.description}</p>
      <div class="point-footer"><span class="tag">${point.tags.join(' · ')}</span><span>${point.viewingSide === 'left' ? '← 왼쪽' : point.viewingSide === 'right' ? '오른쪽 →' : '↑ 정면'}</span></div>
    </article>
  `).join('');
}

function renderMoment(point, timeContext, selectedMode) {
  if (!point) { moment.hidden = true; return; }
  moment.hidden = false;
  momentTitle.textContent = '잠깐, 창밖을 보세요.';
  const side = point.viewingSide === 'left' ? '왼쪽' : point.viewingSide === 'right' ? '오른쪽' : '정면';
  const timeText = timeContext === 'sunset' ? '일몰이 가까워' : timeContext === 'night' ? '야경이 살아나는 시간이라' : timeContext === 'sunrise' ? '아침 빛이 좋아' : '지금 시간대에';
  momentText.textContent = `${point.etaMinutes ?? 1}분 후 ${point.title}이 보입니다. 진행 방향 기준 ${side}을 바라보세요. ${timeText} 특히 보기 좋습니다.`;
  momentMeta.textContent = `${selectedMode.toUpperCase()} · ${timeContext.toUpperCase()} · ${point.routeDistanceMeters}m from route`;
}

async function runRoute() {
  startBtn.disabled = true;
  startBtn.textContent = '경로를 살펴보는 중…';
  try {
    const points = await loadPoints();
    const selectedMode = mode.value;
    const timeContext = getTimeContext();
    const route = buildPrototypeRoute({ origin: origin.value, destination: destination.value, mode: selectedMode });
    const ranked = rankViewPoints(points, route, timeContext);
    routeSummary.textContent = `${route.origin.label} → ${route.destination.label} · 약 ${(route.distanceMeters / 1000).toFixed(1)}km · ${Math.ceil(route.durationSeconds / 60)}분`;
    renderPoints(ranked);
    renderMoment(ranked[0], timeContext, selectedMode);
  } catch (error) {
    console.error(error);
    routeSummary.textContent = '경로를 계산하지 못했습니다.';
    pointsEl.innerHTML = '<p>View Point 데이터를 불러오지 못했습니다.</p>';
  } finally {
    startBtn.disabled = false;
    startBtn.textContent = '경로에서 볼거리 찾기';
  }
}

startBtn.addEventListener('click', runRoute);
runRoute();
