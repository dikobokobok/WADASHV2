/**
 * Verifies a Cloudflare Turnstile token server-side.
 * When TURNSTILE_SECRET_KEY is unset, verification is skipped (development / no widget).
 */
export async function verifyTurnstileToken(
    token: string | undefined,
    remoteip: string
): Promise<boolean> {
    const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
    if (!secret) return true;
    if (!token || token.length < 10) return false;

    const body = new URLSearchParams();
    body.set("secret", secret);
    body.set("response", token);
    if (remoteip && remoteip !== "unknown") body.set("remoteip", remoteip);

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: body.toString(),
    });

    if (!res.ok) return false;
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
}
