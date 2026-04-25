// src/utils/freeLimit.ts

const FREE_LIMIT_KEY = "lcforge_free_methods_used";

export function getUsedMethods(): number {
    if (typeof window === "undefined") return 0;
    const raw = window.localStorage.getItem(FREE_LIMIT_KEY);
    const n = raw ? parseInt(raw, 10) : 0;
    return Number.isNaN(n) ? 0 : n;
}

export function incrementUsedMethods(): number {
    const current = getUsedMethods();
    const next = current + 1;
    window.localStorage.setItem(FREE_LIMIT_KEY, String(next));
    return next;
}

export function resetUsedMethods() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(FREE_LIMIT_KEY);
}