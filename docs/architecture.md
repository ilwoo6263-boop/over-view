# over-view MVP Architecture

## 1. User flow

`출발지/도착지 입력 → 경로 선택 → 이동 시작 → View Point 후보 계산 → 현재 위치/시간/이동수단/방향으로 랭킹 → 짧은 알림 → 휴대폰 내려놓기`

## 2. Recommendation pipeline

### Inputs
- route geometry
- user location
- transport mode
- heading / route direction
- current local time
- sunrise/sunset
- weather and visibility (future)

### View Point attributes
- latitude / longitude
- title / description
- category
- viewing side: left / right / front
- supported transport modes
- minimum visibility distance
- day/night/sunrise/sunset suitability
- seasonal suitability
- source / confidence

### MVP scoring

```text
score = proximity + route_alignment + visibility + time_fit + transport_fit
```

실제 서비스에서는 지도/교통 데이터와 관측 데이터를 이용해 점수 모델을 발전시킨다.

## 3. Recommended stack

### Prototype
- Vanilla HTML/CSS/JavaScript
- JSON seed data
- Browser Geolocation API

### Production candidate
- Next.js + TypeScript
- PostgreSQL + PostGIS
- Map provider abstraction
- Public transit routing provider abstraction
- Weather / astronomy provider abstraction
- Notification service

## 4. Data model direction

`view_points`는 장소 자체보다 **관찰 가능성**을 중심으로 설계한다. 같은 장소도 도보, 버스, 지하철, 차량에서 보이는 조건이 다르기 때문이다.

향후 `view_windows`, `route_observations`, `user_feedback` 테이블을 추가한다.

## 5. Product guardrails

- 이동 중 긴 텍스트를 읽게 하지 않는다.
- 알림은 관찰 행동을 유도하고 즉시 사라질 수 있어야 한다.
- 확실하지 않은 장소는 과도하게 추천하지 않는다.
- 낮/밤/일출/일몰 조건을 분리한다.
- 위치정보는 최소한으로 사용하고 개인정보 저장을 기본값으로 하지 않는다.
