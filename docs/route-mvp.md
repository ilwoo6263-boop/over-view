# Route MVP — Step 2

## Goal

Turn the foundation prototype into a real route-aware web MVP without committing to a specific map vendor yet.

## User flow

1. Enter origin and destination.
2. Select a mode: walk, bus, subway, car.
3. Build a route from route points.
4. Match route segments against View Points.
5. Rank each View Point using distance, viewing direction, transport mode, time of day, and sunrise/sunset context.
6. Show only the best upcoming moment so the user can put the phone down.

## Architecture boundary

```text
UI
  ↓
Route Adapter
  ↓
Route segments
  ↓
View Intelligence Engine
  ↓
Ranked View Points
  ↓
Moment Card
```

The route adapter is intentionally vendor-neutral. A later implementation can connect Google Maps, Mapbox, Kakao, Naver, or another routing provider without rewriting the recommendation engine.

## Route segment model

```js
{
  id,
  lat,
  lng,
  heading,
  transportMode,
  etaMinutes
}
```

## Recommendation score

The first heuristic score combines:

- route proximity
- transport compatibility
- viewing direction
- time-of-day relevance
- sunset/night relevance
- base point importance

This is a deterministic MVP heuristic. It will later become a learned ranking model using user feedback.

## Important UX rule

The product should not continuously push notifications. It should surface a concise cue only when the user is approaching a high-confidence View Point.
