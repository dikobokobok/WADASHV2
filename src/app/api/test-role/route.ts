import { NextResponse } from "next/server";
import { getUserRole } from "@/engine/plugins/utils";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const jid = searchParams.get("jid") || "6285135957662@s.whatsapp.net";
    
    const msg: any = {
        key: {
            remoteJid: jid,
            participant: jid
        }
    };
    
    const role = getUserRole(msg, {});
    
    return NextResponse.json({ jid, role });
}
