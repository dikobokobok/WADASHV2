import { NextRequest, NextResponse } from "next/server";
import { getBotConfig, updateBotConfig, appendSecurityAudit } from "@/lib/database";
import { getAuthContext } from "@/lib/auth";
import { botConfigUpdateSchema } from "@/lib/validation/schemas";
import { csrfHeaderValid } from "@/lib/csrf-guard";
import { clientIpFromRequest } from "@/lib/rate-limit";

export async function GET() {
    try {
        const userId = (await getAuthContext())?.userId;

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const config = getBotConfig(userId);
        return NextResponse.json(config, { status: 200 });
    } catch (error) {
        console.error("Get config error:", error);

        if (error instanceof Error && error.message === "User not found") {
            return NextResponse.json(
                { error: "User not found. Please log in again." },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

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
        const parsed = botConfigUpdateSchema.safeParse(json);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid configuration payload", issues: parsed.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const updatedConfig = updateBotConfig(ctx.userId, parsed.data);

        appendSecurityAudit({
            action: "bot_config_updated",
            userId: ctx.userId,
            ip,
        });

        return NextResponse.json(
            { message: "Configuration updated successfully", config: updatedConfig },
            { status: 200 }
        );
    } catch (error) {
        console.error("Update config error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
