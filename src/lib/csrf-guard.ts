import type { NextRequest } from "next/server";

export const CSRF_HEADER = "x-csrf-token";

export function csrfHeaderValid(request: NextRequest, expectedToken: string): boolean {
    const sent = request.headers.get(CSRF_HEADER);
    return typeof sent === "string" && sent.length > 0 && sent === expectedToken;
}
