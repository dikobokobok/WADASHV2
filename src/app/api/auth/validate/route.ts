import { NextResponse } from "next/server";
import { getAuthCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Used by middleware (Edge) to confirm DB-backed session + JWT are still valid. */
export async function GET() {
    const userId = await getAuthCookie();
    if (!userId) {
        return new NextResponse(null, { status: 401 });
    }
    return new NextResponse(null, { status: 204 });
}
