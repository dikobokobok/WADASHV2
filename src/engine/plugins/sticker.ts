import { WAMessage, downloadMediaMessage } from '@whiskeysockets/baileys';
import makeWASocket from '@whiskeysockets/baileys';
import sharp from 'sharp';

export const command = ['sticker', 'stiker', 's'];
export const category = 'sticker';

export async function execute(
    sock: ReturnType<typeof makeWASocket>,
    msg: WAMessage,
    _args: string[],
    settings: Record<string, any>
) {
    const jid = msg.key.remoteJid!;

    // Cari sumber gambar: bisa dari pesan itu sendiri (caption) atau quoted message (reply)
    const imageMsg =
        msg.message?.imageMessage ??
        msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage ?? null;

    if (!imageMsg) {
        await sock.sendMessage(jid, {
            text: '❌ Kirim atau reply sebuah gambar dengan caption *!sticker* untuk membuat sticker.'
        }, { quoted: msg });
        return;
    }

    // Tentukan pesan yang merupakan sumber gambar (bisa quoted)
    const targetMsg: WAMessage = msg.message?.imageMessage
        ? msg
        : {
            key: {
                remoteJid: jid,
                id: msg.message?.extendedTextMessage?.contextInfo?.stanzaId,
                fromMe: false,
            },
            message: msg.message?.extendedTextMessage?.contextInfo?.quotedMessage ?? undefined,
        };

    try {
        // Download gambar
        const buffer = await downloadMediaMessage(
            targetMsg,
            'buffer',
            {},
            { logger: console as any, reuploadRequest: sock.updateMediaMessage }
        ) as Buffer;

        // Konversi ke WebP sticker menggunakan sharp
        const webpBuffer = await sharp(buffer)
            .resize(512, 512, {
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            })
            .webp({ quality: 80, lossless: false })
            .toBuffer();

        // Kirim sebagai sticker
        await sock.sendMessage(jid, {
            sticker: webpBuffer,
            mimetype: 'image/webp',
        }, { quoted: msg });

    } catch (err: any) {
        console.error('[Sticker] Error:', err.message);
        await sock.sendMessage(jid, {
            text: `❌ Gagal membuat sticker: ${err.message}`
        }, { quoted: msg });
    }
}
