import { useState } from "react";
import HomePage from "./pages/Home";
import PricingPage from "./pages/Pricing";
import "./index.css";

type Page = "home" | "pricing";

export default function App() {
  const [page, setPage] = useState<Page>("home");

  return (
    <div className="app-shell">
      {/* Left sidebar */}
      <aside className="app-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo-circle">LC</div>
          <div className="sidebar-title-block">
            <div className="sidebar-title">LCForge AI</div>
            <div className="sidebar-subtitle">Chromatography Studio (Demo)</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Workspace</div>

          <button
            className={
              page === "home"
                ? "sidebar-nav-item sidebar-nav-item-active"
                : "sidebar-nav-item"
            }
            onClick={() => setPage("home")}
          >
            Method Generator
          </button>

          <button
            className={
              page === "pricing"
                ? "sidebar-nav-item sidebar-nav-item-active"
                : "sidebar-nav-item"
            }
            onClick={() => setPage("pricing")}
          >
            Pricing
          </button>

          <button className="sidebar-nav-item" disabled>
            Stability Studies (coming)
          </button>
          <button className="sidebar-nav-item" disabled>
            Impurity Mapping (coming)
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-badge">
            Demo only · Not for clinical use
          </div>
          <div className="sidebar-footer-text">
            Built for analytical scientists to **prototype** LC methods faster.
          </div>
          <div className="sidebar-footer-mini">
            v0.2 · Fingerprinted methods · PDF export
          </div>
        </div>
      </aside>

      {/* Right main area: your old layout inside */}
      <div className="app-main">
        <div className="app-root">
          <header className="navbar">
            <div className="navbar-left">
              <span className="logo-dot" />
              <div>
                <div className="logo-text">LCForge AI</div>
                <div className="logo-tagline">
                  Forge Robust Chromatography with AI
                </div>
              </div>
            </div>
            <nav className="navbar-nav">
              <button
                className={
                  page === "home" ? "nav-link nav-link-active" : "nav-link"
                }
                onClick={() => setPage("home")}
              >
                Home
              </button>
              <button
                className={
                  page === "pricing" ? "nav-link nav-link-active" : "nav-link"
                }
                onClick={() => setPage("pricing")}
              >
                Pricing
              </button>
            </nav>
          </header>

          <main className="main">
            {page === "home" && <HomePage />}
            {page === "pricing" && <PricingPage />}
          </main>

          <footer className="footer">
            <p>
              LCForge AI – Demo interface only. No real backend or payments are
              connected.
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
