import { useState } from "react";
import { generateMethodPdf } from "../utils/pdfGenerator";

type ExampleResult = ReturnType<typeof buildExampleResult>;

const sampleTypes = [
  "API",
  "Pharmaceutical formulation",
  "Plasma / biological",
] as const;
const techniques = ["HPLC", "LC‑MS", "LC‑MS/MS"] as const;

function buildExampleResult(drug: string) {
  const name = drug || "Drug";
  return {
    method: {
      title: `Draft HPLC Method for ${name} (Demo)`,
      column: "C18, 150 × 4.6 mm, 5 µm",
      mobilePhase: "Acetonitrile : 0.1% formic acid (60:40, v/v)",
      flowRate: "1.0 mL/min",
      detection: "UV at 240 nm",
      runtime: "10 min",
      notes: `Static demo output only – example LC conditions for ${name}. Not validated or stability‑indicating.`,
    },
    literature: [
      {
        title: `RP‑HPLC method for ${name} in tablets (demo)`,
        journal: "Journal of Pharmaceutical Analysis",
        year: 2019,
      },
      {
        title: `Stability‑indicating LC method for ${name} (demo)`,
        journal: "International Journal of Pharm Sci",
        year: 2021,
      },
    ],
    properties: {
      logP: `≈ 3.0 (approximate for ${name}, demo)`,
      pKa: `Representative basic pKa for ${name} (demo)`,
      solubility:
        "Example statement: sparingly soluble in water (demo – not measured).",
    },
  };
}

