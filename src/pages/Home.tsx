import { useState } from "react";

type ExampleResult = ReturnType<typeof buildExampleResult>;

const sampleTypes = ["API", "Pharmaceutical formulation", "Plasma / biological"] as const;
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
      notes: `Static demo output only – example LC conditions for ${name}. Not validated or stability‑indicating.`
    },
    literature: [
      {
        title: `RP‑HPLC method for ${name} in tablets (demo)`,
        journal: "Journal of Pharmaceutical Analysis",
        year: 2019
      },
      {
        title: `Stability‑indicating LC method for ${name} (demo)`,
        journal: "International Journal of Pharm Sci",
        year: 2021
      }
    ],
    properties: {
      logP: `≈ 3.0 (approximate for ${name}, demo)`,
      pKa: `Representative basic pKa for ${name} (demo)`,
      solubility: `Example statement: sparingly soluble in water (demo – not measured).`
    }
  };
}

function buildFingerprint(data: {
  drug: string;
  column: string;
  instrument: string;
  email: string;
}) {
  const raw = `${data.drug}|${data.column}|${data.instrument}|${data.email}`;
  // Simple demo hash: in future we can replace with real SHA-256
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
  const [sampleType, setSampleType] = useState<(typeof sampleTypes)[number]>("API");
  const [technique, setTechnique] = useState<(typeof techniques)[number]>("HPLC");
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
  const [alreadyGeneratedWarning, setAlreadyGeneratedWarning] = useState<string | null>(null);
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
      email: email || "anonymous@lcforge.local"
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

  return (
    <>
      <section className="hero">
        <div className="hero-text">
          <h1>Forge Robust Chromatography with AI</h1>
          <p>
            LCForge AI helps pharmaceutical scientists auto‑generate HPLC and LC‑MS analytical
            methods under Quality by Design and White Analytical Chemistry principles – from drug
            name to draft method in minutes.
          </p>
          <div className="pill-row">
            <span className="pill">HPLC · LC‑MS · LC‑MS/MS</span>
            <span className="pill">QbD &amp; White Analytical Chemistry</span>
            <span className="pill">Drug properties &amp; literature intelligence</span>
          </div>
          <p className="hero-note">
            This is a static demo UI – production LCForge AI would connect to live AI models,
            literature databases, and payment systems.
          </p>
        </div>

        <div className="card">
          <h2 className="card-title">Quick Drug Search (Demo)</h2>
          <p className="card-subtitle">
            Enter a drug and see a draft HPLC method, example literature, and properties.
          </p>

          <div className="field">
            <label>Scientist name</label>
            <input
              type="text"
              placeholder="Example: Dr. Mani Kumar"
              value={scientistName}
              onChange={(e) => setScientistName(e.target.value)}
            />
          </div>

          <div className="field-row">
            <div className="field">
              <label>Email</label>
              <input
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Company</label>
              <input
                type="text"
                placeholder="Example: ABC Pharma Ltd"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label>Designation</label>
              <input
                type="text"
                placeholder="Example: Sr. Scientist, Analytical R&amp;D"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Instrument type</label>
              <input
                type="text"
                placeholder="Example: Waters HPLC / UPLC / LC‑MS"
                value={instrument}
                onChange={(e) => setInstrument(e.target.value)}
              />
            </div>
          </div>

          <div className="field">
            <label>Column type</label>
            <input
              type="text"
              placeholder="Example: C18, 150 × 4.6 mm, 5 µm"
              value={columnType}
              onChange={(e) => setColumnType(e.target.value)}
            />
          </div>

          <div className="field">
            <label>Drug name</label>
            <input
              type="text"
              placeholder="Example: Metformin"
              value={drugName}
              onChange={(e) => setDrugName(e.target.value)}
            />
          </div>

          <div className="field-row">
            <div className="field">
              <label>Sample type</label>
              <select
                value={sampleType}
                onChange={(e) => setSampleType(e.target.value as (typeof sampleTypes)[number])}
              >
                {sampleTypes.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Technique</label>
              <select
                value={technique}
                onChange={(e) => setTechnique(e.target.value as (typeof techniques)[number])}
              >
                {techniques.map((t) => (
                  <option key={t} value={t}>
                    {t}
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

          <p className="small-muted">
            In a live system this would trigger AI‑driven method generation tuned to sample type
            and technique. Here it uses deterministic demo logic only.
          </p>

          <button className="primary-button" onClick={handleGenerate}>
            Generate Method (demo only)
          </button>
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
                  This chromatographic method is generated exclusively for the above user by LCForge
                  AI (demo). This method is confidential and reserved for the requesting organization.
                  Unauthorized reproduction or redistribution is discouraged.
                </p>
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
              <h3>Drug Properties (demo)</h3>
              <dl>
                <div>
                  <dt>logP</dt>
                  <dd>{result.properties.logP}</dd>
                </div>
                <div>
                  <dt>pKa</dt>
                  <dd>{result.properties.pKa}</dd>
                </div>
                <div>
                  <dt>Solubility</dt>
                  <dd>{result.properties.solubility}</dd>
                </div>
              </dl>
            </div>
          </section>
        </>
      )}
    </>
  );
}
