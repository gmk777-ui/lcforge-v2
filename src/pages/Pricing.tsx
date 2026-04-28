import { useEffect, useState } from "react";
import { createSoloCheckoutSession } from "../api";
const backendUrl =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export default function PricingPage() {
  console.log("LCForge backendUrl at startup:", backendUrl);
  console.log("VITE_BACKEND_URL from env:", import.meta.env.VITE_BACKEND_URL);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [checkoutStatus, setCheckoutStatus] = useState<string | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkoutParam = params.get("checkout");

    if (checkoutParam === "success") {
      setCheckoutStatus(
        "Solo subscription flow completed in Stripe test mode. No real payment was taken."
      );
    } else if (checkoutParam === "cancel") {
      setCheckoutStatus(
        "Checkout was cancelled. You can restart anytime from this page."
      );
    }
  }, []);
  async function handleSoloCheckout() {
    try {
      setCheckoutStatus(null);
      setIsCheckingOut(true);

      if (!email) {
        setCheckoutStatus(
          "Please enter your email to start the Solo subscription in Stripe test mode."
        );
        setIsCheckingOut(false);
        return;
      }

      const session = await createSoloCheckoutSession(email);

      // Redirect to Stripe Checkout
      window.location.href = session.url;
    } catch (err: any) {
      console.error(err);
      setCheckoutStatus(
        "We couldn’t start the checkout session. Please try again in a moment."
      );
    } finally {
      setIsCheckingOut(false);
    }
  }

  return (
    <section className="pricing">
      <h1>Pricing & Plans</h1>
      <p className="pricing-intro">
        Start with free AI‑assisted LC method generation, then move to a subscription when LCForge becomes part of your routine method development and documentation.
      </p>

      <div className="pricing-grid">
        {/* Free plan */}
        <div className="pricing-card">
          <h2>Free trial usage</h2>
          <p className="price">$0</p>
          <ul>
            <li>Up to 3 AI‑generated LC/HPLC/LC‑MS methods per month</li>
            <li>Full method view and method PDF certificates with fingerprints</li>
            <li>No card required during the free trial</li>
            <li>Best for evaluating LCForge in real method‑development scenarios</li>
          </ul>
          <button className="outline-button">Use free trial methods</button>
        </div>

        {/* Solo subscription plan */}
        <div className="pricing-card pricing-card-accent">
          <h2>LCForge Solo</h2>
          <p className="price">
            $49<span>/ month</span>
          </p>
          <p className="price-note">Approx. ₹4,000 per month (for reference)</p>
          <ul>
            <li>Up to 200 AI‑generated LC/HPLC/LC‑MS methods per month</li>
            <li>Unlimited method PDF certificates with unique LCForge fingerprints</li>
            <li>Priority processing and email support</li>
            <li>Ideal for individual analytical scientists and consultants</li>
          </ul>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@lab-or-company.com"
            className="pricing-email-input"
          />

          <button
            onClick={handleSoloCheckout}
            className="primary-button"
            disabled={isCheckingOut}
          >
            {isCheckingOut ? "Redirecting to Stripe..." : "Start Solo (Stripe test mode)"}
          </button>

          {checkoutStatus && (
            <p className="small-muted" style={{ marginTop: "0.5rem" }}>
              {checkoutStatus}
            </p>
          )}
        </div>

        {/* Future higher-tier plan placeholder */}
        <div className="pricing-card">
          <h2>Team (coming soon)</h2>
          <p className="price">
            $149<span>/ month</span>
          </p>
          <p className="price-note">Designed for small pharma and CRO teams</p>
          <ul>
            <li>Higher AI method limits for multi‑scientist teams</li>
            <li>Shared workspace and method history for your lab</li>
            <li>Priority onboarding, support and feature input</li>
          </ul>
          <button className="outline-button" disabled>
            Coming soon
          </button>
        </div>
      </div>

      {
        message && (
          <p
            className="small-muted pricing-footer-note"
            style={{ color: "#f97373" }}
          >
            {message}
          </p>
        )
      }

      <p className="small-muted pricing-footer-note">
        Payments are processed by a PCI‑compliant provider (Stripe). LCForge AI never stores full card details. During this early phase, all checkouts run in Stripe test mode and do not create real charges; prices shown are indicative and may be adjusted for regional taxes and currency.
      </p>
    </section >
  );
}