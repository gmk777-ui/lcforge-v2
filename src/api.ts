// src/api.ts

const BACKEND_URL =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export async function createCheckoutSession(email: string) {
    const res = await fetch(`${BACKEND_URL}/api/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
    });

    if (!res.ok) {
        throw new Error(`Checkout HTTP ${res.status}`);
    }

    return res.json() as Promise<{ url?: string; error?: string }>;
}

export async function createSoloCheckoutSession(email: string) {
    const res = await fetch(`${BACKEND_URL}/api/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
    });

    const data = await res.json();

    if (data.status !== "ok") {
        throw new Error(data.meta?.error || "Stripe checkout failed");
    }

    // { id, url }
    return data.result as { id: string; url: string };
}