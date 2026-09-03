# Contributing

## Local setup

Create a Python 3.11+ virtual environment, then run:

```bash
make install
make check
```

## Development guidelines

- Keep data-source-specific logic inside `ingestion/` adapters.
- Keep API schemas separate from internal model and grid representations.
- Version datasets, features, model artifacts, and alert policies together.
- Add unit tests for feature calculations and integration tests for pipelines.
- Never commit credentials, restricted datasets, generated risk maps, or model
  weights.
- Treat forecast times as timezone-aware UTC values at system boundaries.

## Pull requests

Describe the data and model assumptions behind a change, include tests, and
report forecast quality by event type and lead time when behavior changes.
