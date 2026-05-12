import { NextRequest, NextResponse } from "next/server";
import { createUser, findUserByEmail, findUserByUsername, appendSecurityAudit } from "@/lib/database";
import { setAuthCookie } from "@/lib/auth";
import { rateLimitAllow, clientIpFromRequest } from "@/lib/rate-limit";
import { registerBodySchema } from "@/lib/validation/schemas";
import { verifyTurnstileToken } from "@/lib/turnstile";

const REGISTER_WINDOW_MS = 60 * 60 * 1000;
const REGISTER_MAX_ATTEMPTS = 10;

export async function POST(request: NextRequest) {
    const ip = clientIpFromRequest(request);

    try {
        if (!rateLimitAllow(`register:${ip}`, REGISTER_MAX_ATTEMPTS, REGISTER_WINDOW_MS)) {
            return NextResponse.json(
                { error: "Too many registration attempts. Try again later." },
                { status: 429 }
            );
        }

        const json = await request.json().catch(() => null);
        const parsed = registerBodySchema.safeParse(json);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid request", issues: parsed.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const { username, email, password, turnstileToken } = parsed.data;

        const turnstileRequired = !!process.env.TURNSTILE_SECRET_KEY?.trim();
        if (turnstileRequired) {
            const ok = await verifyTurnstileToken(turnstileToken, ip);
            if (!ok) {
                return NextResponse.json(
                    { error: "Human verification failed. Refresh and try again." },
                    { status: 400 }
                );
            }
        }

        const existingEmail = findUserByEmail(email);
        if (existingEmail) {
            return NextResponse.json(
                { error: "Email already registered" },
                { status: 400 }
            );
        }

        const existingUsername = findUserByUsername(username);
        if (existingUsername) {
            return NextResponse.json(
                { error: "Username already taken" },
                { status: 400 }
            );
        }

        const user = createUser(username, email, password);

        await setAuthCookie(user.id);

        appendSecurityAudit({
            action: "register_success",
            userId: user.id,
            detail: `username=${username}`,
            ip,
        });

        return NextResponse.json(
            {
                message: "Registration successful",
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Registration error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
