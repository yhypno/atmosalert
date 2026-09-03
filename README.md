# AtmosAlert

AI-driven hyper-local early warning for severe thunderstorms, cloudbursts, and
flash floods across India.

> **Project status:** early scaffold. The API and project boundaries are in
> place, but live data connectors and a trained forecasting model are not yet
> included. Do not use this repository for operational weather decisions.

## Goal

AtmosAlert is intended to fuse satellite, reanalysis, and terrain data into a
shared spatiotemporal model that produces event-specific risk maps with a 2–6
hour lead time. The system focuses on precursors spanning:

- moisture: Integrated Water Vapor (IWV) and its rate of change;
- instability: CAPE and CIN;
- lift and storm structure: convergence and vertical wind shear;
- observation: Cloud Top Temperature (CTT) drop rate and precipitation;
- terrain: elevation, slope, and drainage characteristics.

## Proposed flow

```text
IMDAA + INSAT-3D/3DR + DEM
             │
             ▼
      ingest and validate
             │
             ▼
 align to a common space-time grid
             │
             ▼
 derive IWV / CTT / instability / terrain features
             │
             ▼
 shared spatiotemporal backbone
       ┌─────┼─────────┐
       ▼     ▼         ▼
 thunderstorm  cloudburst  flash-flood heads
       └─────┼─────────┘
             ▼
 risk maps + explanations + categorized alerts
             │
             ▼
        API and dashboard
```

More detail is available in [docs/architecture.md](docs/architecture.md).

## Repository layout

```text
atmosalert/
├── dashboard/                Future web map and operator interface
├── configs/                  Runtime and model configuration
├── data/                     Local-only raw/intermediate/processed data
├── docs/                     Architecture and data-contract notes
├── models/                   Local-only trained artifacts
├── notebooks/                Exploration and experiments
├── src/atmosalert/
│   ├── alerts/               Alert thresholds and policies
│   ├── api/                  FastAPI routes and schemas
│   ├── core/                 Settings and shared infrastructure
│   ├── features/             Atmospheric and terrain feature engineering
│   ├── ingestion/            IMDAA, INSAT, and DEM connectors
│   ├── models/               Multi-task model interfaces
│   └── pipelines/            Training and inference orchestration
└── tests/                    Automated tests
```

## Quick start

Requirements: Python 3.11+.

```bash
cp .env.example .env
python -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -e '.[dev]'
uvicorn atmosalert.api.app:app --reload
```

Then open `http://127.0.0.1:8000/docs` or check the service:

```bash
curl http://127.0.0.1:8000/v1/health
```

The `/v1/nowcasts` endpoint intentionally returns `503 Service Unavailable`
until an inference adapter is configured.

## Common commands

```bash
make install   # install development dependencies
make run       # start the local API
make lint      # run Ruff checks
make format    # format Python sources
make test      # run tests
make check     # lint and test
```

## Configuration

Safe defaults live in `configs/default.yaml`. Environment variables use the
`ATMOSALERT_` prefix; see `.env.example` for local overrides. Secrets, raw data,
model weights, and generated forecasts must not be committed.

## Initial milestones

1. Define access and licensing for IMDAA, MOSDAC/INSAT, QPE, and DEM datasets.
2. Build resumable ingestion and a versioned common-grid data contract.
3. Establish persistence and climatology baselines before deep learning.
4. Implement feature derivation and leakage-safe temporal evaluation.
5. Train and calibrate the shared-backbone, multi-head model.
6. Add geospatial risk tiles, explainability, alert delivery, and a dashboard.
7. Validate with domain experts and documented operational safety thresholds.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the development workflow. When
reporting results, include spatial resolution, forecast horizon, event
definition, calibration, and false-alarm metrics—not accuracy alone.

## Safety

AtmosAlert is a research prototype. Public warnings should only be issued after
validation and integration with authorized meteorological and disaster
management agencies. Every forecast should retain its source-data timestamps,
model version, confidence, and an explicit stale-data state.
