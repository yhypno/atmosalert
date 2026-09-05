import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronRight,
  Download,
  Info,
  MapPin,
  Pause,
  Play,
  RefreshCw,
  Search,
  ShieldCheck,
  Unplug,
  X,
} from "lucide-react";
import WeatherMap from "./WeatherMap";
import { HazardIcon } from "./Landing";
import { getHealth, requestNowcast, type Health } from "./api";
import {
  DEMO_ISSUED_AT,
  downloadDemo,
  hazards,
  places,
  probability,
  regions,
  severity,
  validTime,
  type Hazard,
  type Horizon,
  type Place,
  type Region,
} from "./data";

function useService() {
  const [health, setHealth] = useState<Health | null>(null);
  const [checking, setChecking] = useState(true);
  const [checked, setChecked] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    let active = true;
    setChecking(true);
    getHealth(controller.signal)
      .then((data) => {
        if (active) setHealth(data);
      })
      .catch(() => {
        if (active) setHealth(null);
      })
      .finally(() => {
        clearTimeout(timeout);
        if (active) {
          setChecking(false);
          setChecked(
            new Date().toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          );
        }
      });
    return () => {
      active = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [revision]);
  return {
    health,
    checking,
    checked,
    refresh: () => setRevision((value) => value + 1),
  };
}

function initialHazard(route: string): Hazard {
  const candidate = new URLSearchParams(route.split("?")[1]).get("hazard");
  return candidate && candidate in hazards
    ? (candidate as Hazard)
    : "cloudburst";
}

