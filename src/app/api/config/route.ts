import { NextRequest, NextResponse } from "next/server";
import { getBotConfig, updateBotConfig } from "@/lib/database";
import { getAuthCookie } from "@/lib/auth";

export async function GET(request: NextRequest) {
    try {
        const userId = await getAuthCookie();
        console.log("GET /api/config - userId from cookie:", userId);

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const config = getBotConfig(userId);
        return NextResponse.json(config, { status: 200 });
    } catch (error) {
        console.error("Get config error:", error);

        // Check if it's a "User not found" error
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
    try {
        const userId = await getAuthCookie();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const updatedConfig = updateBotConfig(userId, body);

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
