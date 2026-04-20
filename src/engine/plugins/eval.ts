import { WAMessage } from '@whiskeysockets/baileys';
import makeWASocket from '@whiskeysockets/baileys';
import { isOwner } from './utils';

export const command = 'eval';
export const category = 'owner';

export async function execute(
    sock: ReturnType<typeof makeWASocket>,
    msg: WAMessage,
    args: string[],
    settings: Record<string, any>
) {
    const jid = msg.key.remoteJid!;

    // === Owner Guard ===
    if (!isOwner(msg, settings)) {
        await sock.sendMessage(jid, {
            text: '🚫 Perintah ini hanya bisa digunakan oleh *Owner*.'
        }, { quoted: msg });
        return;
    }

    // === Validasi input ===
    const code = args.join(' ').trim();
    if (!code) {
        await sock.sendMessage(jid, {
            text: '❓ *Penggunaan:* `!eval <kode javascript>`\n\n*Contoh:*\n`!eval 2 + 2`\n`!eval new Date().toLocaleString(\'id-ID\')`\n`!eval Object.keys(settings).join(\', \')`'
        }, { quoted: msg });
        return;
    }

    await sock.sendMessage(jid, { react: { text: '⏳', key: msg.key } });

    try {
        // Bungkus dalam async function agar await bisa digunakan di dalam kode eval
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
