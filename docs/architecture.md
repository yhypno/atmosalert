# Architecture

AtmosAlert is organized as a replaceable pipeline rather than a single model
script. Each stage should record data lineage and reject stale or incompatible
inputs.

## Components

1. **Ingestion** fetches IMDAA reanalysis, INSAT-3D/3DR observations, satellite
   precipitation estimates, and DEM tiles through source-specific adapters.
2. **Harmonization** validates units and timestamps, reprojects grids, and
   aligns all variables to a versioned common spatiotemporal grid.
3. **Feature engineering** derives IWV trends, CTT cooling rates, CAPE/CIN,
   convergence, shear, elevation, slope, and drainage descriptors.
4. **Inference** passes temporal grid sequences through a shared backbone and
   separate thunderstorm, cloudburst, and flash-flood heads.
5. **Post-processing** calibrates probabilities, applies spatial/temporal
   consistency checks, and produces explanation metadata.
6. **Alerting** converts risk into configurable categories while detecting
   missing or stale observations.
7. **Delivery** exposes forecasts through a versioned API for map tiles,
   dashboards, and notification workers.

## Suggested deployment boundaries

- **ingestion workers:** scheduled, resumable source downloads and validation;
- **feature store/object storage:** versioned grids and derived feature cubes;
- **inference worker:** GPU-capable batch or streaming inference;
- **API:** lightweight access to forecasts, health, provenance, and alerts;
- **dashboard:** risk layers, forecast timelines, trigger explanations, and
  source freshness.

These boundaries can remain in one process for the hackathon prototype and be
split only when load or reliability requires it.

## Safety and observability

Every output should include an issue time, valid time, forecast horizon, model
version, input dataset versions, calibration version, and source freshness.
Monitoring should cover ingestion latency, missing variables, distribution
shift, calibration drift, false alarms, and missed events by region and season.
