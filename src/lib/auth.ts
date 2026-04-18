import { cookies } from "next/headers";

export async function setAuthCookie(userId: string) {
    const cookieStore = await cookies();
    cookieStore.set("auth_user_id", userId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
    });
}

export async function getAuthCookie(): Promise<string | undefined> {
    const cookieStore = await cookies();
    return cookieStore.get("auth_user_id")?.value;
}

export async function removeAuthCookie() {
    const cookieStore = await cookies();
    cookieStore.delete("auth_user_id");
}

export async function isAuthenticated(): Promise<boolean> {
    const userId = await getAuthCookie();
    return !!userId;
}
