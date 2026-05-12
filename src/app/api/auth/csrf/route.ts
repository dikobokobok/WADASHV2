import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
    const ctx = await getAuthContext();
    if (!ctx) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ token: ctx.csrfToken });
}
