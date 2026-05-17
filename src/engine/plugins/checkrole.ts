import { WAMessage } from '@whiskeysockets/baileys';
import makeWASocket from '@whiskeysockets/baileys';
import { getUserRole, normalizeNumber, sendWithTyping } from './utils';
import { getGlobalOwnerNumber } from '@/lib/database';

export const command = 'checkrole';
export const category = 'general';

export async function execute(
    sock: ReturnType<typeof makeWASocket>,
    msg: WAMessage,
    args: string[],
    settings: Record<string, any>
) {
    const jid = msg.key.remoteJid!;
    const role = getUserRole(msg, settings);
    
    const senderJid = (msg.key?.participant || msg.key?.remoteJid || '').toString();
    const senderNorm = normalizeNumber(senderJid);
    const dbGlobOwner = getGlobalOwnerNumber();
    const fallback = process.env.GLOBAL_OWNER_NUMBER || "628989031500";

    const text = `🔍 *DEBUG INFO*
- *Your JID:* ${senderJid}
- *Normalized JID:* ${senderNorm}
- *Role:* ${role}

- *DB GlobOwner:* ${dbGlobOwner}
- *Norm DB GlobOwner:* ${dbGlobOwner ? normalizeNumber(dbGlobOwner) : 'null'}
- *Fallback:* ${fallback}
- *Match?:* ${dbGlobOwner ? senderNorm === normalizeNumber(dbGlobOwner) : 'N/A'}`;

    await sendWithTyping(sock, jid, { text }, { quoted: msg });
}
