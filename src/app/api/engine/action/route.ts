import { NextRequest, NextResponse } from "next/server";
import { getAuthCookie } from "@/lib/auth";
import botManager from "@/engine/BotManager";

export async function POST(request: NextRequest) {
    try {
        const userId = await getAuthCookie();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { action } = await request.json();

        if (action === 'start') {
            await botManager.startBot(userId);
            return NextResponse.json({ success: true, message: 'Bot starting' });
        } else if (action === 'stop') {
            botManager.stopBot(userId, false); // Don't logout, just disconnect
            return NextResponse.json({ success: true, message: 'Bot stopped' });
        } else if (action === 'delete') {
            botManager.deleteSession(userId); // Disconnect, logout and delete files
            return NextResponse.json({ success: true, message: 'Session deleted' });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });

    } catch (error: any) {
        console.error("Engine action error:", error);
        return NextResponse.json(
            { error: "Internal server error", details: error.message },
            { status: 500 }
        );
    }
}
