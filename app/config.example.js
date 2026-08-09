// Copy this file to app/config.js and add your restricted API keys.
// Never commit app/config.js (it is gitignored).
window.OVER_VIEW_CONFIG = {
  // 'google' 또는 'kakao'. 생략하면 kakaoJsKey가 있을 때 kakao, 없으면 google.
  provider: 'google',

  // Google Maps Platform — Maps JavaScript API + Routes API (하나의 키).
  googleMapsApiKey: 'YOUR_GOOGLE_MAPS_API_KEY',

  // Kakao — 지도 렌더링은 JavaScript 키, 길찾기/장소검색은 REST 키를 씁니다.
  kakaoJsKey: 'YOUR_KAKAO_JAVASCRIPT_KEY',
  kakaoRestKey: 'YOUR_KAKAO_REST_API_KEY'
};
