const pointIcons = {
  nature: '🌿',
  landmark: '🏙️',
  heritage: '🏛️',
  art: '🎨'
};

const origin = document.querySelector('#origin');
const destination = document.querySelector('#destination');
const mode = document.querySelector('#mode');
const startBtn = document.querySelector('#startBtn');
const pointsEl = document.querySelector('#points');
const resultCount = document.querySelector('#resultCount');
const moment = document.querySelector('#moment');
const momentTitle = document.querySelector('#momentTitle');
const momentText = document.querySelector('#momentText');
const momentMeta = document.querySelector('#momentMeta');

async function loadPoints() {
  const response = await fetch('../data/points.json');
  return response.json();
}

function getTimeContext(date = new Date()) {
  const hour = date.getHours();
  if (hour >= 5 && hour < 8) return 'sunrise';
  if (hour >= 18 && hour < 20) return 'sunset';
  if (hour >= 20 || hour < 5) return 'night';
  return 'day';
}

function scorePoint(point, selectedMode, timeContext) {
  let score = point.visibilityScore || 0;
  if (point.transportModes.includes(selectedMode)) score += 0.25;
  if (point.timing.includes(timeContext)) score += 0.35;
  return score;
}

function renderPoints(points) {
  resultCount.textContent = `${points.length} points`;
  pointsEl.innerHTML = points.map(point => `
    <article class="point">
      <div class="point-icon">${pointIcons[point.category] || '👀'}</div>
      <h3>${point.title}</h3>
      <p>${point.description}</p>
      <span class="tag">${point.tags.join(' · ')}</span>
    </article>
  `).join('');
}

function renderMoment(point, timeContext, selectedMode) {
  if (!point) {
    moment.hidden = true;
    return;
  }

  moment.hidden = false;
  momentTitle.textContent = '잠깐, 창밖을 보세요.';
  const side = point.viewingSide === 'left' ? '왼쪽' : point.viewingSide === 'right' ? '오른쪽' : '정면';
  const timeText = timeContext === 'sunset' ? '지금은 일몰 시간대라' : timeContext === 'night' ? '지금은 야간이라' : '지금 시간대에는';
  momentText.textContent = `${timeText} ${point.title}을(를) 바라보기 좋습니다. 진행 방향 기준 ${side}에서 약 1분간 주변을 살펴보세요.`;
  momentMeta.textContent = `${selectedMode.toUpperCase()} · ${timeContext.toUpperCase()} · VIEW SCORE ${Math.round((point.score || 0) * 100)}`;
}

startBtn.addEventListener('click', async () => {
  startBtn.disabled = true;
  startBtn.textContent = '볼거리를 찾는 중…';

  try {
    const points = await loadPoints();
    const timeContext = getTimeContext();
    const selectedMode = mode.value;
    const ranked = points
      .filter(point => point.transportModes.includes(selectedMode))
      .map(point => ({ ...point, score: scorePoint(point, selectedMode, timeContext) }))
      .sort((a, b) => b.score - a.score);

    renderPoints(ranked);
    renderMoment(ranked[0], timeContext, selectedMode);
  } catch (error) {
    console.error(error);
    pointsEl.innerHTML = '<p>View Point 데이터를 불러오지 못했습니다.</p>';
  } finally {
    startBtn.disabled = false;
    startBtn.textContent = '경로에서 볼거리 찾기';
  }
});

// Prototype starts with a useful first impression.
startBtn.click();
