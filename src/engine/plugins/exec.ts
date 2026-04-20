import { WAMessage } from '@whiskeysockets/baileys';
import makeWASocket from '@whiskeysockets/baileys';
import { exec as execChild } from 'child_process';
import { promisify } from 'util';
import { isOwner } from './utils';

const execAsync = promisify(execChild);

export const command = 'exec';
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
    const shellCommand = args.join(' ').trim();
    if (!shellCommand) {
        await sock.sendMessage(jid, {
            text: '❓ *Penggunaan:* `!exec <perintah shell>`\n\n*Contoh:*\n`!exec ls -la`\n`!exec node -v`'
        }, { quoted: msg });
        return;
    }

    // Kirim loading indicator
    await sock.sendMessage(jid, { react: { text: '⏳', key: msg.key } });

    try {
        const { stdout, stderr } = await execAsync(shellCommand, {
            timeout: 15000, // max 15 detik
            maxBuffer: 1024 * 1024 // max 1MB output
        });

        const output = stdout.trim() || stderr.trim() || '(no output)';
        const truncated = output.length > 3500
            ? output.slice(0, 3500) + '\n\n...[output dipotong]'
            : output;

        await sock.sendMessage(jid, {
            text: `\`\`\`\n$ ${shellCommand}\n\n${truncated}\n\`\`\``
        }, { quoted: msg });

        await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } });

    } catch (err: any) {
        const errOutput = err.stderr?.trim() || err.message || 'Unknown error';
        const truncated = errOutput.length > 3500
            ? errOutput.slice(0, 3500) + '\n...[dipotong]'
            : errOutput;

        await sock.sendMessage(jid, {
            text: `\`\`\`\n$ ${shellCommand}\n\n❌ ERROR:\n${truncated}\n\`\`\``
        }, { quoted: msg });

        await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } });
    }
}
