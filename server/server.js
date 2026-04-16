// require('dotenv').config();
// console.log('ENV OPENAI_API_KEY raw:', process.env.OPENAI_API_KEY);

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health route
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'LCForge backend is running - AI ready' });
});

app.post("/api/generate", async (req, res) => {
    const { drugName = "Drug", sampleType = "API", technique = "HPLC", constraints = "" } = req.body || {};

    // 1) Fallback demo result (same structure as frontend expects)
    const fallbackName = drugName || "Drug";
    const fallbackResult = {
        method: {
            title: `Draft HPLC Method for ${fallbackName} (Demo Fallback)`,
            column: "C18, 150 × 4.6 mm, 5 µm",
            mobilePhase: "Acetonitrile : 0.1% formic acid (60:40, v/v)",
            flowRate: "1.0 mL/min",
            detection: "UV at 240 nm",
            runtime: "10 min",
            notes: `Demo fallback for ${fallbackName}. Live AI uses QbD + literature for custom methods.`,
        },
        literature: [
            {
                title: `RP‑HPLC method for ${fallbackName}`,
                journal: "Journal of Pharmaceutical Analysis",
                year: 2019,
            },
            {
                title: `Stability‑indicating LC method for ${fallbackName}`,
                journal: "International Journal of Pharm Sci",
                year: 2021,
            },
        ],
        properties: {
            logP: `≈ 3.0 (demo for ${fallbackName})`,
            pKa: `Example pKa ≈ 8-10 (demo)`,
            solubility: "Sparingly soluble in water (demo).",
        },
    };

    let aiResult = null;
    let mode = "demo_fallback";
    let completion = null;

    try {
        // 2) Real OpenAI GPT-4.1 call - structured for LCForge pharma methods
        completion = await openai.chat.completions.create({
            model: "gpt-4.1",  // Or "gpt-4.1-mini" for cost savings on simple cases
            temperature: 0.1,  // Low for reproducible, reliable science outputs
            max_tokens: 1500,
            messages: [
                {
                    role: "system",
                    content: `You are LCForge AI, a QbD-first expert for HPLC/LCMS method development. 
Output ONLY valid JSON matching this exact schema: 
{
  "method": {
    "title": "Short title e.g. 'QbD HPLC for [Drug] in [Matrix]'",
    "column": "e.g. C18, 150x4.6mm, 5µm",
    "mobilePhase": "e.g. ACN:0.1% TFA (55:45 v/v)",
    "flowRate": "e.g. 1.0 mL/min",
    "detection": "e.g. UV 254nm or MS ESI+",
    "runtime": "e.g. 12 min",
    "notes": "QbD rationale, risks, design space (50 words max)"
  },
  "literature": [
    {
      "title": "Real paper title",
      "journal": "Journal name",
      "year": 2023
    }
  ] (2-3 relevant papers),
  "properties": {
    "logP": "e.g. 2.8",
    "pKa": "e.g. 7.2 / 9.1",
    "solubility": "e.g. 0.1 mg/mL in pH 7.4"
  }
}
Prioritize: QbD (CMA, CPP, CQA), stability-indicating, ICH Q2(R1) validation-ready. Base on real literature/web knowledge for [drugName].`
                },
                {
                    role: "user",
                    content: `Generate method for: Drug=${drugName}, Sample=${sampleType}, Technique=${technique}. Constraints: ${constraints}.`
                }
            ],
        });

        const rawContent = completion.choices[0]?.message?.content;
        if (rawContent) {
            // Parse JSON from response (handles minor formatting issues)
            const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                aiResult = JSON.parse(jsonMatch[0]);
                // Ensure exact structure - fallback if invalid
                if (aiResult.method && aiResult.literature && aiResult.properties) {
                    mode = "ai_live";
                }
            }
        }

    } catch (err) {
        // 3) Robust error handling
        const code = err?.code || err?.error?.code || err?.status;
        console.error("AI Error in /api/generate:", code || err.message);

        if (code === "insufficient_quota" || code === "rate_limit_exceeded" || code === 429) {
            mode = "quota_exceeded";  // Frontend can show "Upgrade for more"
        } else if (code === "invalid_api_key" || code === 401) {
            mode = "api_key_invalid";  // Check .env
        }
        // All errors fallback to demo
    }

    const result = aiResult || fallbackResult;

    return res.json({
        status: "ok",
        mode,
        result,
        meta: {
            drugName,
            sampleType,
            technique,
            backendVersion: "0.3-ai-live",
            plan: "free", // we will later switch to "pro"
            tokens: completion?.usage || null,  // Optional: track costs
        },
    });
});

app.listen(PORT, () => {
    console.log('LCForge Server running on port', PORT, '- AI integrated');
});