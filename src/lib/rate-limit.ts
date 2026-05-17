type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const PRUNE_EVERY = 200;
let opsSincePrune = 0;

function prune(now: number): void {
    for (const [k, b] of buckets) {
        if (now > b.resetAt) buckets.delete(k);
    }
}

/**
 * Sliding-window style limiter (fixed window per key).
 * @returns true if allowed, false if rate limited
 */
export function rateLimitAllow(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    opsSincePrune++;
    if (opsSincePrune >= PRUNE_EVERY) {
        opsSincePrune = 0;
        prune(now);
    }

    let b = buckets.get(key);
    if (!b || now > b.resetAt) {
        b = { count: 0, resetAt: now + windowMs };
        buckets.set(key, b);
    }
    b.count++;
    return b.count <= limit;
}

export function clientIpFromRequest(request: { headers: Headers }): string {
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) {
        const first = forwarded.split(",")[0]?.trim();
        if (first) return first;
    }
    return request.headers.get("x-real-ip") ?? "unknown";
}
