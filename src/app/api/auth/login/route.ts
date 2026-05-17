import { NextRequest, NextResponse } from "next/server";
import {
    findUserByEmailOrUsername,
    updateUserPasswordHash,
    isUserAccountLocked,
    recordUserLoginFailure,
    resetUserLoginSecurity,
    appendSecurityAudit,
} from "@/lib/database";
import { setAuthCookie } from "@/lib/auth";
import { verifyPassword, isPasswordHashed, hashPassword } from "@/lib/password";
import { rateLimitAllow, clientIpFromRequest } from "@/lib/rate-limit";
import { loginBodySchema } from "@/lib/validation/schemas";

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 20;

export async function POST(request: NextRequest) {
    const ip = clientIpFromRequest(request);

    try {
        if (!rateLimitAllow(`login:${ip}`, LOGIN_MAX_ATTEMPTS, LOGIN_WINDOW_MS)) {
            return NextResponse.json(
                { error: "Too many attempts. Try again later." },
                { status: 429 }
            );
        }

        const json = await request.json().catch(() => null);
        const parsed = loginBodySchema.safeParse(json);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid request", issues: parsed.error.flatten().fieldErrors },
                { status: 400 }
            );
        }
        const { identifier, password } = parsed.data;

        const user = findUserByEmailOrUsername(identifier);

        if (!user) {
            appendSecurityAudit({
                action: "login_failure",
                detail: "unknown_user",
                ip,
            });
            return NextResponse.json(
                { error: "Invalid credentials" },
                { status: 401 }
            );
        }

        if (isUserAccountLocked(user)) {
            appendSecurityAudit({
                action: "login_blocked_locked_account",
                userId: user.id,
                ip,
            });
            return NextResponse.json(
                {
                    error:
                        "Account temporarily locked after multiple failed sign-ins. Try again later.",
                },
                { status: 423 }
            );
        }

        if (!verifyPassword(user.password, password)) {
            recordUserLoginFailure(user.id);
            appendSecurityAudit({
                action: "login_failure",
                userId: user.id,
                detail: "bad_password",
                ip,
            });
            return NextResponse.json(
                { error: "Invalid credentials" },
                { status: 401 }
            );
        }

        if (!isPasswordHashed(user.password)) {
            updateUserPasswordHash(user.id, hashPassword(password));
        }

        resetUserLoginSecurity(user.id);
        await setAuthCookie(user.id);

        appendSecurityAudit({
            action: "login_success",
            userId: user.id,
            ip,
        });

        return NextResponse.json(
            {
                message: "Login successful",
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
