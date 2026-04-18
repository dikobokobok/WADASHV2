import { NextRequest, NextResponse } from "next/server";
import { findUserByEmailOrUsername } from "@/lib/database";
import { setAuthCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
    try {
        const { identifier, password } = await request.json();

        // Validation
        if (!identifier || !password) {
            return NextResponse.json(
                { error: "All fields are required" },
                { status: 400 }
            );
        }

        // Find user by email or username
        const user = findUserByEmailOrUsername(identifier);

        if (!user) {
            return NextResponse.json(
                { error: "Invalid credentials" },
                { status: 401 }
            );
        }

        // Check password (plain text comparison for now)
        if (user.password !== password) {
            return NextResponse.json(
                { error: "Invalid credentials" },
                { status: 401 }
            );
        }

        // Set auth cookie
        await setAuthCookie(user.id);

        return NextResponse.json(
            {
                message: "Login successful",
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
