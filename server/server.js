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
    res.json({ status: 'ok', message: 'LCForge backend is running' });
});

app.post("/api/generate", async (req, res) => {
    const { drugName = "Drug", sampleType = "API", technique = "HPLC" } =
        req.body || {};

    // 1) Fallback demo result (same structure as frontend buildExampleResult)
    const fallbackName = drugName || "Drug";
    const fallbackResult = {
        method: {
            title: `Draft HPLC Method for ${fallbackName} (Backend Demo Fallback)`,
            column: "C18, 150 × 4.6 mm, 5 µm",
            mobilePhase: "Acetonitrile : 0.1% formic acid (60:40, v/v)",
            flowRate: "1.0 mL/min",
            detection: "UV at 240 nm",
            runtime: "10 min",
            notes: `Static backend demo output – example LC conditions for ${fallbackName}. Not validated or stability‑indicating.`,
        },
        literature: [
            {
                title: `RP‑HPLC method for ${fallbackName} in tablets (backend demo)`,
                journal: "Journal of Pharmaceutical Analysis",
                year: 2019,
            },
            {
                title: `Stability‑indicating LC method for ${fallbackName} (backend demo)`,
                journal: "International Journal of Pharm Sci",
                year: 2021,
            },
        ],
        properties: {
            logP: `≈ 3.0 (approximate for ${fallbackName}, backend demo)`,
            pKa: `Representative basic pKa for ${fallbackName} (backend demo)`,
            solubility:
                "Example statement: sparingly soluble in water (backend demo – not measured).",
        },
    };

    let aiResult = null;
    let mode = "demo_fallback";

    try {
        // 2) Try OpenAI (or your AI backend) here.
        // Pseudocode – replace with your actual OpenAI call:
        //
        // const openaiResponse = await openai.chat.completions.create({ ... });
        // aiResult = transformOpenAiToResult(openaiResponse);
        //
        // If successful:
        // mode = "ai_live";

        // For now, we leave aiResult as null so demo_fallback is used.
        // When you plug in OpenAI, set aiResult and mode as described above.

    } catch (err) {
        // 3) Error handling: quota / network / generic
        const code = err?.code || err?.error?.code;
        console.error("Error in /api/generate:", code || err.message || err);

        // If you want to treat specific OpenAI errors specially:
        // if (code === "insufficient_quota" || code === "rate_limit_exceeded") {
        //   mode = "demo_fallback";
        // } else {
        //   mode = "demo_fallback";
        // }
        // In all cases we fall back to demo for now.
    }

    const result = aiResult || fallbackResult;
    if (aiResult) {
        mode = "ai_live";
    } else {
        mode = "demo_fallback";
    }

    return res.json({
        status: "ok",
        mode,
        result,
        meta: {
            drugName: drugName || "Drug",
            sampleType,
            technique,
            backendVersion: "0.3-demo",
        },
    });
});

app.listen(PORT, () => {
    console.log('Server running on port', PORT);
});