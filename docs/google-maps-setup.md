# Google Maps setup

3차 MVP uses Google Maps JavaScript API for the map and Google Maps Platform Routes API for real route calculation.

## 1. Google Cloud

Create/select a Google Cloud project, enable the required Maps Platform APIs, create an API key, and enable billing for production use.

Required services for this MVP:

- Maps JavaScript API
- Routes API

Google provides a no-cost Maps Demo Key for limited prototyping, but production use requires a properly configured project and billing.

## 2. Restrict the browser key

Because the Maps JavaScript key is used by the browser, restrict it by HTTP referrers (websites). Do not commit an unrestricted key.

## 3. Local configuration

Copy `app/config.example.js` to `app/config.js` and replace the placeholder:

```js
window.OVER_VIEW_CONFIG = {
  googleMapsApiKey: 'YOUR_RESTRICTED_KEY'
};
```

`app/config.js` is ignored by Git.

## 4. Current architecture

```text
Browser UI
  ↓
Google Maps JavaScript API
  ↓
Google Routes API adapter
  ↓
Normalized route
  ↓
View Intelligence ranking
  ↓
View Point markers + Look Outside moment
```

The route provider is isolated in `app/google-routes.js`, so the recommendation engine can remain independent from the map provider.

## 5. Important limitation

Google Routes API can calculate walking, driving, bicycling, two-wheel, and transit routes. For this MVP, `bus` and `subway` both map to Google's `TRANSIT` mode. The next iteration should inspect the returned transit details so that actual bus/train legs, stop sequence, vehicle type, and direction can influence View Point visibility.
