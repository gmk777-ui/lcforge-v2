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

export default function Home() {
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
  const [alreadyGeneratedWarning, setAlreadyGeneratedWarning] = useState("");
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [isPaidDemo, setIsPaidDemo] = useState(false);

  function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    const newResult = buildExampleResult(drugName);
    if (result) {
      setAlreadyGeneratedWarning(
        "You already have a generated demo method below. This tool is currently static – generating again will not change the demo output."
      );
    } else {
      setAlreadyGeneratedWarning("");
    }
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
  }

  function handleDownloadPdf() {
    if (!result || !certificate) return;
    generateMethodPdf({
      method: result.method,
      literature: result.literature,
      properties: result.properties,
      certificate,
      context: {
        drugName: drugName || "Drug",
        scientistName: scientistName || "Scientist (demo)",
        company: company || "Organization (demo)",
        email: email || "email@demo.local",
        instrument: instrument || technique,
      },
    });
  }

  return (
    <div className="page">
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
              LC‑MS methods by combining Quality by Design (QbD) principles with
              White Analytical Chemistry (WAC) and Workflow‑Targeted
              Chromatography (WTC), starting from your molecule and existing
              literature and data.
            </p>

            <div className="hero-pills">
              <div className="pill">
                QbD‑first LC method thinking (demo)
              </div>
              <div className="pill">Automated knowledge extraction</div>
              <div className="pill">White Analytical Chemistry framing</div>
              <div className="pill">Exportable PDF method fingerprints</div>
            </div>

            <p className="hero-note">
              This is a static front‑end demo – no real API calls or
              proprietary data are used. All suggestions are illustrative only.
            </p>
          </div>

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
                      setSampleType(e.target.value as (typeof sampleTypes)[number])
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
                      setTechnique(e.target.value as (typeof techniques)[number])
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

              <button type="submit" className="primary-button">
                Generate demo LC method
              </button>

              {alreadyGeneratedWarning && (
                <p className="small-muted" style={{ color: "#f97373" }}>
                  {alreadyGeneratedWarning}
                </p>
              )}
            </form>
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
                    <dd>
                      {new Date(certificate.timestamp).toLocaleString()}
                    </dd>
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
                    This payment section is for demonstration only. The UPI
                    details shown are examples, and no actual payment can or
                    will be processed through this interface.
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
                    After completing payment in your UPI app, tick the box
                    below to unlock PDF download (demo only, no server
                    verification).
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
              <h3>Physicochemical snapshot (demo)</h3>
              <dl>
                <div>
                  <dt>logP (approx.)</dt>
                  <dd>{result!.properties.logP}</dd>
                </div>
                <div>
                  <dt>pKa (representative)</dt>
                  <dd>{result!.properties.pKa}</dd>
                </div>
                <div>
                  <dt>Solubility (qualitative)</dt>
                  <dd>{result!.properties.solubility}</dd>
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
      <section id="about" className="static-section">
        <h2>About LCForge AI</h2>
        <p>
          LCForge AI was founded by Dr. Mani Kumar, who holds a doctorate in Pharmacy
          in Pharmaceutical Analysis with a focus on chromatography. He has extensive
          collaboration with research and industry in impurity profiling, method
          development, and stability studies using HPLC, preparative HPLC, and LC‑MS,
          alongside many years of teaching experience at university level.
        </p>
        <p>
          Drawing on this deep chromatography background and a passion for innovation,
          LCForge AI was created as an AI‑driven assistant to propose new LC methods
          based on Quality by Design (QbD) principles and White Analytical Chemistry
          (WAC). The goal is to guide scientists toward robust, precise, and accurate
          methods that reduce chemical consumption, analyst effort, and environmental
          impact.
        </p>
        <p>
          By comparing existing methods for a given drug and emphasizing greener
          solvents and optimized flow rates, LCForge AI aims to suggest unique,
          documentation‑ready methods that can support regulatory submissions such as
          NDAs and ANDAs, while keeping expert chromatographic judgment at the center.
        </p>
      </section>
      <section id="contact" className="static-section">
        <h2>Contact</h2>
        <p>
          For collaboration, feedback, or questions about LCForge AI, you can reach
          Dr. Mani Kumar at:
        </p>
        <p>
          <strong>Mobile:</strong> +91 86249 58770<br />
          <strong>Email:</strong> LCforgeAI@outlook.com
        </p>
        <p>
          <strong>Demo payment details (UPI):</strong> 9492508770@apl
          <br />
          These payment details are currently used for demonstration and testing
          within the LCForge AI prototype.
        </p>
      </section>
    </div>
  );
}
