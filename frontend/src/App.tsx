import { lazy, Suspense, useEffect, useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import Landing from "./Landing";

const Dashboard = lazy(() => import("./Dashboard"));

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <a className="brand" href="#/" aria-label="AtmosAlert home">
      <svg viewBox="0 0 40 36" aria-hidden="true">
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <path d="M5 27a15 15 0 0 1 30 0M11 27a9 9 0 0 1 18 0M17 27a3 3 0 0 1 6 0M20 3v4M5 9l3 3M35 9l-3 3" />
        </g>
      </svg>
      {!compact && (
        <span>
          atmosalert<span className="brand-period">.</span>
        </span>
      )}
    </a>
  );
}

export default function App() {
  const [route, setRoute] = useState(window.location.hash || "#/");
  const [menuOpen, setMenuOpen] = useState(false);
  const isDashboard = /^#\/(dashboard|alerts|sources)/.test(route);
  useEffect(() => {
    const onChange = () => {
      setRoute(window.location.hash || "#/");
      setMenuOpen(false);
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  useEffect(() => {
    document.title = isDashboard
      ? "Forecast workspace — AtmosAlert"
      : "AtmosAlert — Early signals. Earlier action.";
  }, [isDashboard]);

  const goToSection = (id: string) => {
    setMenuOpen(false);
    if (isDashboard) {
      window.location.hash = "/";
      setTimeout(
        () =>
          document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }),
        50,
      );
    } else
      document
        .getElementById(id)
        ?.scrollIntoView({
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches
            ? "auto"
            : "smooth",
        });
  };

  return (
    <>
      <a
        href="#main-content"
        className="skip-link"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("main-content")?.focus();
        }}
      >
        Skip to content
      </a>
      <header
        className={`site-header ${isDashboard ? "workspace-header" : ""}`}
      >
        <div className="header-inner">
          <Logo />
          <nav
            className={`main-nav ${menuOpen ? "is-open" : ""}`}
            aria-label="Main navigation"
          >
            {isDashboard ? (
              <>
                <a
                  href="#/dashboard"
                  aria-current={
                    route.startsWith("#/dashboard") ? "page" : undefined
                  }
                >
                  Forecast map
                </a>
                <a
                  href="#/alerts"
                  aria-current={
                    route.startsWith("#/alerts") ? "page" : undefined
                  }
                >
                  Alerts
                </a>
                <a
                  href="#/sources"
                  aria-current={
                    route.startsWith("#/sources") ? "page" : undefined
                  }
                >
                  Data sources
                </a>
              </>
            ) : (
              <>
                <button onClick={() => goToSection("platform")}>
                  The platform
                </button>
                <button onClick={() => goToSection("method")}>
                  How it works
                </button>
                <button onClick={() => goToSection("sources")}>
                  Data & science
                </button>
              </>
            )}
          </nav>
          {isDashboard ? (
            <span className="header-prototype">Research prototype</span>
          ) : (
            <a className="button button-dark header-cta" href="#/dashboard">
              Open dashboard <ArrowUpRight size={17} />
            </a>
          )}
          <button
            className="menu-toggle icon-button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      {isDashboard ? (
        <Suspense
          fallback={
            <main id="main-content" tabIndex={-1} className="page-loading">
              Opening forecast workspace…
            </main>
          }
        >
          <Dashboard route={route} />
        </Suspense>
      ) : (
        <Landing goToSection={goToSection} />
      )}
    </>
  );
}
