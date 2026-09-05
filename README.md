# AtmosAlert

An early prototype for thunderstorm, cloudburst, and flash-flood warnings with
a target lead time of 2–6 hours.

The landing page, interactive map dashboard, API, and basic alert thresholds
work. The frontend includes clearly labelled synthetic scenarios. Live data
ingestion and a trained model are still to be built; live forecast requests
return `503` until a model is implemented.

## Structure

```text
frontend/
  src/           React landing page, forecast map, alerts, and source status
  tests/         Playwright browser checks
backend/
  app.py         FastAPI routes, request validation, and health check
  alerts.py      Probability-to-alert thresholds
model/
  predict.py     Prediction entry point (currently reports unavailable)
data/            Local datasets and model weights (ignored by Git)
tests/           API and alert tests
pyproject.toml   Shared Python dependencies and test/lint settings
uv.lock          Locked Python dependencies
```

The flow is **frontend → backend → model**. The model receives plain Python
values and does not import FastAPI or backend code. The backend validates
requests, calls the model, and handles HTTP responses and alerts.

As the ML work starts, add `model/data.py` for downloading/preparing inputs and
`model/train.py` for training. Keep downloaded datasets and generated weights in
`data/`. Frontend tooling stays inside `frontend/`.
Both Python folders use the same environment; no separate services are needed.

## Run

Requires Python 3.11+ and uv. Run from the project folder:

```bash
uv sync --extra dev
uv run uvicorn backend.app:app --reload
```

Open [API docs](http://127.0.0.1:8000/docs) or
[health](http://127.0.0.1:8000/v1/health).

In a second terminal, start the frontend with Node.js 22.12+ (Node.js 24 is
used in CI):

```bash
cd frontend
npm ci
npm run dev
```

Open the [landing page](http://127.0.0.1:5173/) or
[forecast dashboard](http://127.0.0.1:5173/#/dashboard). Vite proxies `/v1`
to the backend. Demo mode also works without the backend. Map imagery uses
Esri services and requires an internet connection.

The environment defaults to `development`. Set `ATMOSALERT_ENVIRONMENT` in your
shell to override it; the app does not load `.env` files automatically.

## Check

```bash
uv run ruff check .
uv run pytest
```

Frontend checks, from `frontend/`:

```bash
npm run build
npx playwright install chromium
npm test
```

## Next

1. Load a real INSAT sequence for one region into `data/`.
2. Build and evaluate a baseline forecast using historical events.
3. Implement inference in `model/predict.py`, connect its returned grid to the
   frontend map, and test alert delivery. The backend already calls this
   prediction entry point.

IMDAA supplies historical training data. Current atmospheric inputs need a
verified timely source. Keep credentials and downloaded data out of Git.
The prototype thresholds are unvalidated and are not operational warning rules.
