import { NextResponse } from "next/server";
import { getAuthCookie } from "@/lib/auth";
import { findUserById, getGlobalOwnerNumber, setGlobalOwnerNumber } from "@/lib/database";

export async function GET() {
    try {
        const userId = await getAuthCookie();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = findUserById(userId);
        if (!user || user.role !== "globOwner") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const number = getGlobalOwnerNumber() || process.env.GLOBAL_OWNER_NUMBER || "628989031500";
        return NextResponse.json({ globalOwnerNumber: number }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const userId = await getAuthCookie();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = findUserById(userId);
        if (!user || user.role !== "globOwner") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { globalOwnerNumber } = await req.json();
        if (!globalOwnerNumber) {
            return NextResponse.json({ error: "Number is required" }, { status: 400 });
        }

        setGlobalOwnerNumber(globalOwnerNumber);

        return NextResponse.json({ message: "Global Owner Number updated" }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
