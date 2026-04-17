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
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "https://lcforge-v2.onrender.com";

  console.log("LCForge backendUrl at startup:", backendUrl);

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
  const [plan, setPlan] = useState<"free" | "pro" | null>(null);
  const [generateStatus, setGenerateStatus] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  useEffect(() => {
    fetch(`${backendUrl}/health`)
      .then((res) => res.json())
      .then((health) => {
        setBackendStatus(`${health.status} - ${health.message}`);
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
          constraints: "",
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Backend error: ${response.status} ${text}`);
      }

      const data = await response.json();

      // Update plan from backend meta
      if (data && data.meta && data.meta.plan) {
        setPlan(data.meta.plan);
      }

      // Store the method result (adjust if your shape is different)
      if (data.result) {
        setResult(data.result);

        const methodId = data.result.methodId || "DEMO-METHOD";

        const fingerprint = buildFingerprint({
          drug: drugName || "Drug",
          column: data.result.method?.column || "Column",
          instrument: instrument || technique,
          email: email || "email@demo.local",
        });

        setCertificate({
          methodId,
          timestamp: Date.now(),
          fingerprint,
        });
      }

      // Update generate status based on mode
      if (data.mode === "ai_live") {
        setGenerateStatus("AI‑generated LC method.");
      } else if (data.mode === "demo_fallback") {
        setGenerateStatus("Fallback template method (AI temporarily unavailable).");
      }

      setBackendStatus("Backend is reachable and responding.");
    } catch (error: any) {
      console.error("Error contacting LCForge backend:", error);
      setGenerateStatus("Error contacting LCForge backend. Please try again.");
      setBackendStatus("Error connecting to backend");
    } finally {
      setIsLoading(false);
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
              <div className="pill">LCForge AI</div>
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
          {/* 3 result cards */}
          <section style={{ marginTop: "1.5rem" }}>
            <div className="result-grid">
              {/* Card 1: Physico‑chemical summary */}
              <div className="result-card">
                <h3>Physico‑chemical summary</h3>
                <p className="small-muted">
                  Key information about the molecule and matrix.
                </p>
                <pre className="result-pre">
                  {result.physicochemicalSummary ||
                    "Physicochemical summary will appear here based on the AI output."}
                </pre>
              </div>

              {/* Card 2: Suggested LC method */}
              <div className="result-card">
                <h3>Suggested LC method</h3>
                <p className="small-muted">
                  Column, mobile phase, flow rate, detection and runtime.
                </p>
                <pre className="result-pre">
                  {result.methodSummary ||
                    `Column: ${result.method?.column || "N/A"}
Mobile phase: ${result.method?.mobilePhase || "N/A"}
Flow rate: ${result.method?.flowRate || "N/A"}
Detection: ${result.method?.detection || "N/A"}
Runtime: ${result.method?.runtime || "N/A"}`}
                </pre>
              </div>

              {/* Card 3: Literature / WAC / QbD notes */}
              <div className="result-card">
                <h3>Literature & QbD notes</h3>
                <p className="small-muted">
                  Relevant articles, prior methods and risk‑based considerations.
                </p>
                <pre className="result-pre">
                  {result.literatureSummary ||
                    result.qbdNotes ||
                    "Literature / QbD notes will appear here based on the AI output."}
                </pre>
              </div>
            </div>
          </section>

          {/* Certificate + payment + PDF button */}
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
                I confirm that payment has been made.
              </label>

              <button
                type="button"
                onClick={handleDownloadPdf}
                className="primary-button"
                disabled={!paymentConfirmed || !certificate || isPdfGenerating}
              >
                {isPdfGenerating
                  ? "Preparing PDF..."
                  : "Download Method as PDF"}
              </button>
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