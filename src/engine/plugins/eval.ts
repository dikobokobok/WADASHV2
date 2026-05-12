import { WAMessage } from '@whiskeysockets/baileys';
import makeWASocket from '@whiskeysockets/baileys';
import { isGlobOwner } from './utils';
import nodePath from 'path';
import nodeFs from 'fs';
import nodeOs from 'os';
import nodeCrypto from 'crypto';
import nodeChild from 'child_process';

export const command = 'eval';
export const category = 'owner';

export async function execute(
    sock: ReturnType<typeof makeWASocket>,
    msg: WAMessage,
    args: string[],
    settings: Record<string, any>
) {
    const jid = msg.key.remoteJid!;

    // === GlobOwner Guard ===
    if (!isGlobOwner(msg, settings)) {
        await sock.sendMessage(jid, {
            text: '🚫 Perintah ini hanya bisa digunakan oleh *Global Owner*.'
        }, { quoted: msg });
        return;
    }

    // === Validasi input ===
    // Ambil hanya baris pertama untuk menghindari konflik jika user kirim beberapa eval sekaligus
    const rawCode = args.join(' ').trim();
    const code = rawCode.split('\n')[0].trim();
    if (!code) {
        await sock.sendMessage(jid, {
            text: '❓ *Penggunaan:* `!eval <kode javascript>`\n\n*Contoh:*\n`!eval 2 + 2`\n`!eval Buffer.from(\'WADASH\').toString(\'base64\')`\n`!eval Object.keys(settings).join(\', \')`'
        }, { quoted: msg });
        return;
    }

    await sock.sendMessage(jid, { react: { text: '⏳', key: msg.key } });

    try {
        // Inject Node.js globals agar tersedia di dalam eval
        const Buffer = global.Buffer;
        const process = global.process;
        const require = (m: string) => {
            const allowed: Record<string, any> = {
                path: nodePath,
                fs: nodeFs,
                os: nodeOs,
                crypto: nodeCrypto,
                child_process: nodeChild,
            };
            if (!allowed[m]) throw new Error(`require('${m}') tidak diizinkan dalam eval`);
            return allowed[m];
        };
        const path = nodePath;
        const fs = nodeFs;
        const os = nodeOs;
        const crypto = nodeCrypto;

        // Bungkus dalam async function agar await bisa digunakan
        const wrappedCode = `(async () => { ${code} })()`;

        // eslint-disable-next-line no-eval
        let result = await eval(wrappedCode);

        // Format hasil
        if (typeof result === 'object' && result !== null) {
            try {
                result = JSON.stringify(result, null, 2);
            } catch {
                result = String(result);
            }
        } else if (result === undefined) {
            result = 'undefined';
        } else {
            result = String(result);
        }

        const truncated = result.length > 3500
            ? result.slice(0, 3500) + '\n\n...[output dipotong]'
            : result;

        await sock.sendMessage(jid, {
            text: `\`\`\`\nEval: ${code}\n\nOutput:\n${truncated}\n\`\`\``
        }, { quoted: msg });

        await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } });

    } catch (err: any) {
        const errMsg = err?.message || String(err);

        await sock.sendMessage(jid, {
            text: `\`\`\`\nEval: ${code}\n\n❌ ${err?.name || 'Error'}:\n${errMsg}\n\`\`\``
        }, { quoted: msg });

        await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } });
    }
}
