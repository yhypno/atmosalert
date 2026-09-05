# Frontend

React + TypeScript + Vite, with MapLibre maps and locally bundled fonts. Keep
the app in a few files; there is no separate state or routing framework.

## Run

Requires Node.js 22.12+; Node.js 24 is used in CI.

```bash
npm ci
npm run dev
```

Open http://127.0.0.1:5173. Run the FastAPI backend on port 8000 for service
status and live forecast requests. Vite proxies `/v1` to that port.

## Screens

- `/`: landing page with an interactive hazard and lead-time preview.
- `/#/dashboard`: region and location selection, three hazard layers, 2/4/6-hour
  lead times, satellite/terrain basemaps, location details, and JSON export.
- `/#/alerts`: filterable sample alerts, CSV export, and browser-local
  acknowledgements. Acknowledgements do not notify anyone.
- `/#/sources`: actual backend health and the planned data-source connections.

Demo mode uses synthetic data from `src/data.ts` for Uttarakhand and Himachal
Pradesh. The scenario is illustrative, not a reconstruction of weather on its
displayed date. The polygons, probabilities, and explanatory signals are not
model outputs. Esri basemaps show geography, not current weather.

Live mode calls `/v1/nowcasts` and hides synthetic predictions. A `503` displays
an unavailable state. Rendering actual model grids remains to be implemented
when the model is available. Source readiness is not inferred from map tiles.

## Files

- `src/App.tsx`: navigation and hash routes.
- `src/Landing.tsx`: landing page.
- `src/Dashboard.tsx`: forecast, alerts, and source-status screens.
- `src/WeatherMap.tsx`: maps, illustrative overlays, and location markers.
- `src/data.ts`: typed demo scenarios and downloads.
- `src/api.ts`: backend requests and unavailable states.
- `src/styles.css`: shared visual system and responsive layouts.

## Check and build

```bash
npm run build
npx playwright install chromium
npm test
npm run preview
```

The browser tests cover navigation, connected forecast controls, API failures,
alert filtering/export, persistence, and mobile layouts. They stub backend
responses.

The production files are emitted to `dist/`. A deployment must serve them and
forward `/v1` to FastAPI on the same origin. The Vite proxy is only for local
development/preview. Preserve the visible Esri attribution when changing maps.
