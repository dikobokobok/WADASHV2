import { NextRequest, NextResponse } from "next/server";
import { readBotApiResponders, writeBotApiResponders, appendSecurityAudit } from "@/lib/database";
import { getAuthContext } from "@/lib/auth";
import { apiRespondersBodySchema } from "@/lib/validation/schemas";
import { csrfHeaderValid } from "@/lib/csrf-guard";
import { clientIpFromRequest } from "@/lib/rate-limit";

export async function GET() {
    try {
        const userId = (await getAuthContext())?.userId;

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const data = readBotApiResponders(userId);
        return NextResponse.json(data);
    } catch (error) {
        console.error("Failed to fetch API responders:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
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

        let json: unknown;
        try {
            json = await request.json();
        } catch {
            return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
        }

        const parsed = apiRespondersBodySchema.safeParse(json);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid payload", issues: parsed.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        writeBotApiResponders(ctx.userId, parsed.data);

        appendSecurityAudit({
            action: "api_responders_updated",
            userId: ctx.userId,
            detail: `count=${parsed.data.length}`,
            ip,
        });

        return NextResponse.json({ success: true, data: parsed.data });
    } catch (error) {
        console.error("Failed to update API responders:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
