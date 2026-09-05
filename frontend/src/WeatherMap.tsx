import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import type { GeoJSONSource } from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import { Crosshair, Minus, Plus } from "lucide-react";
import {
  hazards,
  places,
  regions,
  riskFeatures,
  type Hazard,
  type Horizon,
  type Region,
} from "./data";

maplibregl.setWorkerUrl(workerUrl);

type Props = {
  region: Region;
  hazard: Hazard;
  horizon: Horizon;
  selected?: string;
  onSelect?: (id: string) => void;
  interactive?: boolean;
  showRisk?: boolean;
  basemap?: "terrain" | "satellite";
};

export default function WeatherMap({
  region,
  hazard,
  horizon,
  selected,
  onSelect,
  interactive = true,
  showRisk = true,
  basemap = "satellite",
}: Props) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const [loaded, setLoaded] = useState(0);
  const [failed, setFailed] = useState(false);
  const [tilesFailed, setTilesFailed] = useState(false);

  useEffect(() => {
    if (!container.current) return;
    setFailed(false);
    setTilesFailed(false);
    let instance: maplibregl.Map;
    try {
      instance = new maplibregl.Map({
        container: container.current,
        center: regions[region].center,
        zoom: regions[region].zoom,
        minZoom: 5,
        maxZoom: 12,
        interactive,
        attributionControl: false,
        style: {
          version: 8,
          sources: {
            geography: {
              type: "raster",
              tiles: [
                `https://server.arcgisonline.com/ArcGIS/rest/services/${basemap === "satellite" ? "World_Imagery" : "World_Topo_Map"}/MapServer/tile/{z}/{y}/{x}`,
              ],
              tileSize: 256,
              maxzoom: 17,
              attribution:
                "Tiles © Esri — Esri, Maxar, Earthstar Geographics, and the GIS User Community",
            },
          },
          layers: [
            {
              id: "background",
              type: "background",
              paint: { "background-color": "#c9cbbb" },
            },
            {
              id: "geography",
              type: "raster",
              source: "geography",
              paint: {
                "raster-saturation": basemap === "satellite" ? -0.62 : -0.55,
                "raster-brightness-max": basemap === "satellite" ? 0.8 : 1,
                "raster-contrast": 0.08,
              },
            },
          ],
        },
      });
    } catch {
      setFailed(true);
      return;
    }
    map.current = instance;
    instance.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      "bottom-right",
    );
    instance.addControl(
      new maplibregl.ScaleControl({ maxWidth: 80, unit: "metric" }),
      "bottom-left",
    );
    instance.scrollZoom.disable();
    instance.dragRotate.disable();
    instance.touchZoomRotate.disableRotation();
    instance.on("error", (event) => {
      if ("sourceId" in event && event.sourceId === "geography")
        setTilesFailed(true);
    });
    instance.on("sourcedata", (event) => {
      if (event.sourceId === "geography" && event.isSourceLoaded)
        setTilesFailed(false);
    });
    instance.on("style.load", () => {
      instance.addSource("risk", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      instance.addLayer({
        id: "risk-fill",
        type: "fill",
        source: "risk",
        paint: {
          "fill-color": "#c06032",
          "fill-opacity": ["case", ["==", ["get", "core"], 1], 0.36, 0.2],
        },
      });
      instance.addLayer({
        id: "risk-outline",
        type: "line",
        source: "risk",
        paint: {
          "line-color": "#f3ba87",
          "line-width": 1.5,
          "line-opacity": 0.95,
          "line-dasharray": [3, 2],
        },
      });
      setLoaded((value) => value + 1);
    });
    const observer = new ResizeObserver(() => instance.resize());
    observer.observe(container.current);
    return () => {
      observer.disconnect();
      instance.remove();
      map.current = null;
    };
    // A region change re-centers in the effect below without rebuilding tiles.
  }, [basemap, interactive]);

  useEffect(() => {
    const instance = map.current;
    if (!instance?.getSource("risk")) return;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    instance.easeTo({
      center: regions[region].center,
      zoom: regions[region].zoom,
      duration: reduced ? 0 : 650,
    });
    (instance.getSource("risk") as GeoJSONSource).setData(
      showRisk
        ? riskFeatures(region, hazard, horizon)
        : { type: "FeatureCollection", features: [] },
    );
    instance.setPaintProperty("risk-fill", "fill-color", hazards[hazard].color);
    instance.setPaintProperty(
      "risk-outline",
      "line-color",
      basemap === "satellite" ? "#f3d6aa" : hazards[hazard].color,
    );
    const markers = places
      .filter((place) => place.region === region && showRisk)
      .map((place) => {
        const element = document.createElement(
          onSelectRef.current ? "button" : "div",
        );
        element.className = `map-place ${place.id === selected ? "is-selected" : ""} ${basemap === "terrain" ? "on-light-map" : ""}`;
        if (element instanceof HTMLButtonElement) {
          element.type = "button";
          element.setAttribute("aria-label", `Inspect ${place.name}`);
          element.addEventListener("click", () =>
            onSelectRef.current?.(place.id),
          );
        }
        const dot = document.createElement("span");
        dot.className = "map-place-dot";
        const label = document.createElement("span");
        label.textContent = place.name;
        element.append(dot, label);
        return new maplibregl.Marker({
          element,
          anchor: "left",
          offset: [-6, 0],
        })
          .setLngLat(place.coordinates)
          .addTo(instance);
      });
    return () => markers.forEach((marker) => marker.remove());
  }, [loaded, region, hazard, horizon, selected, showRisk, basemap]);

  const reset = () =>
    map.current?.easeTo({
      center: regions[region].center,
      zoom: regions[region].zoom,
      bearing: 0,
      duration: 300,
    });

  return (
    <div className={`weather-map ${basemap}`}>
      <div
        ref={container}
        className="map-canvas"
        aria-label={`${region} geographic map${showRisk ? " with illustrative risk areas" : ""}`}
      />
      {failed && (
        <div className="map-fallback" role="status">
          <Crosshair size={32} />
          <strong>Map display is unavailable</strong>
          <p>
            Your browser could not start the map. Location details remain
            available in the forecast list.
          </p>
        </div>
      )}
      {tilesFailed && !failed && (
        <div className="tile-warning" role="status">
          Basemap imagery is unavailable. Sample locations are still shown.
        </div>
      )}
      {!failed && (
        <div className="map-north" aria-hidden="true">
          <span>N</span>
          <svg viewBox="0 0 20 28">
            <path d="m10 2 7 23-7-5-7 5Z" fill="currentColor" />
            <path d="M10 2v18l7 5Z" fill="currentColor" opacity=".3" />
          </svg>
        </div>
      )}
      {interactive && !failed && (
        <div className="map-controls">
          <button onClick={() => map.current?.zoomIn()} aria-label="Zoom in">
            <Plus size={18} />
          </button>
          <button onClick={() => map.current?.zoomOut()} aria-label="Zoom out">
            <Minus size={18} />
          </button>
          <button onClick={reset} aria-label="Reset map view">
            <Crosshair size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
