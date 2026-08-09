# over-view

> **Move less like a screen. See more of the world.**
>
> 목적지까지 데려다주는 길찾기를 넘어, 이동하는 순간에 놓치기 쉬운 풍경·문화유산·랜드마크를 발견하게 만드는 이동 경험 앱.

## Product Vision

사용자가 출발지와 도착지를 입력하면 over-view는 이동 경로를 따라 **지금 실제로 볼 수 있는 장소**를 찾아낸다. 이동수단, 진행 방향, 현재 위치, 시간대, 일출·일몰, 날씨와 시야 조건을 고려해 가장 적절한 순간에 "창밖을 보세요"라는 짧은 안내를 제공한다.

핵심 목표는 사용자가 이동 중 휴대폰 화면을 더 오래 보는 것이 아니라 **휴대폰을 내려놓고 바깥을 한 번 더 바라보게 하는 것**이다.

## MVP Scope

1. 출발지/도착지 입력
2. 이동 경로 표현
3. 경로 주변 View Point 탐색
4. 이동수단·진행방향 기반 필터링
5. 시간대 및 일출/일몰 기반 추천
6. "지금/곧 볼거리" 카드
7. 서울·한강 중심 샘플 데이터로 프로토타입 검증

## Repository Structure

```text
app/
  index.html       # MVP prototype UI
  styles.css       # visual system
  app.js           # prototype interaction + recommendation logic
data/
  points.json      # View Point seed schema/data
docs/
  architecture.md  # product and technical architecture
```

## Core Concept: View Intelligence

각 장소는 단순한 POI가 아니라 **어떤 이동 상황에서 실제로 볼 수 있는가**를 설명하는 데이터로 관리한다.

- location: 위도/경도
- category: 문화유산, 랜드마크, 자연, 공공미술 등
- visibility: 도보/버스/지하철/차량/기차 등
- direction: 진행 방향 기준 좌/우/정면
- timing: 주간/야간/일출/일몰
- season/weather: 계절 및 날씨 영향
- route relevance: 현재 경로와의 거리/접근성

## Development Principle

**알림은 짧게, 이유는 명확하게, 화면은 오래 보지 않게.**

향후 지도/교통/POI API와 연결하더라도 사용자가 이동 중 화면에 매달리지 않도록 UX를 설계한다.
