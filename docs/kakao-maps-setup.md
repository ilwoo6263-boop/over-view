# Kakao Maps setup

Kakao provider는 서울·한강 중심 시나리오에서 국내 지도/길찾기를 위해 추가되었습니다. Google 대비 국내 도로·장소 데이터가 정확한 편입니다.

## 1. Kakao Developers 앱 만들기

1. https://developers.kakao.com 에서 앱을 생성합니다.
2. **JavaScript 키**와 **REST API 키**를 발급받습니다.
   - JavaScript 키 → 지도 렌더링 (Kakao Maps SDK, 브라우저)
   - REST API 키 → 장소검색(Local) + 길찾기(Mobility Directions)
3. **플랫폼 → Web**에 서비스 도메인을 등록합니다. (예: `http://localhost:8000`)
   등록하지 않으면 지도 SDK가 로드되지 않습니다.

## 2. 로컬 설정

`app/config.example.js`를 `app/config.js`로 복사하고 값을 채웁니다:

```js
window.OVER_VIEW_CONFIG = {
  provider: 'kakao',
  kakaoJsKey: 'YOUR_KAKAO_JAVASCRIPT_KEY',
  kakaoRestKey: 'YOUR_KAKAO_REST_API_KEY'
};
```

`app/config.js`는 Git에서 무시됩니다.

## 3. 아키텍처 (provider-neutral)

```text
Browser UI
  ↓
providers.js  (google | kakao 선택)
  ↓
Kakao Local API (지오코딩)  →  Kakao Mobility Directions (경로)
  ↓
normalizeKakaoRoute → 표준 route 모델 (segments · heading · path)
  ↓
route-engine.js  (View Intelligence ranking, provider 무관)
  ↓
Kakao Maps 마커 + Look Outside moment
```

경로 provider는 `app/kakao-routes.js`, 지도 렌더러는 `app/kakao-maps.js`에 격리되어 있어 추천 엔진은 어떤 지도 벤더에도 의존하지 않습니다. Google 어댑터와 동일한 함수 인터페이스를 가지며, `config.provider`로 전환합니다.

## 4. 현재 범위와 한계

- **길찾기는 자동차 경로**(Kakao Mobility Directions)를 사용합니다. Kakao는 무료 브라우저용 대중교통 경로 API를 제공하지 않으므로, `walk`/`bus`/`subway`는 당분간 자동차 경로로 근사합니다. 선택한 mode는 랭킹에는 그대로 반영됩니다.
- **CORS**: Kakao REST 엔드포인트(Local·Directions)는 브라우저에서 직접 호출 시 도메인/CORS 제약이 있을 수 있습니다. 로컬/배포 환경에 따라 간단한 프록시가 필요할 수 있습니다. 정규화 로직(`normalizeKakaoRoute`)과 지오코딩 함수는 네트워크와 분리되어 있어 `npm test`로 단독 검증됩니다.

## 5. 테스트

```bash
npm test
```

`test/kakao-route.test.js`가 Kakao road → 표준 segment 정규화와 랭킹 엔진 연동을 검증합니다.
