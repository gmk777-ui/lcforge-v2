import { useState } from "react";

const backendUrl =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export default function PricingPage() {
  console.log("LCForge backendUrl at startup:", backendUrl);
  console.log("VITE_BACKEND_URL from env:", import.meta.env.VITE_BACKEND_URL);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleUpgradeToSolo() {
    try {
      setLoading(true);
      setMessage(null);

      const email = window.prompt("Enter your work email for billing:") || "";

      if (!email) {
        setMessage("Email is required to start the subscription.");
        setLoading(false);
        return;
      }

      const res = await fetch(`${backendUrl}/api/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        setMessage("Unable to start checkout. Please try again.");
        setLoading(false);
        return;
      }

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setMessage(
          data.error || "Unexpected response from payment service."
        );
        setLoading(false);
      }
    } catch (err) {
      console.error("Upgrade error", err);
      setMessage("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <section className="pricing">
      <h1>Pricing & Plans</h1>
      <p className="pricing-intro">
        Choose a plan that fits your lab. Start free, upgrade when LCForge AI
        becomes part of your daily workflow.
      </p>

      <div className="pricing-grid">
        {/* Free plan */}
        <div className="pricing-card">
          <h2>LCForge Free</h2>
          <p className="price">$0</p>
          <ul>
            <li>Up to 3 AI‑generated LC/HPLC/LC‑MS methods per month</li>
            <li>Full method view and PDF certificates</li>
            <li>No card required</li>
            <li>Best for evaluating LCForge AI</li>
          </ul>
          <button className="outline-button">Start free</button>
        </div>

        {/* Solo subscription plan */}
        <div className="pricing-card pricing-card-accent">
          <h2>LCForge Solo</h2>
          <p className="price">
            $49<span>/ month</span>
          </p>
          <p className="price-note">Approx. ₹4,000 per month (for reference)</p>
          <ul>
            <li>Up to 200 AI‑generated methods per month</li>
            <li>Unlimited PDF certificates with fingerprints</li>
            <li>Priority processing and email support</li>
            <li>Ideal for individual scientists and consultants</li>
          </ul>
          <button
            className="primary-button"
            onClick={handleUpgradeToSolo}
            disabled={loading}
          >
            {loading ? "Redirecting to checkout..." : "Upgrade to Solo"}
          </button>
        </div>

        {/* Future higher-tier plan placeholder */}
        <div className="pricing-card">
          <h2>Team (coming soon)</h2>
          <p className="price">
            $149<span>/ month</span>
          </p>
          <p className="price-note">For small pharma and CRO teams</p>
          <ul>
            <li>Higher method limits for teams</li>
            <li>Shared workspace for your lab</li>
            <li>Priority onboarding and support</li>
          </ul>
          <button className="outline-button" disabled>
            Coming soon
          </button>
        </div>
      </div>

      {message && (
        <p
          className="small-muted pricing-footer-note"
          style={{ color: "#f97373" }}
        >
          {message}
        </p>
      )}

      <p className="small-muted pricing-footer-note">
        Payments are processed by a PCI‑compliant provider (e.g., Stripe).
        LCForge AI never stores full card details. All prices are indicative
        and may be adjusted for regional taxes and currency.
      </p>
    </section>
  );
}