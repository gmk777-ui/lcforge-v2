const API_BASE =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export async function createCheckoutSession(email: string) {
    const res = await fetch(`${API_BASE}/api/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
    });

    if (!res.ok) {
        throw new Error(`Checkout HTTP ${res.status}`);
    }

    return res.json() as Promise<{ url?: string; error?: string }>;
}