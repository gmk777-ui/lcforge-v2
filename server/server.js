import dotenv from "dotenv";
dotenv.config({ path: "./server/.env" });
console.log("Using .env from:", process.cwd() + "/server/.env");

import express from "express";
import cors from "cors";
import OpenAI from "openai";
import Stripe from "stripe";

import { config } from "./config.js";
import { ok, fail } from "./responseHelpers.js";

console.log("Stripe key present:", !!process.env.STRIPE_SECRET_KEY);
console.log("Solo price id:", process.env.STRIPE_SOLO_PRICE_ID);
console.log("OpenAI key present:", !!process.env.OPENAI_API_KEY);

// Stripe client (optional if no key)
const stripe =
  config.stripeSecretKey &&
  new Stripe(config.stripeSecretKey, {
    apiVersion: "2022-11-15",
  });

// Optional: OpenAI client (if you use it today)
const openai =
  config.openaiApiKey &&
  new OpenAI({
    apiKey: config.openaiApiKey,
  });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health route
app.get("/health", (req, res) => {
  return ok(
    res,
    { message: "LCForge backend is running - AI ready" },
    {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      hasOpenAIKey: !!config.openaiApiKey,
      hasStripeKey: !!config.stripeSecretKey,
    }
  );
});

app.post("/api/generate", async (req, res) => {
  const {
    drugName = "Drug",
    sampleType = "API",
    technique = "HPLC",
    constraints = "",
  } = req.body || {};

  // 1) Fallback result (same structure as frontend expects)
  const fallbackName = drugName || "Drug";
  const fallbackResult = {
    method: {
      title: `Draft HPLC method for ${fallbackName} (fallback)`,
      column: "C18, 150 × 4.6 mm, 5 µm",
      mobilePhase: "Acetonitrile : 0.1% formic acid (60:40, v/v)",
      flowRate: "1.0 mL/min",
      detection: "UV at 240 nm",
      runtime: "10 min",
      notes: `Fallback template for ${fallbackName}. Live AI uses QbD + literature for custom methods.`,
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
      logP: `≈ 3.0 (approximate for ${fallbackName})`,
      pKa: `Representative basic pKa for ${fallbackName}`,
      solubility:
        "Example statement: sparingly soluble in water (illustrative – not measured).",
    },
  };

  // Default mode and result
  let mode = config.mode; // demo_fallback or ai_live
  let aiResult = null;
  let completion = null;

  try {
    // If we are in demo_fallback, skip OpenAI entirely
    if (config.mode === "demo_fallback") {
      mode = "demo_fallback";
    } else {
      // 2) Real OpenAI GPT-4.1 call - plug in your existing logic here
      if (!config.openaiApiKey || !openai) {
        mode = "api_key_invalid";
      } else {
        // Example placeholder call; replace with your real one if needed
        completion = await openai.chat.completions.create({
          model: "gpt-4.1-mini",
          messages: [
            {
              role: "system",
              content:
                "You are an expert LC method development assistant. Return a single JSON object with keys method, literature, properties.",
            },
            {
              role: "user",
              content: `Develop an LC method for ${drugName}, sample type ${sampleType}, technique ${technique}, constraints: ${constraints}. Return JSON only.`,
            },
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
            } else {
              aiResult = null;
            }
          }
        }
      }
    }
  } catch (err) {
    // 3) Robust error handling
    console.error("OpenAI /generate error", err);

    // Try to decode useful error info
    const code =
      err?.error?.code ||
      err?.response?.status ||
      err?.status ||
      err?.code ||
      null;

    if (
      code === "insufficient_quota" ||
      code === "rate_limit_exceeded" ||
      code === 429
    ) {
      mode = "quota_exceeded"; // Frontend can show "Upgrade for more"
    } else if (code === "invalid_api_key" || code === 401) {
      mode = "api_key_invalid"; // Check .env
    }
    // All other errors fall through with default mode
  }

  const result = aiResult || fallbackResult;

  return ok(
    res,
    result,
    {
      drugName,
      sampleType,
      technique,
      backendVersion: "0.3-ai-live",
      plan: "free",
      freeLimit: config.freeLimitPerMonth,
      tokens: completion?.usage || null,
    }
  );
});

// ====== Stripe Checkout route (keep this after /api/generate) ======
app.post("/api/create-checkout-session", async (req, res) => {
  try {
    const { email } = req.body || {};

    if (!email) {
      return fail(res, "Email is required", { code: "NO_EMAIL" }, 400);
    }

    if (!stripe || !config.stripeSecretKey || !config.stripePriceIdSolo) {
      return fail(res, "Stripe is not configured", { code: "NO_STRIPE" }, 500);
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: email,
      line_items: [
        {
          price: config.stripePriceIdSolo,
          quantity: 1,
        },
      ],
      success_url: `${config.frontendUrl}/?checkout=success`,
      cancel_url: `${config.frontendUrl}/pricing?checkout=cancel`,
    });

    return ok(
      res,
      { id: session.id, url: session.url },
      {
        stripeMode: config.isProd ? "live" : "test",
      }
    );
  } catch (err) {
    console.error("Stripe checkout error", err);
    return fail(res, "Unable to create checkout session", {
      code: "STRIPE_ERROR",
      detail: err.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(
    `LCForge Server running on port ${PORT} - AI integrated - mode=${config.mode}, env=${config.env}`
  );
});