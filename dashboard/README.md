# AtmosAlert dashboard

This directory is reserved for the disaster-management web interface. Keeping
it separate from the Python package allows the dashboard and inference service
to be deployed independently.

The first dashboard slice should include:

- a map with thunderstorm, cloudburst, and flash-flood risk layers;
- a 2, 4, and 6-hour forecast timeline;
- selectable alert regions and severity filters;
- source freshness and model-version indicators;
- an explanation panel for IWV, CTT cooling, instability, wind, and terrain
  triggers; and
- a prominent unavailable/stale state that never displays old data as current.

A practical prototype stack is React or Next.js with TypeScript and MapLibre
GL. Finalize the API's geospatial response or tile contract before scaffolding
the client application.