export default function Dashboard({ route }: { route: string }) {
  const [region, setRegion] = useState<Region>("Uttarakhand");
  const [hazard, setHazard] = useState<Hazard>(() => initialHazard(route));
  const [horizon, setHorizon] = useState<Horizon>(2);
  const [selected, setSelected] = useState("rudraprayag");
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"demo" | "live">("demo");
  const [basemap, setBasemap] = useState<"terrain" | "satellite">("satellite");
  const [playing, setPlaying] = useState(false);
  const [liveMessage, setLiveMessage] = useState("");
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveRevision, setLiveRevision] = useState(0);
  const service = useService();
  const view = route.startsWith("#/alerts")
    ? "alerts"
    : route.startsWith("#/sources")
      ? "sources"
      : "map";
  const localPlaces = places.filter((place) => place.region === region);
  const current =
    places.find((place) => place.id === selected) ?? localPlaces[0];
  const searchResults = query.trim()
    ? places.filter((place) =>
        `${place.name} ${place.region}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      )
    : [];

  useEffect(() => {
    if (route.includes("hazard=")) setHazard(initialHazard(route));
  }, [route]);
  useEffect(() => {
    if (!playing || mode !== "demo" || view !== "map") return;
    const timer = setInterval(
      () => setHorizon((value) => (value === 6 ? 2 : ((value + 2) as Horizon))),
      2200,
    );
    return () => clearInterval(timer);
  }, [playing, mode, view]);
  useEffect(() => {
    if (mode !== "live") return;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    let active = true;
    setPlaying(false);
    setLiveLoading(true);
    setLiveMessage("");
    requestNowcast(regions[region].bounds, horizon, hazard, controller.signal)
      .then((message) => {
        if (active) setLiveMessage(message);
      })
      .catch((error) => {
        if (active)
          setLiveMessage(
            error instanceof Error &&
              error.name !== "AbortError" &&
              error.name !== "TypeError"
              ? error.message
              : "The forecast service could not be reached. Please try again shortly.",
          );
      })
      .finally(() => {
        clearTimeout(timeout);
        if (active) setLiveLoading(false);
      });
    return () => {
      active = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [mode, region, horizon, hazard, liveRevision]);

  const selectPlace = (place: Place) => {
    setRegion(place.region);
    setSelected(place.id);
    setQuery("");
  };
  const changeRegion = (value: Region) => {
    setRegion(value);
    setSelected(places.find((place) => place.region === value)!.id);
  };

  return (
    <main id="main-content" tabIndex={-1} className="dashboard">
      <div className="workspace-toolbar">
        <div className="workspace-location">
          <MapPin size={20} />
          <label>
            <span className="sr-only">Forecast region</span>
            <select
              value={region}
              onChange={(event) => changeRegion(event.target.value as Region)}
            >
              {Object.keys(regions).map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
          </label>
          <ChevronDown size={16} />
          <span className="country-label">India</span>
        </div>
        <div className="workspace-search">
          <Search size={17} />
          <label className="sr-only" htmlFor="location-search">
            Search a location
          </label>
          <input
            id="location-search"
            autoComplete="off"
            placeholder="Find a location…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") setQuery("");
              if (event.key === "Enter" && searchResults[0])
                selectPlace(searchResults[0]);
            }}
          />
          {query && (
            <button onClick={() => setQuery("")} aria-label="Clear search">
              <X size={15} />
            </button>
          )}
          {query.trim() && (
            <div
              className="search-results"
              aria-label="Location search results"
            >
              {searchResults.length ? (
                searchResults.map((place) => (
                  <button key={place.id} onClick={() => selectPlace(place)}>
                    <MapPin size={15} />
                    <span>
                      {place.name}
                      <span>{place.region}</span>
                    </span>
                    <ArrowUpRight size={15} />
                  </button>
                ))
              ) : (
                <p>No sample locations match “{query}”.</p>
              )}
            </div>
          )}
        </div>
        <div className="mode-switch" role="group" aria-label="Data mode">
          <button
            aria-pressed={mode === "demo"}
            onClick={() => setMode("demo")}
          >
            Demo scenario
          </button>
          <button
            aria-pressed={mode === "live"}
            onClick={() => setMode("live")}
          >
            Live data
          </button>
        </div>
      </div>
      <div
        className={`scenario-banner ${mode === "live" ? "live-banner" : ""}`}
        role="status"
      >
        <Info size={15} />
        <span>
          {mode === "demo" ? (
            <>
              <strong>Illustrative scenario</strong>
              <span className="banner-divider">/</span>12 Aug 2025, 12:00 IST
              <span className="banner-divider">/</span>Synthetic data. Not an
              actual weather forecast.
            </>
          ) : (
            <>
              <strong>Live service</strong>
              <span className="banner-divider">/</span>
              {liveLoading
                ? "Checking forecast availability…"
                : "No live risk layers are displayed."}
            </>
          )}
        </span>
        <a href="#/sources">
          Source status <ArrowUpRight size={13} />
        </a>
      </div>

      {view === "sources" ? (
        <Sources service={service} />
      ) : view === "alerts" ? (
        <Alerts
          region={region}
          horizon={horizon}
          mode={mode}
          onInspect={(place, event) => {
            selectPlace(place);
            setHazard(event);
            window.location.hash = "/dashboard";
          }}
        />
      ) : (
        <>
          <div className="forecast-workspace">
            <aside className="layers-panel" aria-label="Forecast controls">
              <h1>Forecast layers</h1>
              <p className="panel-subtitle">Select a hazard to explore</p>
              <div
                className="hazard-options"
                role="group"
                aria-label="Hazard layer"
              >
                {(
                  Object.entries(hazards) as [
                    Hazard,
                    (typeof hazards)[Hazard],
                  ][]
                ).map(([key, item]) => (
                  <button
                    key={key}
                    className={hazard === key ? "active" : ""}
                    aria-pressed={hazard === key}
                    onClick={() => setHazard(key)}
                  >
                    <HazardIcon hazard={key} />
                    <span>{item.name}</span>
                    <span className="selection-circle">
                      {hazard === key && <Check size={10} />}
                    </span>
                  </button>
                ))}
              </div>
              <div className="risk-legend">
                <span>Illustrative probability</span>
                <div className="legend-swatches">
                  <i
                    style={{ background: hazards[hazard].color, opacity: 0.25 }}
                  />
                  <i
                    style={{ background: hazards[hazard].color, opacity: 0.5 }}
                  />
                  <i
                    style={{ background: hazards[hazard].color, opacity: 0.75 }}
                  />
                  <i style={{ background: hazards[hazard].color }} />
                </div>
                <div className="legend-labels">
                  <span>Lower</span>
                  <span>Higher</span>
                </div>
              </div>
              <div className="location-list-heading">
                <h2>Locations</h2>
                <span>{mode === "demo" ? localPlaces.length : "—"}</span>
              </div>
              {mode === "demo" ? (
                <div className="location-list">
                  {localPlaces.map((place) => (
                    <button
                      key={place.id}
                      className={selected === place.id ? "active" : ""}
                      onClick={() => selectPlace(place)}
                      aria-pressed={selected === place.id}
                    >
                      <span>
                        <strong>{place.name}</strong>
                        <span>
                          {severity(probability(place, hazard, horizon))}{" "}
                          potential
                        </span>
                      </span>
                      <span className="location-risk">
                        {probability(place, hazard, horizon)}
                        <span>%</span>
                      </span>
                      <ChevronRight size={14} />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="location-empty">
                  Locations will appear when live forecasts are available.
                </p>
              )}
              <div className="basemap-picker">
                <h2>Basemap</h2>
                <div role="group" aria-label="Basemap style">
                  <button
                    onClick={() => setBasemap("satellite")}
                    aria-pressed={basemap === "satellite"}
                  >
                    Satellite
                  </button>
                  <button
                    onClick={() => setBasemap("terrain")}
                    aria-pressed={basemap === "terrain"}
                  >
                    Terrain
                  </button>
                </div>
              </div>
              <a className="layer-source-link" href="#/sources">
                <ShieldCheck size={15} />
                Data & model status <ArrowUpRight size={14} />
              </a>
            </aside>

            <section
              className="map-and-timeline"
              aria-label="Forecast map and timeline"
            >
              <div className="workspace-map">
                <WeatherMap
                  region={region}
                  hazard={hazard}
                  horizon={horizon}
                  selected={selected}
                  onSelect={(id) => setSelected(id)}
                  showRisk={mode === "demo"}
                  basemap={basemap}
                />
                <div className="map-location-label">
                  <MapPin size={14} />
                  {region}
                  <span>{mode === "demo" ? "Demo" : "Geography only"}</span>
                </div>
                {mode === "live" && (
                  <div className="live-unavailable" role="status">
                    <Unplug size={28} />
                    <h2>
                      {liveLoading
                        ? "Checking live forecasts"
                        : "No live forecast available"}
                    </h2>
                    <p>
                      {liveLoading
                        ? "Connecting to the forecast service…"
                        : liveMessage}
                    </p>
                    <button
                      className="button button-dark"
                      onClick={() => setLiveRevision((value) => value + 1)}
                      disabled={liveLoading}
                    >
                      <RefreshCw
                        size={15}
                        className={liveLoading ? "spinning" : ""}
                      />
                      Try again
                    </button>
                    <button
                      className="text-button"
                      onClick={() => setMode("demo")}
                    >
                      Explore the demo <ArrowRight size={15} />
                    </button>
                  </div>
                )}
              </div>
              <div className="forecast-timeline">
                <div className="timeline-heading">
                  <span>Forecast lead time</span>
                  <span>
                    {mode === "demo"
                      ? `12 Aug · ${validTime(horizon)}`
                      : "Awaiting live data"}
                  </span>
                </div>
                <div className="timeline-controls">
                  <button
                    className="play-button"
                    onClick={() => setPlaying(!playing)}
                    aria-label={
                      playing
                        ? "Pause forecast playback"
                        : "Play forecast timeline"
                    }
                    disabled={mode === "live"}
                  >
                    {playing ? <Pause size={17} /> : <Play size={17} />}
                  </button>
                  <div
                    className="horizon-track"
                    role="group"
                    aria-label="Forecast lead time"
                  >
                    {([2, 4, 6] as Horizon[]).map((value) => (
                      <button
                        key={value}
                        aria-pressed={horizon === value}
                        onClick={() => {
                          setHorizon(value);
                          setPlaying(false);
                        }}
                      >
                        <span>+{value} hours</span>
                        <span className="timeline-tick" />
                      </button>
                    ))}
                  </div>
                  <button
                    className="timeline-download icon-button"
                    aria-label="Download demo forecast JSON"
                    onClick={() => downloadDemo(region, hazard, horizon)}
                    disabled={mode === "live"}
                  >
                    <Download size={17} />
                  </button>
                </div>
              </div>
            </section>

            <aside className="inspector" aria-label="Selected location details">
              {mode === "demo" ? (
                <ForecastDetails
                  place={current}
                  hazard={hazard}
                  horizon={horizon}
                />
              ) : (
                <div className="inspector-empty">
                  <ShieldCheck size={26} />
                  <h2>Waiting for a forecast</h2>
                  <p>
                    Risk estimates and contributing signals will appear here
                    when live predictions are available.
                  </p>
                  <a href="#/sources" className="text-button">
                    View source status <ArrowUpRight size={15} />
                  </a>
                </div>
              )}
            </aside>
          </div>
          <div className="workspace-bottom">
            <span>
              <Info size={13} />
              Forecast areas are illustrative. Map detail does not indicate
              forecast resolution.
            </span>
            <span>
              {mode === "demo"
                ? "Sample scenario · v0.1"
                : "Live service · prototype"}
            </span>
          </div>
        </>
      )}
    </main>
  );
}

function ForecastDetails({
  place,
  hazard,
  horizon,
}: {
  place: Place;
  hazard: Hazard;
  horizon: Horizon;
}) {
  const risk = probability(place, hazard, horizon);
  const signals =
    hazard === "flash_flood"
      ? [
          {
            label: "Catchment wetness",
            value: "78",
            unit: "%",
            note: "Illustrative soil saturation",
          },
          {
            label: "Upstream rainfall",
            value: "64",
            unit: "mm",
            note: "Sample 3-hour accumulation",
          },
          {
            label: "Terrain elevation",
            value: place.elevation,
            unit: "",
            note: "Approximate town elevation",
          },
        ]
      : [
          {
            label: "Integrated water vapour",
            value: "47.2",
            unit: "mm",
            note: "+4.8 mm over the sample hour",
          },
          {
            label: "Cloud-top temperature",
            value: "−62",
            unit: "°C",
            note: "8°C cooling in the sample hour",
          },
          {
            label: "Convective energy",
            value: "2,100",
            unit: "J/kg",
            note: "Illustrative CAPE",
          },
        ];
  return (
    <>
      <div className="inspector-heading">
        <span>
          <MapPin size={14} />
          {place.district}
        </span>
        <h2>{place.name}</h2>
        <p>
          {place.coordinates[1].toFixed(2)}° N,{" "}
          {place.coordinates[0].toFixed(2)}° E
        </p>
      </div>
      <div className="probability-block">
        <span className="probability-label">
          <HazardIcon hazard={hazard} size={18} />
          {hazards[hazard].name}
        </span>
        <div>
          <strong>
            {risk}
            <span>%</span>
          </strong>
          <span className={`severity-text ${severity(risk).toLowerCase()}`}>
            {severity(risk)} potential
          </span>
        </div>
        <p>Illustrative event probability</p>
      </div>
      <dl className="forecast-window">
        <div>
          <dt>Forecast window</dt>
          <dd>
            {12 + horizon}:00–{13 + horizon}:00 IST
          </dd>
        </div>
        <div>
          <dt>Lead time</dt>
          <dd>{horizon} hours</dd>
        </div>
      </dl>
      <div className="signals">
        <h3>
          Behind the forecast <Info size={14} />
        </h3>
        <p>Sample atmospheric signals</p>
        {signals.map((signal) => (
          <div className="signal-row" key={signal.label}>
            <span>{signal.label}</span>
            <strong>
              {signal.value} <span>{signal.unit}</span>
            </strong>
            <p>{signal.note}</p>
          </div>
        ))}
      </div>
      <div className="rain-chart">
        <div>
          <h3>Rainfall outlook</h3>
          <span>Sample · mm/h</span>
        </div>
        <div
          className="chart-bars"
          role="img"
          aria-label={`Illustrative hourly rainfall from 13:00 to 18:00: ${place.rainfall.join(", ")} millimetres per hour`}
        >
          {place.rainfall.map((value, index) => (
            <div
              key={index}
              className={index === horizon - 1 ? "selected" : ""}
            >
              <span className="bar-value">{value}</span>
              <span
                className="rain-bar"
                style={{ height: `${value * 0.65}px` }}
              />
              <span className="bar-hour">{index + 13}</span>
            </div>
          ))}
        </div>
      </div>
      <a href="#/alerts" className="inspector-alert-link">
        Review sample alerts <ArrowRight size={16} />
      </a>
      <details className="scenario-details">
        <summary>About this scenario</summary>
        <p>
          All probabilities, risk areas, and atmospheric values are synthetic
          interface examples, issued at 12:00 IST on 12 August 2025. They do not
          describe an observed event or a validated prediction.
        </p>
      </details>
    </>
  );
}

function Alerts({
  region,
  horizon,
  mode,
  onInspect,
}: {
  region: Region;
  horizon: Horizon;
  mode: "demo" | "live";
  onInspect: (place: Place, hazard: Hazard) => void;
}) {
  const [filter, setFilter] = useState("all");
  const [level, setLevel] = useState("all");
  const [acknowledged, setAcknowledged] = useState<string[]>(() => {
    try {
      const value = JSON.parse(
        localStorage.getItem("atmosalert-demo-acknowledged") || "[]",
      );
      return Array.isArray(value)
        ? value.filter((item) => typeof item === "string")
        : [];
    } catch {
      return [];
    }
  });
  const [notice, setNotice] = useState("");
  const rows = useMemo(
    () =>
      places
        .filter((place) => place.region === region)
        .flatMap((place) =>
          (Object.keys(hazards) as Hazard[]).map((hazard) => ({
            place,
            hazard,
            probability: probability(place, hazard, horizon),
            id: `${place.id}-${hazard}-${horizon}`,
          })),
        )
        .filter(
          (row) =>
            (filter === "all" || row.hazard === filter) &&
            (level === "all" || severity(row.probability) === level),
        )
        .sort((a, b) => b.probability - a.probability),
    [region, horizon, filter, level],
  );
  const acknowledge = (id: string) => {
    const next = [...acknowledged, id];
    setAcknowledged(next);
    try {
      localStorage.setItem(
        "atmosalert-demo-acknowledged",
        JSON.stringify(next),
      );
      setNotice(
        "Demo acknowledgement saved on this device. No notification was sent.",
      );
    } catch {
      setNotice(
        "Demo acknowledged for this session. Device storage is unavailable.",
      );
    }
  };
  const exportCSV = () => {
    const content = [
      "mode,issued_at,location,hazard,horizon_hours,probability_percent,reviewed",
      ...rows.map((row) =>
        [
          "illustrative_demo",
          DEMO_ISSUED_AT,
          row.place.name,
          row.hazard,
          horizon,
          row.probability,
          acknowledged.includes(row.id),
        ].join(","),
      ),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([content], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "atmosalert-demo-alerts.csv";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <section className="records-page">
      <div className="records-heading">
        <div>
          <h1>Alert log</h1>
          <p>Review potential impacts across {region}.</p>
        </div>
        <button
          className="button button-outline"
          onClick={exportCSV}
          disabled={mode === "live" || !rows.length}
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>
      {mode === "live" ? (
        <div className="records-empty">
          <Unplug size={30} />
          <h2>No live alerts available</h2>
          <p>
            Live alert delivery is not connected. Use the demo scenario to
            explore the review workflow.
          </p>
        </div>
      ) : (
        <>
          <div className="table-filters">
            <label>
              Hazard
              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
              >
                <option value="all">All hazards</option>
                {Object.entries(hazards).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Potential
              <select
                value={level}
                onChange={(event) => setLevel(event.target.value)}
              >
                <option value="all">All levels</option>
                <option>High</option>
                <option>Elevated</option>
                <option>Moderate</option>
              </select>
            </label>
            <span>
              {rows.length} sample alerts · +{horizon}h
            </span>
          </div>
          {notice && (
            <div className="inline-notice" role="status">
              <Check size={15} />
              {notice}
              <button
                onClick={() => setNotice("")}
                aria-label="Dismiss acknowledgement notice"
              >
                <X size={15} />
              </button>
            </div>
          )}
          <div className="table-scroll">
            <table className="alerts-table">
              <thead>
                <tr>
                  <th>Location</th>
                  <th>Hazard</th>
                  <th>Potential</th>
                  <th>Probability</th>
                  <th>Forecast window</th>
                  <th>Review</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <button onClick={() => onInspect(row.place, row.hazard)}>
                        {row.place.name}
                        <ArrowUpRight size={13} />
                      </button>
                      <span>{row.place.district}</span>
                    </td>
                    <td>
                      <span className="table-hazard">
                        <HazardIcon hazard={row.hazard} size={17} />
                        {hazards[row.hazard].name}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`severity-text ${severity(row.probability).toLowerCase()}`}
                      >
                        {severity(row.probability)}
                      </span>
                    </td>
                    <td className="table-probability">{row.probability}%</td>
                    <td>
                      {12 + horizon}:00–{13 + horizon}:00 IST
                    </td>
                    <td>
                      <button
                        className={`acknowledge-button ${acknowledged.includes(row.id) ? "acknowledged" : ""}`}
                        disabled={acknowledged.includes(row.id)}
                        onClick={() => acknowledge(row.id)}
                      >
                        {acknowledged.includes(row.id) ? (
                          <>
                            <Check size={14} />
                            Acknowledged
                          </>
                        ) : (
                          "Acknowledge"
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!rows.length && (
              <p className="no-results">
                No sample alerts match these filters.
              </p>
            )}
          </div>
          <p className="records-note">
            <Info size={14} />
            These alerts are synthetic. Acknowledgements are local to this
            browser and do not contact responders.
          </p>
        </>
      )}
    </section>
  );
}

function Sources({ service }: { service: ReturnType<typeof useService> }) {
  return (
    <section className="records-page source-page">
      <div className="records-heading">
        <div>
          <h1>Data & model status</h1>
          <p>
            What is connected, what is planned, and where the data comes from.
          </p>
        </div>
        <button
          className="button button-outline"
          onClick={service.refresh}
          disabled={service.checking}
        >
          <RefreshCw size={16} className={service.checking ? "spinning" : ""} />
          {service.checking ? "Checking…" : "Refresh status"}
        </button>
      </div>
      <div className="service-status">
        <ShieldCheck size={28} />
        <div>
          <h2>
            {service.checking
              ? "Checking the weather service"
              : service.health
                ? "Backend service connected"
                : "Backend service unavailable"}
          </h2>
          <p>
            {service.health
              ? `API v${service.health.version}. ${service.health.model_ready ? "The service reports that a model is loaded." : "No forecasting model is loaded."}`
              : "The dashboard demo remains available while the backend is offline."}
          </p>
        </div>
        <span>{service.checked && `API checked at ${service.checked}`}</span>
      </div>
      <div className="sources-table">
        <div className="sources-table-header">
          <span>Source</span>
          <span>Role in the forecast</span>
          <span>Connection</span>
        </div>
        <div>
          <a href="https://www.mosdac.gov.in/" target="_blank" rel="noreferrer">
            INSAT / MOSDAC <ArrowUpRight size={15} />
          </a>
          <p>
            Satellite imagery, cloud development, moisture and precipitation
            products.
          </p>
          <span>Not connected</span>
        </div>
        <div>
          <a href="https://rds.ncmrwf.gov.in/" target="_blank" rel="noreferrer">
            IMDAA / NCMRWF <ArrowUpRight size={15} />
          </a>
          <p>
            Historical atmospheric fields for training and context. Current
            products need verified delivery times.
          </p>
          <span>Not connected</span>
        </div>
        <div>
          <span>Terrain & catchments</span>
          <p>
            Elevation, drainage, and antecedent wetness for flood assessment.
            The display basemap is not an inference input.
          </p>
          <span>Not connected</span>
        </div>
        <div>
          <span>Forecast model</span>
          <p>
            Shared prediction engine for the three hazards, with a target lead
            time of 2–6 hours.
          </p>
          <span>
            {service.checking
              ? "Checking"
              : service.health?.model_ready
                ? "Reported ready"
                : "Unavailable"}
          </span>
        </div>
        <div>
          <span>Notification delivery</span>
          <p>
            Targeted warnings to response teams. Demo acknowledgements only
            affect this browser.
          </p>
          <span>Not connected</span>
        </div>
      </div>
      <div className="source-explanation">
        <Info size={22} />
        <div>
          <h2>A basemap is not a weather observation.</h2>
          <p>
            Geographic imagery is supplied by Esri and its contributors. The
            demo risk areas and weather values are synthetic. Current satellite
            observations and validated predictions will be integrated
            separately.
          </p>
          <a href="#/dashboard" className="text-button">
            Back to the forecast map <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </section>
  );
}
