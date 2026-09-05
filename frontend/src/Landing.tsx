import { useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  CloudLightning,
  CloudRain,
  Waves,
  MapPin,
  ScanLine,
  Layers3,
  Radio,
  ChevronRight,
} from "lucide-react";
import WeatherMap from "./WeatherMap";
import { hazards, type Hazard, type Horizon } from "./data";
import { Logo } from "./App";

export const HazardIcon = ({
  hazard,
  size = 20,
}: {
  hazard: Hazard;
  size?: number;
}) =>
  hazard === "cloudburst" ? (
    <CloudRain size={size} />
  ) : hazard === "severe_thunderstorm" ? (
    <CloudLightning size={size} />
  ) : (
    <Waves size={size} />
  );

export default function Landing({
  goToSection,
}: {
  goToSection: (id: string) => void;
}) {
  const [hazard, setHazard] = useState<Hazard>("cloudburst");
  const [horizon, setHorizon] = useState<Horizon>(2);

  return (
    <main id="main-content" tabIndex={-1} className="landing">
      <section className="hero container" aria-labelledby="hero-title">
        <div className="hero-copy">
          <div className="hero-intro">
            <span className="intro-line" />
            Weather intelligence for India
          </div>
          <h1 id="hero-title">
            Early signals.
            <br />
            <span>Earlier action.</span>
          </h1>
          <p className="hero-description">
            When the weather changes in minutes,
            <br className="desktop-break" /> every hour ahead matters.
          </p>
          <p className="hero-support">
            A clearer view of thunderstorms, cloudbursts, and flash floods.
            Built to turn atmospheric signals into local understanding.
          </p>
          <div className="hero-actions">
            <a className="button button-orange" href="#/dashboard">
              Explore the dashboard <ArrowUpRight size={18} />
            </a>
            <button
              className="text-button"
              onClick={() => goToSection("method")}
            >
              See how it works <ArrowDown size={16} />
            </button>
          </div>
          <div className="hero-footnote">
            <span className="target-number">
              2–6<span>h</span>
            </span>
            <p>
              Our forecast lead-time target.
              <br />
              <span>More time to understand. More time to prepare.</span>
            </p>
          </div>
        </div>
        <div className="hero-map-frame">
          <div className="hero-map-topline">
            <span>
              <MapPin size={14} /> Uttarakhand, India
            </span>
            <span>Illustrative preview</span>
          </div>
          <div className="hero-map-body">
            <WeatherMap
              region="Uttarakhand"
              hazard={hazard}
              horizon={horizon}
              interactive={false}
            />
            <div className="hero-map-title">
              <span>The Himalayan foothills</span>
              <strong>
                A closer look.
                <br />A longer view.
              </strong>
            </div>
            <div className="hero-map-key">
              <span style={{ background: hazards[hazard].color }} />
              {hazards[hazard].name} risk · sample
            </div>
            <div className="map-preview-caption">
              <ScanLine size={15} />
              <span>Local signals. Connected geography.</span>
            </div>
          </div>
          <div className="hero-map-timeline">
            <span>Forecast window</span>
            <div role="group" aria-label="Preview forecast horizon">
              {([2, 4, 6] as Horizon[]).map((value) => (
                <button
                  key={value}
                  aria-pressed={horizon === value}
                  onClick={() => setHorizon(value)}
                >
                  +{value}h
                </button>
              ))}
            </div>
            <a href="#/dashboard" aria-label="Explore this forecast map">
              <ArrowUpRight size={20} />
            </a>
          </div>
        </div>
      </section>

      <section
        className="hazard-strip container"
        id="platform"
        aria-label="Hazards covered"
      >
        {(Object.entries(hazards) as [Hazard, (typeof hazards)[Hazard]][]).map(
          ([key, item], index) => (
            <button
              className={`hazard-link ${hazard === key ? "selected" : ""}`}
              key={key}
              onClick={() => setHazard(key)}
              aria-pressed={hazard === key}
            >
              <span className="hazard-index">0{index + 1}</span>
              <HazardIcon hazard={key} size={30} />
              <span>
                <strong>{item.name}</strong>
                <span>{item.description}</span>
              </span>
              <ChevronRight size={18} />
            </button>
          ),
        )}
      </section>

      <section className="method-section container" id="method">
        <div className="section-introduction">
          <span className="section-number">01 / The approach</span>
          <h2>
            One atmosphere.
            <br />A connected picture.
          </h2>
          <p>
            A storm doesn’t stop at a district boundary. Neither should the way
            we understand its impact.
          </p>
          <a className="text-button" href="#/dashboard">
            Explore a sample scenario <ArrowUpRight size={17} />
          </a>
        </div>
        <div className="method-steps">
          <article>
            <span className="method-icon">
              <ScanLine size={24} />
            </span>
            <div>
              <h3>Read the early signals</h3>
              <p>
                Follow moisture, cloud development, and atmospheric instability
                as the ingredients for severe weather come together.
              </p>
            </div>
            <span className="step-number">01</span>
          </article>
          <article>
            <span className="method-icon">
              <Layers3 size={24} />
            </span>
            <div>
              <h3>Connect weather to place</h3>
              <p>
                Bring atmospheric patterns together with terrain and catchments
                to understand where the impact could travel.
              </p>
            </div>
            <span className="step-number">02</span>
          </article>
          <article>
            <span className="method-icon">
              <Radio size={24} />
            </span>
            <div>
              <h3>Make the warning useful</h3>
              <p>
                Put location, timing, and the signals behind a forecast in one
                view, ready for the people coordinating a response.
              </p>
            </div>
            <span className="step-number">03</span>
          </article>
        </div>
      </section>

      <section className="science-section" id="sources">
        <div className="container science-inner">
          <div>
            <span className="section-number">02 / Data & science</span>
            <h2>
              Grounded in observation.
              <br />
              Open about uncertainty.
            </h2>
            <p>
              AtmosAlert is a research prototype. Its forecast target is being
              developed and must be validated against observed events. The
              dashboard currently uses labelled, synthetic scenarios.
            </p>
          </div>
          <div className="source-list">
            <a
              href="https://www.mosdac.gov.in/"
              target="_blank"
              rel="noreferrer"
            >
              <span>
                INSAT / MOSDAC<span>Satellite observations</span>
              </span>
              <ArrowUpRight size={20} />
            </a>
            <a
              href="https://rds.ncmrwf.gov.in/"
              target="_blank"
              rel="noreferrer"
            >
              <span>
                IMDAA / NCMRWF<span>Historical atmospheric context</span>
              </span>
              <ArrowUpRight size={20} />
            </a>
            <a
              href="https://www.earthdata.nasa.gov/data/instruments/srtm"
              target="_blank"
              rel="noreferrer"
            >
              <span>
                Terrain & catchments<span>Elevation and drainage context</span>
              </span>
              <ArrowUpRight size={20} />
            </a>
          </div>
        </div>
      </section>

      <section className="closing-section container">
        <div>
          <h2>
            See the bigger picture.
            <br />
            <span>Start with your region.</span>
          </h2>
          <p>Explore the forecast workspace, one place at a time.</p>
        </div>
        <a href="#/dashboard" className="button button-dark">
          Open the dashboard <ArrowRight size={18} />
        </a>
      </section>
      <footer className="site-footer container">
        <Logo />
        <p>For a more weather-ready India.</p>
        <span>Research prototype · 2026</span>
      </footer>
    </main>
  );
}
