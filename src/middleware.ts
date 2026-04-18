import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    const authCookie = request.cookies.get("auth_user_id");
    const isAuthPage = request.nextUrl.pathname.startsWith("/login") ||
        request.nextUrl.pathname.startsWith("/register");
    const isProtectedPage = request.nextUrl.pathname === "/" ||
        request.nextUrl.pathname === "/config";

    // If user is not authenticated and trying to access protected page
    if (!authCookie && isProtectedPage) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    // If user is authenticated and trying to access auth pages
    if (authCookie && isAuthPage) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/", "/config", "/login", "/register"],
};
