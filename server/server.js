import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
console.log("Using .env from:", process.cwd() + "/.env");

import express from "express";
import cors from "cors";
import OpenAI from "openai";
import Stripe from "stripe";
import rateLimit from "express-rate-limit";
import Razorpay from "razorpay";
import crypto from "crypto";

import { config } from "./config.js";
import { ok, fail } from "./responseHelpers.js";

console.log("CONFIG Stripe:", {
  secretFromConfig: config.stripeSecretKey ? "set" : "empty",
  priceFromConfig: config.stripePriceIdSolo,
});

console.log("Stripe key present:", !!process.env.STRIPE_SECRET_KEY);
console.log("Solo price id:", process.env.STRIPE_SOLO_PRICE_ID);
console.log("OpenAI key present:", !!process.env.OPENAI_API_KEY);

// Optional: helper for future timeout wrapping (not used yet)
function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`OpenAI request timed out after ${ms}ms`));
    }, ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

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

// Razorpay client
const razorpay =
  process.env.RAZORPAY_KEY_ID &&
  process.env.RAZORPAY_KEY_SECRET &&
  new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
console.log("Razorpay keys present:", !!process.env.RAZORPAY_KEY_ID, !!process.env.RAZORPAY_KEY_SECRET);

const app = express();
const PORT = process.env.PORT || 5000;
console.log("Raw RAZORPAY_KEY_ID:", JSON.stringify(process.env.RAZORPAY_KEY_ID));
console.log("Raw RAZORPAY_KEY_SECRET:", JSON.stringify(process.env.RAZORPAY_KEY_SECRET));
console.log(
  "Razorpay keys present:",
  !!process.env.RAZORPAY_KEY_ID,
  !!process.env.RAZORPAY_KEY_SECRET
);
// CORS: allow lcforgeai.online and local dev
const allowedOrigins = [
  "https://lcforgeai.online",
  "http://localhost:5173",
];

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser tools like curl/Postman (no Origin header)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
  })
);

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

// Conservative rate limit for method generation
const generateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 generate calls per IP per 15 minutes (adjust later)
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "error",
    result: null,
    meta: {
      error:
        "API rate limit exceeded for method generation. Please try again later.",
    },
  },
});

app.post("/api/generate", generateLimiter, async (req, res) => {
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

  // Decide which result to send back
  const finalResult = aiResult || fallbackResult;

  return ok(
    res,
    {
      ...finalResult,
      methodId: `LCF-${Date.now()}`,
    },
    {
      mode,
      freeLimit: config.freeLimit || 3,
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
    const stripeSecret = process.env.STRIPE_SECRET_KEY || "";
    const soloPriceId = process.env.STRIPE_SOLO_PRICE_ID || "";
    const frontendUrl = process.env.FRONTEND_URL || config.frontendUrl;

    console.log("DEBUG Stripe runtime:", {
      secret: stripeSecret ? "set" : "empty",
      soloPrice: soloPriceId,
    });

    if (!stripeSecret || !soloPriceId) {
      return fail(res, "Stripe is not configured", { code: "NO_STRIPE" }, 500);
    }

    const stripeClient = new Stripe(stripeSecret, {
      apiVersion: "2022-11-15",
    });

    const session = await stripeClient.checkout.sessions.create({
      mode: "subscription",
      customer_email: email,
      line_items: [
        {
          price: soloPriceId,
          quantity: 1,
        },
      ],
      success_url: `${frontendUrl}/pricing?checkout=success`,
      cancel_url: `${frontendUrl}/pricing?checkout=cancel`,
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

// ====== Razorpay order + verify routes ======
app.post("/api/razorpay/create-order", async (req, res) => {
  try {
    if (!razorpay) {
      return fail(res, "Razorpay is not configured", { code: "NO_RAZORPAY" }, 500);
    }

    const { amountInInr } = req.body || {};

    if (!amountInInr || amountInInr < 1) {
      return fail(res, "Invalid amount", { code: "BAD_AMOUNT" }, 400);
    }

    const options = {
      amount: amountInInr * 100, // paise
      currency: "INR",
      receipt: "lcforge_" + Date.now(),
    };

    const order = await razorpay.orders.create(options);

    return ok(
      res,
      {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
      },
      { provider: "razorpay" }
    );
  } catch (err) {
    console.error("Razorpay create-order error", err);
    return fail(res, "Failed to create Razorpay order", {
      code: "RAZORPAY_ORDER_ERROR",
      detail: err.message,
    });
  }
});

app.post("/api/razorpay/verify", (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body || {};

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return fail(res, "Missing Razorpay fields", { code: "MISSING_FIELDS" }, 400);
    }

    const secret = process.env.RAZORPAY_KEY_SECRET || "";
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      return ok(res, { success: true }, { provider: "razorpay" });
    } else {
      return fail(res, "Signature mismatch", { code: "BAD_SIGNATURE" }, 400);
    }
  } catch (err) {
    console.error("Razorpay verify error", err);
    return fail(res, "Error verifying Razorpay payment", {
      code: "RAZORPAY_VERIFY_ERROR",
      detail: err.message,
    });
  }
});
app.listen(PORT, () => {
  console.log(
    `LCForge Server running on port ${PORT} - AI integrated - mode=${config.mode}, env=${config.env}`
  );
});