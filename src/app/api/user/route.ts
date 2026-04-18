import { NextRequest, NextResponse } from "next/server";
import { getAuthCookie } from "@/lib/auth";
import { findUserById } from "@/lib/database";

export async function GET(request: NextRequest) {
    try {
        const userId = await getAuthCookie();
        console.log("GET /api/user - userId from cookie:", userId);

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = findUserById(userId);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Return user data without password
        return NextResponse.json({
            id: user.id,
            username: user.username,
            email: user.email,
            createdAt: user.createdAt,
        }, { status: 200 });
    } catch (error) {
        console.error("Get user error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
