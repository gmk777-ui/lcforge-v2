import { useEffect, useState } from "react";
import { getUsedMethods, incrementUsedMethods } from "../utils/freeLimit";
import { generateMethodPdf } from "../utils/pdfGenerator";

function buildExampleResult(drug: string) {
  const name = drug || "Drug";
  return {
    method: {
      title: `Draft HPLC method for ${name}`,
      column: "C18, 150 × 4.6 mm, 5 µm",
      mobilePhase: "Acetonitrile : 0.1% formic acid (60:40, v/v)",
      flowRate: "1.0 mL/min",
      detection: "UV at 240 nm",
      runtime: "10 min",
      notes: `Early access interface – example LC conditions for ${name}. Not for clinical‑diagnostic use.`,
    },
    literature: [
      {
        title: `RP‑HPLC method for ${name} in tablets`,
        journal: "Journal of Pharmaceutical Analysis",
        year: 2019,
      },
      {
        title: `Stability‑indicating LC method for ${name}`,
        journal: "International Journal of Pharm Sci",
        year: 2021,
      },
    ],
    properties: {
      logP: `≈ 3.0 (approximate for ${name})`,
      pKa: `Representative basic pKa for ${name}`,
      solubility:
        "Example statement: sparingly soluble in water (illustrative – not measured).",
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
  const [freeLimit, setFreeLimit] = useState<number>(3);
  const [used, setUsed] = useState<number>(0);
  const [limitReached, setLimitReached] = useState<boolean>(false);
  const [limitMessage, setLimitMessage] = useState<string>("");
  useEffect(() => {
    // Check backend health
    fetch(`${backendUrl}/health`)
      .then((res) => res.json())
      .then((health) => {
        // health is structured: { status, mode, result, meta }
        const msg =
          health && health.result && health.result.message
            ? health.result.message
            : "LCForge backend is running";
        setBackendStatus(`${health.status} - ${msg}`);

        // If backend sends freeLimit in meta, use that
        if (health.meta && typeof health.meta.freeLimit === "number") {
          setFreeLimit(health.meta.freeLimit);
        }

        // Initialize used from localStorage whenever freeLimit might change
        const count = getUsedMethods();
        setUsed(count);
        if (count >= (health.meta?.freeLimit ?? freeLimit)) {
          setLimitReached(true);
          setLimitMessage(
            `You’ve reached your free limit of ${health.meta?.freeLimit ?? freeLimit} methods this month. Please contact us for extended access.`
          );
        }
      })
      .catch((err) => {
        console.error(err);
        setBackendStatus("Error connecting to backend");

        // Initialize used from localStorage even if health fails
        const count = getUsedMethods();
        setUsed(count);
        if (count >= freeLimit) {
          setLimitReached(true);
          setLimitMessage(
            `You’ve reached your free limit of ${freeLimit} methods this month. Please subscribe to continue.`
          );
        }
      });
  }, [backendUrl, freeLimit]);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();

    // 1) Enforce limit before calling backend
    if (used >= freeLimit) {
      setLimitReached(true);
      setLimitMessage(
        `You’ve reached your free limit of ${freeLimit} methods this month. Please subscribe to continue.`
      );
      return;
    }

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

      // 2) Update freeLimit from backend meta if present
      let effectiveFreeLimit = freeLimit;
      if (data && data.meta && typeof data.meta.freeLimit === "number") {
        setFreeLimit(data.meta.freeLimit);
        effectiveFreeLimit = data.meta.freeLimit;
      }

      // 3) Update plan from backend meta (your existing logic)
      if (data && data.meta && data.meta.plan) {
        setPlan(data.meta.plan);
      }

      // 4) Store the method result (existing logic)
      if (data.result) {
        setResult(data.result);

        const methodId = data.result.methodId || "LCF-METHOD";

        const fingerprint = buildFingerprint({
          drug: drugName || "Drug",
          column: data.result.method?.column || "Column",
          instrument: instrument || technique,
          email: email || "scientist@example.com",
        });

        setCertificate({
          methodId,
          timestamp: Date.now(),
          fingerprint,
        });
      }

      // 5) Increment local usage after a successful generation
      const next = incrementUsedMethods();
      setUsed(next);

      if (next >= (data.meta?.freeLimit ?? freeLimit)) {
        setLimitReached(true);
        setLimitMessage(
          `You’ve reached your free limit of ${data.meta?.freeLimit ?? freeLimit
          } methods this month. Please subscribe to continue.`
        );
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Error generating method");
    } finally {
      setIsLoading(false);
    }
  }
  function handleDownloadPdf() {
    if (!result || !certificate) return;

    if (!paymentConfirmed) {
      alert("Please confirm payment before downloading the PDF.");
      return;
    }

    setIsPdfGenerating(true);

    try {
      generateMethodPdf({
        drug: drugName || "Drug",
        scientistName: scientistName || "Scientist",
        email: email || "email@example.com",
        company: company || "Company",
        instrument: instrument || "Instrument",
        methodId: certificate.methodId,
        timestamp: String(certificate.timestamp),
        fingerprint: certificate.fingerprint,
        column: result.method?.column || "",
        mobilePhase: result.method?.mobilePhase || "",
        flowRate: result.method?.flowRate || "",
        detection: result.method?.detection || "",
        runtime: result.method?.runtime || "",
      });
    } catch (err) {
      console.error("PDF generation error", err);
      // Optionally: set a UI message state here.
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
                  LCForge is an AI‑assisted LC method design tool intended for research and educational use. Outputs are starting points that must be reviewed, refined and validated in your own lab; they are not diagnostic or clinical recommendations.
                </p>
              </div>

              {/* CARD: form wrapper */}
              <div className="hero-card">
                <h2>Describe your chromatographic need</h2>
                <p className="hero-card-subtitle">
                  Provide basic details about your molecule and context. LCForge AI proposes a starting LC/HPLC/LC‑MS method, and each run includes a digitally signed LCForge certificate with a unique fingerprint for your records.
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
                        placeholder="Organization"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Work email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@lab-or-company.com"
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

                  {/* Free usage info */}
                  <p className="small-muted" style={{ marginTop: "0.5rem" }}>
                    Trial uses this month: {used}/{freeLimit}
                  </p>

                  {limitReached && (
                    <p style={{ color: "red", marginTop: "4px", fontWeight: 500 }}>
                      {limitMessage}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="primary-button"
                    disabled={isLoading || limitReached}
                  >
                    {isLoading ? "Generating..." : "Generate AI method"}
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
                  Key AI‑generated notes about the molecule, matrix and chromatographic behavior.
                </p>
                <pre className="result-pre">
                  {result.physicochemicalSummary ||
                    "Physicochemical summary from AI will appear here."}
                </pre>
              </div>

              {/* Card 2: Suggested LC method */}
              <div className="result-card">
                <h3>Suggested LC method</h3>
                <p className="small-muted">
                  AI‑proposed column, mobile phase, flow, detection and runtime as a starting point for your lab optimization.
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
                  Relevant literature hints, prior method patterns and risk‑based QbD/WAC considerations for further method development.
                </p>
                <pre className="result-pre">
                  {result.literatureSummary ||
                    result.qbdNotes ||
                    "Literature / QbD notes from AI will appear here."}
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