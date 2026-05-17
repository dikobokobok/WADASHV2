import { NextResponse } from "next/server";
import { getAuthCookie } from "@/lib/auth";
import { findUserById, updateUserPasswordHash, revokeAllAuthSessionsForUser, appendSecurityAudit } from "@/lib/database";
import { verifyPassword, hashPassword } from "@/lib/password";

export async function POST(req: Request) {
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
        const { currentPassword, newPassword } = body;

        if (!currentPassword || !newPassword) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        if (newPassword.length < 6) {
            return NextResponse.json({ error: "New password must be at least 6 characters long" }, { status: 400 });
        }

        // Verify current password
        const isMatch = verifyPassword(user.password, currentPassword);
        if (!isMatch) {
            appendSecurityAudit({
                action: "PASSWORD_CHANGE_FAILED",
                userId: user.id,
                detail: "Incorrect current password"
            });
            return NextResponse.json({ error: "Incorrect current password" }, { status: 401 });
        }

        // Hash and update new password
        const newHash = hashPassword(newPassword);
        updateUserPasswordHash(user.id, newHash);

        // Revoke all existing sessions so the old token is no longer valid
        revokeAllAuthSessionsForUser(user.id);

        appendSecurityAudit({
            action: "PASSWORD_CHANGED",
            userId: user.id,
            detail: "User changed password successfully and sessions were revoked"
        });

        return NextResponse.json({ message: "Password updated successfully" }, { status: 200 });
    } catch (error) {
        console.error("Change password error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
