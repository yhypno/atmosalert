# Data contracts

The first implementation task is to define a common grid dataset, preferably
using an `xarray.Dataset` persisted as chunked Zarr or NetCDF during early
experiments.

## Dynamic input dimensions

```text
time × latitude × longitude × variable
```

Variables should use canonical SI-compatible units and carry source timestamps,
ingestion timestamps, quality flags, and missing-value masks. Pressure-level
variables add a `level` dimension.

## Static input dimensions

```text
latitude × longitude × terrain_variable
```

Static terrain products must record the DEM source, resolution, resampling
method, vertical datum, and processing version.

## Forecast output dimensions

```text
issue_time × horizon × latitude × longitude × event_type
```

Required metadata includes model version, feature schema version, probability
calibration version, input freshness, and an explanation summary. Event labels
and thresholds must be versioned rather than embedded in training notebooks.
