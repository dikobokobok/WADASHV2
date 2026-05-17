import { cookies } from "next/headers";
import { createSessionToken, verifySessionToken } from "@/lib/session-token";
import { SESSION_COOKIE_NAME, LEGACY_AUTH_COOKIE_NAME } from "@/lib/session-constants";
import {
    createAuthSession,
    findActiveAuthSession,
    newSessionCsrfToken,
    revokeAuthSessionByJti,
} from "@/lib/database";
import crypto from "crypto";

const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days (aligns with JWT exp)

export type AuthContext = {
    userId: string;
    jti: string;
    csrfToken: string;
};

function cookieBase() {
    const isProd = process.env.NODE_ENV === "production";
    return {
        httpOnly: true as const,
        secure: isProd,
        sameSite: "lax" as const,
        path: "/",
        maxAge: SESSION_MAX_AGE,
    };
}

export async function setAuthCookie(userId: string) {
    const jti = crypto.randomUUID();
    const csrfToken = newSessionCsrfToken();
    const token = await createSessionToken(userId, jti);

    createAuthSession({
        jti,
        userId,
        createdAt: new Date().toISOString(),
        revokedAt: null,
        csrfToken,
    });

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, token, cookieBase());
    cookieStore.delete(LEGACY_AUTH_COOKIE_NAME);
}

async function readRawSessionCookie(): Promise<string | undefined> {
    const cookieStore = await cookies();
    return cookieStore.get(SESSION_COOKIE_NAME)?.value;
}

export async function getAuthContext(): Promise<AuthContext | null> {
    const raw = await readRawSessionCookie();
    if (!raw) return null;

    const claims = await verifySessionToken(raw);
    if (!claims) return null;

    const session = findActiveAuthSession(claims.jti);
    if (!session || session.userId !== claims.userId) return null;

    return {
        userId: claims.userId,
        jti: claims.jti,
        csrfToken: session.csrfToken,
    };
}

export async function getAuthCookie(): Promise<string | undefined> {
    const ctx = await getAuthContext();
    return ctx?.userId;
}

export async function removeAuthCookie() {
    const raw = await readRawSessionCookie();
    if (raw) {
        const claims = await verifySessionToken(raw);
        if (claims) {
            revokeAuthSessionByJti(claims.jti);
        }
    }
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
    cookieStore.delete(LEGACY_AUTH_COOKIE_NAME);
}

export async function isAuthenticated(): Promise<boolean> {
    const ctx = await getAuthContext();
    return !!ctx;
}
