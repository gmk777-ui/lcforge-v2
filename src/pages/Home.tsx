import { useEffect, useState } from "react";
import { generateMethodPdf } from "../utils/pdfGenerator";

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

type ExampleResult = ReturnType<typeof buildExampleResult>;

function buildFingerprint(data: {
  drug: string;
  column: string;
  instrument: string;
  email: string;
}) {
  const base = `${data.drug}|${data.column}|${data.instrument}|${data.email}`;
  let hash = 0;
  for (let i = 0; i < base.length; i++) {
    hash = (hash * 31 + base.charCodeAt(i)) >>> 0;
  }
  return `LCF-${hash.toString(16).toUpperCase().slice(0, 8)}`;
}

interface Certificate {
  methodId: string;
  timestamp: number;
  fingerprint: string;
}

function Home() {
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  const sampleTypes = [
    "API",
    "Pharmaceutical formulation",
    "Plasma / biological",
  ] as const;
  const techniques = ["HPLC", "LC‑MS", "LC‑MS/MS"] as const;

  const [drugName, setDrugName] = useState("");
  const [sampleType, setSampleType] =
    useState<(typeof sampleTypes)[number]>("API");
  const [technique, setTechnique] =
    useState<(typeof techniques)[number]>("HPLC");
  const [scientistName, setScientistName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [instrument, setInstrument] = useState("");
  const [result, setResult] = useState<ExampleResult | null>(null);
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [backendStatus, setBackendStatus] = useState<string>(
    "Checking backend..."
  );
  const [generateStatus, setGenerateStatus] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  useEffect(() => {
    fetch("http://localhost:5000/health")
      .then((res) => res.json())
      .then((data) => {
        setBackendStatus(`${data.status} - ${data.message}`);
      })
      .catch((err) => {
        console.error(err);
        setBackendStatus("Error connecting to backend");
      });
  }, [backendUrl]);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`${backendUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          drugName,
          sampleType,
          technique,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Backend error: ${response.status} ${text}`);
      }

      const data = await response.json();

      if (data.mode === "ai_live") {
        setGenerateStatus("AI-generated LC method (live mode).");
      } else if (data.mode === "demo_fallback") {
        setGenerateStatus("Demo fallback method (no AI quota / AI error).");
      } else {
        setGenerateStatus("");
      }

      const newResult: ExampleResult =
        data.result || buildExampleResult(drugName);
      setResult(newResult);

      const newCert: Certificate = {
        methodId: `LCF-DEMO-${Date.now().toString(36).toUpperCase()}`,
        timestamp: Date.now(),
        fingerprint: buildFingerprint({
          drug: drugName || "Drug",
          column: newResult.method.column,
          instrument: instrument || technique,
          email: email || "email@demo.local",
        }),
      };
      setCertificate(newCert);

      setGenerateStatus("Backend generation completed.");
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Error connecting to backend.");
      setGenerateStatus("Error contacting LCForge backend. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function testGenerateFromBackend() {
    try {
      setGenerateStatus("Quick health check...");
      const res = await fetch(`${backendUrl}/health`);
      const data = await res.json();
      setGenerateStatus(`Health: ${data.status} - ${data.message}`);
    } catch (err) {
      console.error(err);
      setGenerateStatus("Error calling /health");
    }
  }

  function handleDownloadPdf() {
    if (!result || !certificate) return;
    if (!paymentConfirmed) {
      alert("Please confirm payment before downloading the demo PDF.");
      return;
    }

    try {
      setIsPdfGenerating(true);

      generateMethodPdf({
        drug: drugName || "Drug",
        scientistName: scientistName || "Scientist (demo)",
        email: email || "email@demo.local",
        company: company || "Organization (demo)",
        instrument: instrument || technique,
        methodId: certificate.methodId,
        timestamp: String(certificate.timestamp),
        fingerprint: certificate.fingerprint,
        column: result.method.column,
        mobilePhase: result.method.mobilePhase,
        flowRate: result.method.flowRate,
        detection: result.method.detection,
        runtime: result.method.runtime,
      });
    } finally {
      setIsPdfGenerating(false);
    }
  }

  return (
    <div className="page">
      <div>
        <section className="hero">
          <div className="hero-grid">
            <div className="hero-text">
              <div className="pill">LCForge AI · Demo</div>
              <h1>
                AI‑assisted LC method design for{" "}
                <span className="highlight">real‑world pharma labs</span>
              </h1>
              <p className="hero-subtitle">
                LCForge AI helps pharmaceutical scientists design robust HPLC and
                LC‑MS methods by combining Quality by Design (QbD) principles
                with White Analytical Chemistry (WAC) and Workflow‑Targeted
                Chromatography (WTC), starting from your molecule and existing
                literature and data.
              </p>

              {/* CARD: note */}
              <div className="hero-card">
                <p className="hero-note">
                  LCForge is running with a test backend. AI is in demo mode and
                  suggestions are illustrative only, not validated for real‑world
                  decisions.
                </p>
              </div>

              {/* CARD: form wrapper */}
              <div className="hero-card">
                <h2>Describe your chromatographic need</h2>
                <p className="hero-card-subtitle">
                  Provide basic details about your molecule and context. LCForge AI
                  will propose a starting LC/HPLC/LC‑MS method and a demo
                  certificate for internal communication.
                </p>

                <form className="hero-form" onSubmit={handleGenerate}>
                  <div className="form-group">
                    <label>Drug / analyte name</label>
                    <input
                      type="text"
                      value={drugName}
                      onChange={(e) => setDrugName(e.target.value)}
                      placeholder="e.g., Atorvastatin, Metformin, custom NCE"
                      required
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Sample type</label>
                      <select
                        value={sampleType}
                        onChange={(e) =>
                          setSampleType(
                            e.target.value as (typeof sampleTypes)[number]
                          )
                        }
                      >
                        {sampleTypes.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Technique</label>
                      <select
                        value={technique}
                        onChange={(e) =>
                          setTechnique(
                            e.target.value as (typeof techniques)[number]
                          )
                        }
                      >
                        {techniques.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Scientist / analyst</label>
                      <input
                        type="text"
                        value={scientistName}
                        onChange={(e) => setScientistName(e.target.value)}
                        placeholder="Your name"
                      />
                    </div>
                    <div className="form-group">
                      <label>Company / lab</label>
                      <input
                        type="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="Organization (demo)"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Work email (demo)</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="email@demo.local"
                      />
                    </div>
                    <div className="form-group">
                      <label>Instrument / platform</label>
                      <input
                        type="text"
                        value={instrument}
                        onChange={(e) => setInstrument(e.target.value)}
                        placeholder="e.g., Agilent 1260, Waters UPLC, Sciex LC‑MS"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="primary-button"
                    disabled={isLoading}
                  >
                    {isLoading ? "Generating..." : "Generate demo LC method"}
                  </button>

                  {isLoading && (
                    <p style={{ color: "#555", marginTop: "8px" }}>
                      Generating methods, please wait...
                    </p>
                  )}

                  {errorMessage && (
                    <p style={{ color: "red", marginTop: "8px" }}>
                      {errorMessage}
                    </p>
                  )}

                  {generateStatus && (
                    <p className="text-xs text-slate-600 mt-2 text-center">
                      {generateStatus}
                    </p>
                  )}
                </form>
              </div>
            </div>
          </div>
        </section>
      </div>
      {result && (
        <>
          {certificate && (
            <section style={{ marginTop: "1.5rem" }}>
              <div className="certificate-card">
                <label
                  className="small-muted"
                  style={{ display: "block", marginBottom: "0.5rem" }}
                >
                  <input
                    type="checkbox"
                    checked={paymentConfirmed}
                    onChange={(e) => setPaymentConfirmed(e.target.checked)}
                    style={{ marginRight: "0.5rem" }}
                  />
                  I confirm that demo payment has been made.
                </label>

                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="primary-button"
                  disabled={!paymentConfirmed || isPdfGenerating}
                >
                  {isPdfGenerating ? "Preparing PDF..." : "Download Method as PDF (demo)"}
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
                  <dd>{result.method.column}</dd>
                </div>
                <div>
                  <dt>Mobile phase</dt>
                  <dd>{result.method.mobilePhase}</dd>
                </div>
                <div>
                  <dt>Flow rate</dt>
                  <dd>{result.method.flowRate}</dd>
                </div>
                <div>
                  <dt>Detection</dt>
                  <dd>{result.method.detection}</dd>
                </div>
                <div>
                  <dt>Run time</dt>
                  <dd>{result.method.runtime}</dd>
                </div>
              </dl>
              <p className="small-muted">{result.method.notes}</p>
              {generateStatus && (
                <p className="text-xs text-slate-600 mt-2 text-center">
                  {generateStatus}
                </p>
              )}
            </div>

            <div className="result-card">
              <h3>Key Literature (demo)</h3>
              <ul>
                {result.literature.map((lit, idx) => (
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
              <h3>Physicochemical snapshot (demo)</h3>
              <dl>
                <div>
                  <dt>logP (approx.)</dt>
                  <dd>{result.properties.logP}</dd>
                </div>
                <div>
                  <dt>pKa (representative)</dt>
                  <dd>{result.properties.pKa}</dd>
                </div>
                <div>
                  <dt>Solubility (qualitative)</dt>
                  <dd>{result.properties.solubility}</dd>
                </div>
              </dl>
              <p className="small-muted">
                These are illustrative demo values only and must not be used for
                regulatory submissions or real‑world decisions.
              </p>
            </div>
          </section>
        </>
      )}
      <p className="text-xs text-slate-500 text-center mt-8">
        Backend status: {backendStatus}
      </p>
    </div>
  );
}

export default Home;