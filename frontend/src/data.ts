import type { FeatureCollection, Polygon } from "geojson";

export type Hazard = "cloudburst" | "severe_thunderstorm" | "flash_flood";
export type Horizon = 2 | 4 | 6;
export type Region = "Uttarakhand" | "Himachal Pradesh";
export type Place = {
  id: string;
  name: string;
  district: string;
  region: Region;
  coordinates: [number, number];
  risk: Record<Hazard, number>;
  rainfall: number[];
  elevation: string;
};

// Invented values for interface exploration, not a reconstruction of an event.
export const DEMO_ISSUED_AT = "2025-08-12T06:30:00Z";
export const hazards: Record<
  Hazard,
  { name: string; color: string; description: string; trigger: string }
> = {
  cloudburst: {
    name: "Cloudbursts",
    color: "#c06032",
    description: "Intense, localized rainfall",
    trigger: "Moisture accumulation and rapid cloud growth",
  },
  severe_thunderstorm: {
    name: "Thunderstorms",
    color: "#a6812c",
    description: "Rapidly developing convection",
    trigger: "Instability, lift, and cloud-top cooling",
  },
  flash_flood: {
    name: "Flash floods",
    color: "#467469",
    description: "Runoff in vulnerable catchments",
    trigger: "Upstream rainfall and catchment wetness",
  },
};
export const places: Place[] = [
  {
    id: "rudraprayag",
    name: "Rudraprayag",
    district: "Rudraprayag district",
    region: "Uttarakhand",
    coordinates: [78.98, 30.28],
    risk: { cloudburst: 82, severe_thunderstorm: 68, flash_flood: 76 },
    rainfall: [18, 48, 86, 62, 34, 15],
    elevation: "895 m",
  },
  {
    id: "uttarkashi",
    name: "Uttarkashi",
    district: "Uttarkashi district",
    region: "Uttarakhand",
    coordinates: [78.45, 30.73],
    risk: { cloudburst: 64, severe_thunderstorm: 79, flash_flood: 52 },
    rainfall: [12, 32, 59, 43, 25, 12],
    elevation: "1,158 m",
  },
  {
    id: "chamoli",
    name: "Chamoli",
    district: "Chamoli district",
    region: "Uttarakhand",
    coordinates: [79.32, 30.4],
    risk: { cloudburst: 73, severe_thunderstorm: 57, flash_flood: 85 },
    rainfall: [25, 42, 68, 72, 38, 22],
    elevation: "1,300 m",
  },
  {
    id: "mandi",
    name: "Mandi",
    district: "Mandi district",
    region: "Himachal Pradesh",
    coordinates: [76.93, 31.71],
    risk: { cloudburst: 78, severe_thunderstorm: 65, flash_flood: 81 },
    rainfall: [15, 30, 64, 57, 35, 20],
    elevation: "760 m",
  },
  {
    id: "kullu",
    name: "Kullu",
    district: "Kullu district",
    region: "Himachal Pradesh",
    coordinates: [77.1, 31.96],
    risk: { cloudburst: 67, severe_thunderstorm: 75, flash_flood: 63 },
    rainfall: [10, 27, 56, 48, 29, 15],
    elevation: "1,279 m",
  },
  {
    id: "shimla",
    name: "Shimla",
    district: "Shimla district",
    region: "Himachal Pradesh",
    coordinates: [77.17, 31.1],
    risk: { cloudburst: 56, severe_thunderstorm: 84, flash_flood: 42 },
    rainfall: [8, 24, 41, 38, 19, 8],
    elevation: "2,206 m",
  },
];
export const regions: Record<
  Region,
  {
    center: [number, number];
    zoom: number;
    bounds: { west: number; south: number; east: number; north: number };
  }
> = {
  Uttarakhand: {
    center: [79.02, 30.56],
    zoom: 8.15,
    bounds: { west: 77.5, south: 28.7, east: 81.1, north: 31.5 },
  },
  "Himachal Pradesh": {
    center: [77.0, 31.62],
    zoom: 8.15,
    bounds: { west: 75.5, south: 30.3, east: 79.0, north: 33.3 },
  },
};

export function probability(place: Place, hazard: Hazard, horizon: Horizon) {
  return Math.max(12, place.risk[hazard] - (horizon - 2) * 4);
}
export function severity(value: number) {
  return value >= 75 ? "High" : value >= 55 ? "Elevated" : "Moderate";
}
export function validTime(horizon: Horizon) {
  return `${12 + horizon}:00 IST`;
}

export function riskFeatures(
  region: Region,
  hazard: Hazard,
  horizon: Horizon,
): FeatureCollection<Polygon> {
  return {
    type: "FeatureCollection",
    features: places
      .filter((p) => p.region === region)
      .flatMap((place, index) =>
        [1, 0.56].map((ring, ringIndex) => {
          const [lng, lat] = place.coordinates;
          const scale = (0.13 + index * 0.024 + (horizon - 2) * 0.018) * ring;
          const coordinates = Array.from({ length: 49 }, (_, i) => {
            const angle = ((i % 48) / 48) * Math.PI * 2;
            const irregularity =
              1 +
              0.16 * Math.sin(angle * 3 + index) +
              0.09 * Math.cos(angle * 5);
            return [
              lng + Math.cos(angle) * scale * 1.5 * irregularity,
              lat + Math.sin(angle) * scale * irregularity,
            ];
          });
          return {
            type: "Feature" as const,
            properties: {
              id: place.id,
              name: place.name,
              core: ringIndex,
              probability: probability(place, hazard, horizon),
            },
            geometry: { type: "Polygon" as const, coordinates: [coordinates] },
          };
        }),
      ),
  };
}

export function downloadDemo(
  region: Region,
  hazard: Hazard,
  horizon: Horizon,
  format: "json" | "csv" = "json",
) {
  const rows = places
    .filter((p) => p.region === region)
    .map((p) => ({
      mode: "illustrative_demo",
      issued_at: DEMO_ISSUED_AT,
      location: p.name,
      hazard,
      horizon_hours: horizon,
      probability_percent: probability(p, hazard, horizon),
    }));
  const body =
    format === "json"
      ? JSON.stringify(
          {
            notice: "Synthetic demonstration data. Not a weather forecast.",
            forecasts: rows,
          },
          null,
          2,
        )
      : [
          Object.keys(rows[0]).join(","),
          ...rows.map((row) => Object.values(row).join(",")),
        ].join("\n");
  const url = URL.createObjectURL(
    new Blob([body], {
      type: format === "json" ? "application/json" : "text/csv",
    }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `atmosalert-demo-${hazard}-${horizon}h.${format}`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
