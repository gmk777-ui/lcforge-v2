export default function PricingPage() {
  return (
    <section className="pricing">
      <h1>Pricing & Plans</h1>
      <p className="pricing-intro">
        LCForge AI v2 – demo pricing. This interface shows how plans and autopay could look; no
        real payments are processed in this version.
      </p>

      <div className="pricing-grid">
        <div className="pricing-card">
          <h2>Free</h2>
          <p className="price">$0</p>
          <ul>
            <li>2 free method searches</li>
            <li>No card required</li>
            <li>Best for trying LCForge AI</li>
          </ul>
          <button className="outline-button">Start free (demo)</button>
        </div>

        <div className="pricing-card pricing-card-accent">
          <h2>Pay‑as‑you‑go</h2>
          <p className="price">$5<span>/ method</span></p>
          <p className="price-note">≈ ₹420 per method (approximate)</p>
          <ul>
            <li>Pay only for what you generate</li>
            <li>Ideal for low‑volume R&D teams</li>
            <li>Can be enabled with autopay in production</li>
          </ul>
          <button className="primary-button">Configure autopay (demo)</button>
        </div>

        <div className="pricing-card">
          <h2>Starter</h2>
          <p className="price">$25<span>/ month</span></p>
          <p className="price-note">≈ ₹2,100 per month (approximate)</p>
          <ul>
            <li>Up to 10 methods per month</li>
            <li>Email support</li>
            <li>Good for small labs</li>
          </ul>
          <button className="outline-button">Talk to us (demo)</button>
        </div>

        <div className="pricing-card">
          <h2>Pro</h2>
          <p className="price">$75<span>/ month</span></p>
          <p className="price-note">≈ ₹6,300 per month (approximate)</p>
          <ul>
            <li>Up to 40 methods per month</li>
            <li>Priority support</li>
            <li>Team access & observability</li>
          </ul>
          <button className="outline-button">Schedule demo (demo)</button>
        </div>
      </div>

      <p className="small-muted pricing-footer-note">
        Note: All amounts are indicative. In a real deployment, payments would be handled through a
        PCI‑compliant provider (e.g., Stripe/Razorpay) and funds routed safely to your account.
      </p>
    </section>
  );
}
