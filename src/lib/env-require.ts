/**
 * Validates critical environment variables before the Node server accepts traffic.
 * Called from `instrumentation.ts` (Node runtime only).
 */
export function assertRequiredProductionEnv(): void {
    if (process.env.NODE_ENV !== "production") return;

    const secret = process.env.SESSION_SECRET;
    if (!secret || secret.length < 32) {
        throw new Error(
            "FATAL: SESSION_SECRET must be set to at least 32 characters in production. " +
                "Generate one with: openssl rand -base64 32"
        );
    }

    if (!process.env.PASSWORD_PEPPER?.trim()) {
        console.warn(
            "[security] PASSWORD_PEPPER is not set. Setting it adds a server-side secret layered on bcrypt; " +
                "recommended for production."
        );
    }
}
