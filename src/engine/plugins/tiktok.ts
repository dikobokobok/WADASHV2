import { WAMessage } from '@whiskeysockets/baileys';
import makeWASocket from '@whiskeysockets/baileys';
import { sendWithTyping } from './utils';
import senna from 'api-dylux';

export const command = ['tiktok', 'tt', 'ttdl'];
export const category = 'download';

export async function execute(
    sock: ReturnType<typeof makeWASocket>,
    msg: WAMessage,
    args: string[],
    _settings: Record<string, any>
): Promise<void> {
    const jid = msg.key.remoteJid!;

    // Validasi: harus ada URL
    if (args.length === 0) {
        const usageText =
            `📥 *TikTok Downloader*\n\n` +
            `Gunakan perintah ini untuk mendownload video TikTok tanpa watermark.\n\n` +
            `Usage:\n` +
            `• !tiktok <url>\n` +
            `• !tt <url>\n\n` +
            `Contoh:\n` +
            `• !tiktok https://vt.tiktok.com/ZSuh9Q5Ug/`;
        await sendWithTyping(sock, jid, { text: usageText }, { quoted: msg });
        return;
    }

    const url = args[0];

    // Validasi format URL TikTok
    if (!isTikTokUrl(url)) {
        await sendWithTyping(
            sock,
            jid,
            { text: '❌ URL tidak valid. Pastikan kamu mengirim link TikTok yang benar.' },
            { quoted: msg }
        );
        return;
    }

    // Kirim pesan "sedang memproses"
    await sendWithTyping(sock, jid, { text: '⏳ Sedang memproses video TikTok...' }, { quoted: msg });

    try {
        const res = await withTimeout(senna.tiktok(url), 30000);

        if (!res || !res.result) {
            await sendWithTyping(sock, jid, { text: '❌ Gagal mengambil data dari TikTok.' }, { quoted: msg });
            return;
        }

        const data = res.result;

        // Video tanpa watermark ada di `play`, fallback ke `wmplay`
        const videoUrl = data.play || data.wmplay;

        if (!videoUrl) {
            await sendWithTyping(
                sock,
                jid,
                { text: '❌ Video tidak ditemukan. Mungkin link sudah expired atau tidak valid.' },
                { quoted: msg }
            );
            return;
        }

        // Bangun caption dari metadata
        const title = data.title || data.content_desc?.join(' ') || '';
        const author = data.author?.nickname || data.author?.unique_id || 'Unknown';
        const duration = data.duration ? `${data.duration}s` : '';
        const stats = [
            data.play_count != null ? `▶️ ${formatCount(data.play_count)}` : '',
            data.digg_count != null ? `❤️ ${formatCount(data.digg_count)}` : '',
            data.comment_count != null ? `💬 ${formatCount(data.comment_count)}` : '',
            data.share_count != null ? `🔗 ${formatCount(data.share_count)}` : '',
        ].filter(Boolean).join('  ');

        const caption =
            `🎬 *TikTok Downloader*\n\n` +
            (title ? `� ${title}\n` : '') +
            `�👤 ${author}\n` +
            (duration ? `⏱️ ${duration}\n` : '') +
            (stats ? `\n${stats}` : '');

        // Kirim video tanpa watermark
        await sock.sendMessage(
            jid,
            {
                video: { url: videoUrl },
                caption: caption.trim(),
                mimetype: 'video/mp4',
            },
            { quoted: msg }
        );

        // Kirim audio/musik jika tersedia
        const musicUrl = data.music || data.music_info?.play;
        if (musicUrl) {
            await sock.sendMessage(
                jid,
                {
                    audio: { url: musicUrl },
                    mimetype: 'audio/mpeg',
                    ptt: false,
                },
                { quoted: msg }
            );
        }
    } catch (error: any) {
        console.error('[TikTok]', error);

        if (error.message && /timeout/i.test(error.message)) {
            await sendWithTyping(sock, jid, { text: '⏱️ Request timeout. Coba lagi nanti.' }, { quoted: msg });
        } else {
            await sendWithTyping(
                sock,
                jid,
                { text: `❌ Gagal download: ${error.message || 'Unknown error'}` },
                { quoted: msg }
            );
        }
    }
}

/**
 * Validasi apakah string merupakan URL TikTok yang valid.
 */
export function isTikTokUrl(url: string): boolean {
    try {
        const parsed = new URL(url);
        const validHosts = [
            'tiktok.com',
            'www.tiktok.com',
            'vt.tiktok.com',
            'vm.tiktok.com',
            'm.tiktok.com',
        ];
        return validHosts.some(host => parsed.hostname === host || parsed.hostname.endsWith('.' + host));
    } catch {
        return false;
    }
}

/**
 * Timeout wrapper untuk promise.
 */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    let timer: ReturnType<typeof setTimeout>;

    const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
            reject(new Error('Connection timeout'));
        }, ms);
    });

    return Promise.race([promise, timeout]).finally(() => {
        clearTimeout(timer);
    });
}

/**
 * Format angka besar menjadi singkatan (1000 → 1K, 1000000 → 1M)
 */
function formatCount(num: number): string {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
    return num.toString();
}
