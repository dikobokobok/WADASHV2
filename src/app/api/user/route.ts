import { NextResponse } from "next/server";
import { getAuthCookie } from "@/lib/auth";
import { findUserById } from "@/lib/database";

export async function GET() {
    try {
        const userId = await getAuthCookie();

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
            role: user.role,
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

export async function PATCH(req: Request) {
    try {
        const userId = await getAuthCookie();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = findUserById(userId);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const body = await req.json();
        const { username, email } = body;

        // Validation could be added here
        if (!username && !email) {
            return NextResponse.json({ error: "No data provided to update" }, { status: 400 });
        }

        const { updateUserProfile } = await import("@/lib/database");
        updateUserProfile(user.id, { username, email });

        return NextResponse.json({ message: "Profile updated successfully" }, { status: 200 });
    } catch (error) {
        console.error("Update profile error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
