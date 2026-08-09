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

## 5. Transit normalization

Google Routes API can calculate walking, driving, bicycling, two-wheel, and transit routes. `bus` and `subway` both request Google's `TRANSIT` mode; the selected mode is a preference, not a vehicle guarantee.

The adapter requests step locations, travel modes, durations, and `routes.legs.steps.transitDetails`. It normalizes returned steps into a provider-neutral route model with vehicle type, line, headsign, stops, ETA, and heading. Ranking uses those step segments instead of treating the full route as one transport mode.
