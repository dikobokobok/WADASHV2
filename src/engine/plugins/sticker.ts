import { WAMessage, downloadMediaMessage } from '@whiskeysockets/baileys';
import makeWASocket from '@whiskeysockets/baileys';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import { FFMPEG_PATH } from '../lib/ffmpeg';
import fs from 'fs';
import path from 'path';
import os from 'os';

if (FFMPEG_PATH) {
    ffmpeg.setFfmpegPath(FFMPEG_PATH);
}

export const command = ['sticker', 'stiker', 's'];
export const category = 'sticker';

export async function execute(
    sock: ReturnType<typeof makeWASocket>,
    msg: WAMessage,
    _args: string[],
    _settings: Record<string, any>
) {
    const jid = msg.key.remoteJid!;

    // Cari sumber media: Gambar atau Video
    const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const isQuotedImage = !!quotedMsg?.imageMessage;
    const isQuotedVideo = !!quotedMsg?.videoMessage;
    const isDirectImage = !!msg.message?.imageMessage;
    const isDirectVideo = !!msg.message?.videoMessage;

    if (!isDirectImage && !isDirectVideo && !isQuotedImage && !isQuotedVideo) {
        await sock.sendMessage(jid, {
            text: '❌ Kirim atau reply sebuah gambar/video/gif dengan caption *!sticker* untuk membuat sticker.'
        }, { quoted: msg });
        return;
    }

    // Tentukan pesan target untuk didownload
    const targetMsg: WAMessage = (isDirectImage || isDirectVideo)
        ? msg
        : {
            key: {
                remoteJid: jid,
                id: msg.message?.extendedTextMessage?.contextInfo?.stanzaId,
                fromMe: false,
            },
            message: quotedMsg ?? undefined,
        };

    const mediaType = (isDirectImage || isQuotedImage) ? 'image' : 'video';

    try {
        // Download media
        const buffer = await downloadMediaMessage(
            targetMsg,
            'buffer',
            {},
            { logger: console as any, reuploadRequest: sock.updateMediaMessage }
        ) as Buffer;

        let webpBuffer: Buffer;

        if (mediaType === 'image') {
            // Konversi Gambar ke WebP menggunakan sharp
            webpBuffer = await sharp(buffer)
                .resize(512, 512, {
                    fit: 'contain',
                    background: { r: 0, g: 0, b: 0, alpha: 0 }
                })
                .webp({ quality: 80, lossless: false })
                .toBuffer();
        } else {
            // Konversi Video/GIF ke Animated WebP menggunakan ffmpeg
            webpBuffer = await convertVideoToWebp(buffer);
        }

        // Kirim sebagai sticker
        await sock.sendMessage(jid, {
            sticker: webpBuffer,
        }, { quoted: msg });

    } catch (err: any) {
        console.error('[Sticker] Error:', err.message);
        await sock.sendMessage(jid, {
            text: `❌ Gagal membuat sticker: ${err.message}`
        }, { quoted: msg });
    }
}

/**
 * Konversi Video/GIF Buffer ke Animated WebP Sticker
 */
async function convertVideoToWebp(videoBuffer: Buffer): Promise<Buffer> {
    const tmpDir = os.tmpdir();
    const inputPath = path.join(tmpDir, `st_input_${Date.now()}.mp4`);
    const outputPath = path.join(tmpDir, `st_output_${Date.now()}.webp`);

    fs.writeFileSync(inputPath, videoBuffer);

    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .inputOptions(['-t 6']) // Limit ke 6 detik untuk performa (WhatsApp limit)
            .outputOptions([
                '-vf', 'scale=512:512:force_original_aspect_ratio=decrease,fps=15,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000',
                '-vcodec', 'libwebp',
                '-lossless', '0',
                '-compression_level', '4',
                '-q:v', '50',
                '-loop', '0',
                '-preset', 'picture',
                '-an', // Hilangkan audio
                '-vsync', '0'
            ])
            .toFormat('webp')
            .on('end', () => {
                const buffer = fs.readFileSync(outputPath);
                // Cleanup
                try {
                    fs.unlinkSync(inputPath);
                    fs.unlinkSync(outputPath);
                } catch (e) {}
                resolve(buffer);
            })
            .on('error', (err) => {
                try {
                    fs.unlinkSync(inputPath);
                    fs.unlinkSync(outputPath);
                } catch (e) {}
                reject(err);
            })
            .save(outputPath);
    });
}

