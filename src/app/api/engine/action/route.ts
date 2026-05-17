import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import botManager from "@/engine/BotManager";
import { engineActionBodySchema } from "@/lib/validation/schemas";
import { csrfHeaderValid } from "@/lib/csrf-guard";
import { appendSecurityAudit } from "@/lib/database";
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

        const json = await request.json().catch(() => null);
        const parsed = engineActionBodySchema.safeParse(json);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid request", issues: parsed.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const { action } = parsed.data;
        const userId = ctx.userId;

        if (action === "start") {
            await botManager.startBot(userId);
            appendSecurityAudit({ action: "engine_start", userId, ip });
            return NextResponse.json({ success: true, message: "Bot starting" });
        }
        if (action === "stop") {
            botManager.stopBot(userId, false);
            appendSecurityAudit({ action: "engine_stop", userId, ip });
            return NextResponse.json({ success: true, message: "Bot stopped" });
        }
        if (action === "delete") {
            botManager.deleteSession(userId);
            appendSecurityAudit({ action: "engine_delete_session", userId, ip });
            return NextResponse.json({ success: true, message: "Session deleted" });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (error) {
        console.error("Engine action error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
