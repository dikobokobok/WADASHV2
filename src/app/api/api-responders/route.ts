import { NextRequest, NextResponse } from "next/server";
import { readBotApiResponders, writeBotApiResponders } from "@/lib/database";

export async function GET(req: NextRequest) {
    try {
        const userId = req.cookies.get("auth_user_id")?.value;
        console.log("api-responders GET userId:", userId);

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

export async function POST(req: NextRequest) {
    try {
        const userId = req.cookies.get("auth_user_id")?.value;
        console.log("api-responders POST userId:", userId);

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        let body;
        try {
            body = await req.json();
        } catch (e) {
            return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
        }

        if (!Array.isArray(body)) {
             return NextResponse.json({ error: "Expected an array of responders" }, { status: 400 });
        }

        writeBotApiResponders(userId, body);

        return NextResponse.json({ success: true, data: body });
    } catch (error: any) {
        console.error("Failed to update API responders:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
