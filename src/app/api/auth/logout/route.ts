import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, removeAuthCookie } from "@/lib/auth";
import { appendSecurityAudit } from "@/lib/database";
import { csrfHeaderValid } from "@/lib/csrf-guard";
import { clientIpFromRequest } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
    const ip = clientIpFromRequest(request);
    try {
        const ctx = await getAuthContext();
        if (!ctx) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        if (!csrfHeaderValid(request, ctx.csrfToken)) {
            return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
        }

        await removeAuthCookie();

        appendSecurityAudit({
            action: "logout",
            userId: ctx.userId,
            ip,
        });

        return NextResponse.json({ message: "Logout successful" }, { status: 200 });
    } catch (error) {
        console.error("Logout error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
