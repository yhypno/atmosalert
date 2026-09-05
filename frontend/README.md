# Frontend

Place the web dashboard code in `src/`. No UI framework or build tools are
installed yet.

The first screen should show the three hazard map layers, a forecast timeline,
an explanation panel, and an alert list. Keep the initial UI and API calls in
a few files; split components out as the screen grows.

The dashboard will call the backend's `/v1/health` and `/v1/nowcasts` endpoints.
A `503` forecast response means the model is unavailable and must be shown as
such. During development, proxy `/v1` requests to `http://127.0.0.1:8000`.
