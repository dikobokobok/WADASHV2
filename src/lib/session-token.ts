import { SignJWT, jwtVerify } from "jose";

const ALG = "HS256";

function getSecretKey(): Uint8Array {
    const secret = process.env.SESSION_SECRET;
    if (secret && secret.length >= 32) {
        return new TextEncoder().encode(secret);
    }
    if (process.env.NODE_ENV === "production") {
        throw new Error("SESSION_SECRET must be set to at least 32 characters in production.");
    }
    console.warn(
        "[security] SESSION_SECRET not set; using a dev-only placeholder. Set SESSION_SECRET (32+ chars) before production."
    );
    return new TextEncoder().encode("wadash-dev-only-secret-min-32-chars!");
}

export type VerifiedSessionClaims = { userId: string; jti: string };

export async function createSessionToken(userId: string, jti: string): Promise<string> {
    return new SignJWT({})
        .setProtectedHeader({ alg: ALG })
        .setSubject(userId)
        .setJti(jti)
        .setIssuedAt()
        .setExpirationTime("7d")
        .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<VerifiedSessionClaims | null> {
    try {
        const { payload } = await jwtVerify(token, getSecretKey(), {
            algorithms: [ALG],
        });
        const sub = payload.sub;
        const jti = payload.jti;
        if (typeof sub !== "string" || sub.length === 0) return null;
        if (typeof jti !== "string" || jti.length === 0) return null;
        return { userId: sub, jti };
    } catch {
        return null;
    }
}