function buildFingerprint(data: {
  drug: string;
  column: string;
  instrument: string;
  email: string;
}) {
  const raw = `${data.drug}|${data.column}|${data.instrument}|${data.email}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const chr = raw.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0;
  }
  return `DEMO-${Math.abs(hash)}`;
}

export default function HomePage() {
  const [drugName, setDrugName] = useState("");
  const [sampleType, setSampleType] =
    useState<(typeof sampleTypes)[number]>("API");
  const [technique, setTechnique] =
    useState<(typeof techniques)[number]>("HPLC");
  const [result, setResult] = useState<ExampleResult | null>(null);

  const [scientistName, setScientistName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [designation, setDesignation] = useState("");
  const [instrument, setInstrument] = useState("");
  const [columnType, setColumnType] = useState("");
  const [certificate, setCertificate] = useState<{
    methodId: string;
    timestamp: string;
    fingerprint: string;
  } | null>(null);
  const [alreadyGeneratedWarning, setAlreadyGeneratedWarning] =
    useState<string | null>(null);
  const [isPaidDemo, setIsPaidDemo] = useState(false);

  function handleGenerate() {
    const name = drugName.trim() || "Drug";
    const demo = buildExampleResult(name);
    setResult(demo);

    const now = new Date();
    const timestamp = now.toISOString();
    const methodId = `LCForge-${now.getFullYear()}${(now.getMonth() + 1)
      .toString()
      .padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}-${now
      .getHours()
      .toString()
      .padStart(2, "0")}${now.getMinutes().toString().padStart(2, "0")}`;

    const fingerprint = buildFingerprint({
      drug: name,
      column: columnType || demo.method.column,
      instrument: instrument || technique,
      email: email || "anonymous@lcforge.local",
    });

    const cert = { methodId, timestamp, fingerprint };
    setCertificate(cert);

    try {
      const key = "lcforge-method-fingerprints";
      const stored = window.localStorage.getItem(key);
      const list: string[] = stored ? JSON.parse(stored) : [];
      if (!list.includes(fingerprint)) {
        list.push(fingerprint);
        window.localStorage.setItem(key, JSON.stringify(list));
      }
    } catch {
      // ignore storage errors in demo
    }
  }

  function handleDownloadPdf() {
    if (!result || !certificate) return;

    generateMethodPdf({
      drug: drugName.trim() || "Drug",
      scientistName: scientistName || "Scientist (demo)",
      email: email || "email@demo.local",
      company: company || "Organization (demo)",
      instrument: instrument || technique,
      methodId: certificate.methodId,
      timestamp: certificate.timestamp,
      fingerprint: certificate.fingerprint,
      column: columnType || result.method.column,
      mobilePhase: result.method.mobilePhase,
      flowRate: result.method.flowRate,
      detection: result.method.detection,
      runtime: result.method.runtime,
    });
  }

  return (
    <div className="home-page-shell">
      <section className="hero">
        {/* Left: hero text on top of lab image */}
        <div className="hero-left">
          <div className="hero-inner">
            <div className="hero-kicker">AI‑assisted LC development · Demo</div>
            <h1 className="hero-title">
              Draft robust chromatography methods in minutes, not weeks.
            </h1>
            <p className="hero-subtitle">
              Describe your molecule and context, and LCForge AI proposes a
              starting LC/HPLC/LC‑MS method with fingerprints and PDF
              certificates for internal documentation.
            </p>

            <div className="hero-pills">
              <span className="hero-pill">Method fingerprinting</span>
              <span className="hero-pill">PDF certificate export</span>
              <span className="hero-pill">Stability‑indicating focus</span>
            </div>

            <div className="hero-footer-line">
              Built for analytical scientists, demo only – not connected to any
              real instrument or payment gateway.
            </div>

            <div className="info-strip">
              <span className="info-chip">
                Contact (demo): support@lcforge.ai
              </span>
              <span className="info-chip">
                Scientific lead (demo): Dr. Mani Kumar
              </span>
              <span className="info-chip">
                Location (demo): Hyderabad · India
              </span>
            </div>
          </div>
        </div>

        {/* Right: glass form card */}
        <div className="hero-right">
          <div className="glass-card form-card">
            <div className="form-card-title-row">
              <div className="form-card-title">
                Quick Method Workspace (Demo)
              </div>
              <div className="form-card-hint">
                No data is sent to a server.
              </div>
            </div>

            <div className="form-grid">
              <div className="form-field">
                <label className="form-label">Scientist name</label>
                <input
                  className="form-input"
                  value={scientistName}
                  onChange={(e) => setScientistName(e.target.value)}
                  placeholder="Dr. Mani Kumar"
                />
              </div>

              <div className="form-field">
                <label className="form-label">Email</label>
                <input
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>

              <div className="form-field">
                <label className="form-label">Organization / Company</label>
                <input
                  className="form-input"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Agape Bio / CRO"
                />
              </div>

              <div className="form-field">
                <label className="form-label">Designation</label>
                <input
                  className="form-input"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="Analytical Scientist"
                />
              </div>

              <div className="form-field">
                <label className="form-label">Instrument</label>
                <input
                  className="form-input"
                  value={instrument}
                  onChange={(e) => setInstrument(e.target.value)}
                  placeholder="HPLC / UPLC / LC‑MS/MS"
                />
              </div>

              <div className="form-field">
                <label className="form-label">Column</label>
                <input
                  className="form-input"
                  value={columnType}
                  onChange={(e) => setColumnType(e.target.value)}
                  placeholder="C18, 150 × 4.6 mm, 5 µm"
                />
              </div>

              <div className="form-field">
                <label className="form-label">Drug / Analyte</label>
                <input
                  className="form-input"
                  value={drugName}
                  onChange={(e) => setDrugName(e.target.value)}
                  placeholder="Example: Metformin"
                />
              </div>

              <div className="form-field">
                <label className="form-label">Sample matrix</label>
                <select
                  className="form-select"
                  value={sampleType}
                  onChange={(e) =>
                    setSampleType(
                      e.target.value as (typeof sampleTypes)[number]
                    )
                  }
                >
                  {sampleTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label className="form-label">Technique</label>
                <select
                  className="form-select"
                  value={technique}
                  onChange={(e) =>
                    setTechnique(
                      e.target.value as (typeof techniques)[number]
                    )
                  }
                >
                  {techniques.map((tech) => (
                    <option key={tech} value={tech}>
                      {tech}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {alreadyGeneratedWarning && (
              <p className="small-muted" style={{ color: "#f97373" }}>
                {alreadyGeneratedWarning}
              </p>
            )}

            <div className="form-actions">
              <button className="btn-primary" onClick={handleGenerate}>
                Generate method (demo)
              </button>
            </div>
          </div>
        </div>
      </section>

      {result && (
        <>
          {certificate && (
            <section style={{ marginTop: "1.5rem" }}>
              <div className="result-card">
                <h3>LCForge Generated Method Certificate (Demo)</h3>
                <dl>
                  <div>
                    <dt>Drug</dt>
                    <dd>{drugName.trim() || "Drug"}</dd>
                  </div>
                  <div>
                    <dt>Generated For</dt>
                    <dd>{scientistName || "Scientist (demo)"}</dd>
                  </div>
                  <div>
                    <dt>Company</dt>
                    <dd>{company || "Organization (demo)"}</dd>
                  </div>
                  <div>
                    <dt>Email</dt>
                    <dd>{email || "email@demo.local"}</dd>
                  </div>
                  <div>
                    <dt>Instrument</dt>
                    <dd>{instrument || technique}</dd>
                  </div>
                  <div>
                    <dt>Method ID</dt>
                    <dd>{certificate.methodId}</dd>
                  </div>
                  <div>
                    <dt>Generation Date</dt>
                    <dd>{new Date(certificate.timestamp).toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt>Confidential Method Fingerprint</dt>
                    <dd>{certificate.fingerprint}</dd>
                  </div>
                </dl>
                <p className="small-muted">
                  This chromatographic method is generated exclusively for the
                  above user by LCForge AI (demo). This method is confidential
                  and reserved for the requesting organization. Unauthorized
                  reproduction or redistribution is discouraged.
                </p>

                <div
                  style={{
                    marginTop: "0.75rem",
                    padding: "0.75rem",
                    borderRadius: "0.75rem",
                    border: "1px dashed rgba(148, 163, 184, 0.7)",
                    background: "rgba(15, 23, 42, 0.9)",
                  }}
                >
                  <h4
                    style={{
                      margin: "0 0 0.4rem",
                      fontSize: "0.9rem",
                    }}
                  >
                    Payment (demo only)
                  </h4>
                  <p
                    className="small-muted"
                    style={{ marginBottom: "0.4rem" }}
                  >
                    To simulate Indian payments, this demo shows UPI details
                    only. No real payment is processed.
                  </p>
                  <p
                    style={{
                      fontSize: "0.8rem",
                      margin: "0 0 0.25rem",
                    }}
                  >
                    <strong>Payment for:</strong> LCForge Method Generation
                    (demo)
                  </p>
                  <p
                    style={{
                      fontSize: "0.8rem",
                      margin: "0 0 0.25rem",
                    }}
                  >
                    <strong>UPI ID:</strong> lcforge-demo@upi
                  </p>
                  <p
                    style={{
                      fontSize: "0.8rem",
                      margin: "0 0 0.5rem",
                    }}
                  >
                    <strong>Amount (example):</strong> ₹499 per method (demo)
                  </p>
                  <p className="small-muted">
                    After completing payment in your UPI app, tick the box below
                    to unlock PDF download (demo only, no server verification).
                  </p>

                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      fontSize: "0.8rem",
                      marginTop: "0.5rem",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isPaidDemo}
                      onChange={(e) => setIsPaidDemo(e.target.checked)}
                    />
                    I confirm I have completed UPI payment (demo).
                  </label>
                </div>

                <button
                  className="outline-button"
                  style={{
                    marginTop: "0.75rem",
                    opacity: isPaidDemo ? 1 : 0.5,
                    cursor: isPaidDemo ? "pointer" : "not-allowed",
                  }}
                  onClick={isPaidDemo ? handleDownloadPdf : undefined}
                >
                  Download Method as PDF (demo)
                </button>
              </div>
            </section>
          )}

          <section className="results">
            <div className="result-card">
              <h3>Proposed LC Method</h3>
              <dl>
                <div>
                  <dt>Drug</dt>
                  <dd>{drugName.trim() || "Drug"}</dd>
                </div>
                <div>
                  <dt>Sample type</dt>
                  <dd>{sampleType}</dd>
                </div>
                <div>
                  <dt>Technique</dt>
                  <dd>{technique}</dd>
                </div>
                <div>
                  <dt>Column</dt>
                  <dd>{result!.method.column}</dd>
                </div>
                <div>
                  <dt>Mobile phase</dt>
                  <dd>{result!.method.mobilePhase}</dd>
                </div>
                <div>
                  <dt>Flow rate</dt>
                  <dd>{result!.method.flowRate}</dd>
                </div>
                <div>
                  <dt>Detection</dt>
                  <dd>{result!.method.detection}</dd>
                </div>
                <div>
                  <dt>Run time</dt>
                  <dd>{result!.method.runtime}</dd>
                </div>
              </dl>
              <p className="small-muted">{result!.method.notes}</p>
            </div>

            <div className="result-card">
              <h3>Key Literature (demo)</h3>
              <ul>
                {result!.literature.map((lit, idx) => (
                  <li key={idx}>
                    <p className="lit-title">{lit.title}</p>
                    <p className="lit-meta">
                      {lit.journal}, {lit.year}
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="result-card">
              <h3>Drug Properties (demo)</h3>
              <dl>
                <div>
                  <dt>logP</dt>
                  <dd>{result!.properties.logP}</dd>
                </div>
                <div>
                  <dt>pKa</dt>
                  <dd>{result!.properties.pKa}</dd>
                </div>
                <div>
                  <dt>Solubility</dt>
                  <dd>{result!.properties.solubility}</dd>
                </div>
              </dl>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
