// server/config.js
// No dotenv here – server.js already called dotenv.config({ path: "./server/.env" })

const NODE_ENV = process.env.NODE_ENV || "development";
const MODE_FLAG = process.env.LCFORGE_MODE || "demo_fallback"; // demo_fallback | ai_live

export const config = {
  env: NODE_ENV,
  mode: MODE_FLAG,
  isProd: NODE_ENV === "production",
  isDev: NODE_ENV !== "production",
  version: "0.3.0",

  // Keys (using your current names)
  openaiApiKey: process.env.OPENAI_API_KEY || "",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
  stripePriceIdSolo: process.env.STRIPE_SOLO_PRICE_ID || "",

  // URLs
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  backendUrl: process.env.BACKEND_URL || "http://localhost:5000",

  // Limits
  freeLimitPerMonth: Number(process.env.FREE_LIMIT_PER_MONTH || 3),
};