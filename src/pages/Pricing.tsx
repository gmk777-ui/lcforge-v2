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
  const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID;
  console.log("Using Razorpay key (frontend):", razorpayKeyId);
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
          "Please enter your email before starting payment."
        );
        setIsCheckingOut(false);
        return;
      }

      // 1) Create Razorpay order on backend
      console.log("Calling create-order at:", `${backendUrl}/api/razorpay/create-order`);

      const res = await fetch(`${backendUrl}/api/razorpay/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountInInr: 3399 }),
      }).catch((err) => {
        console.error("Fetch error to create-order:", err);
        throw err;
      });

      console.log("create-order response status:", res.status);

      let data: any = null;
      try {
        data = await res.json();
        console.log("create-order JSON:", data);
        console.log("create-order meta:", data.meta);
      } catch (e) {
        console.error("Failed to parse JSON from create-order:", e);
      }

      if (!res.ok) {
        console.error("create-order not ok:", data);
        setCheckoutStatus("Could not start payment. Please try again.");
        setIsCheckingOut(false);
        return;
      }

      const { orderId, amount, currency } = data.result || data;

      // 2) Load Razorpay script if needed
      if (!(window as any).Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = () => resolve();
          script.onerror = () =>
            reject(new Error("Failed to load Razorpay checkout script"));
          document.body.appendChild(script);
        });
      }

      // 3) Configure and open Razorpay Checkout
      const options = {
        key: razorpayKeyId,
        amount,
        currency,
        name: "LCForge AI",
        description: "LCForge Solo subscription",
        order_id: orderId,
        prefill: {
          name: "LCForge User",
          email,
        },
        handler: async function (response: any) {
          const verifyRes = await fetch(
            `${backendUrl}/api/razorpay/verify`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            }
          );

          const verifyData = await verifyRes.json();
          if (verifyRes.ok && (verifyData.result?.success || verifyData.success)) {
            setCheckoutStatus("Payment successful. Thank you!");
            // later: you can persist a flag here
          } else {
            setCheckoutStatus(
              "Payment verification failed. Please contact support."
            );
          }
        },
        modal: {
          ondismiss: function () {
            setCheckoutStatus("Payment was cancelled.");
          },
        },
        theme: {
          color: "#3399cc",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

      if ((window as any).plausible) {
        (window as any).plausible("ClickUpgrade");
      }
    } catch (err) {
      console.error(err);
      setCheckoutStatus("Unexpected error. Please try again.");
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
            <li>Up to 2 AI‑generated LC/HPLC/LC‑MS methods per month</li>
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
            $36<span>/ month</span>
          </p>
          <p className="price-note">Approx. ₹3,399 per month (for reference)</p>
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
            {isCheckingOut ? "Opening Razorpay..." : "Start Solo (Razorpay – UPI & cards)"}
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