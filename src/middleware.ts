import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, LEGACY_AUTH_COOKIE_NAME } from "@/lib/session-constants";

async function sessionIsValid(request: NextRequest): Promise<boolean> {
    const cookieHeader = request.headers.get("cookie") ?? "";
    if (!cookieHeader.includes(`${SESSION_COOKIE_NAME}=`)) {
        return false;
    }
    const validateUrl = new URL("/api/auth/validate", request.url);
    try {
        const res = await fetch(validateUrl, {
            headers: { cookie: cookieHeader },
            cache: "no-store",
        });
        return res.ok;
    } catch {
        return false;
    }
}

export async function middleware(request: NextRequest) {
    const legacy = request.cookies.get(LEGACY_AUTH_COOKIE_NAME)?.value;

    const isAuthPage =
        request.nextUrl.pathname.startsWith("/login") ||
        request.nextUrl.pathname.startsWith("/register");
    const isProtectedPage =
        request.nextUrl.pathname === "/" || request.nextUrl.pathname === "/config";

    const isAuthed = await sessionIsValid(request);

    if (!isAuthed && isProtectedPage) {
        const res = NextResponse.redirect(new URL("/login", request.url));
        if (legacy) {
            res.cookies.delete(LEGACY_AUTH_COOKIE_NAME);
        }
        return res;
    }

    if (isAuthed && isAuthPage) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    const res = NextResponse.next();
    if (legacy && isAuthed) {
        res.cookies.delete(LEGACY_AUTH_COOKIE_NAME);
    }
    return res;
}

export const config = {
    matcher: ["/", "/config", "/login", "/register"],
};
