import { NextRequest, NextResponse } from "next/server";
import { createUser, findUserByEmail, findUserByUsername } from "@/lib/database";
import { setAuthCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
    try {
        const { username, email, password } = await request.json();

        // Validation
        if (!username || !email || !password) {
            return NextResponse.json(
                { error: "All fields are required" },
                { status: 400 }
            );
        }

        // Check if email already exists
        const existingEmail = findUserByEmail(email);
        if (existingEmail) {
            return NextResponse.json(
                { error: "Email already registered" },
                { status: 400 }
            );
        }

        // Check if username already exists
        const existingUsername = findUserByUsername(username);
        if (existingUsername) {
            return NextResponse.json(
                { error: "Username already taken" },
                { status: 400 }
            );
        }

        // Create user
        const user = createUser(username, email, password);

        // Set auth cookie
        await setAuthCookie(user.id);

        return NextResponse.json(
            {
                message: "Registration successful",
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Registration error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
