import { WAMessage } from '@whiskeysockets/baileys';
import makeWASocket from '@whiskeysockets/baileys';
import { sendWithTyping } from './utils';
import { Innertube, Platform } from 'youtubei.js';
import fs from 'fs';
import os from 'os';
import path from 'path';

/**
 * Plugin: YouTube Downloader
 *
 * Diadaptasi dari contoh.js (Innertube + JS interpreter) ke arsitektur plugin
 * WADASH.
 *
 * Catatan implementasi:
 * - youtubei.js v17 mengharuskan kita menyediakan custom JavaScript evaluator
 *   melalui `Platform.shim.eval` untuk men-decipher streaming URL.
 * - Contoh asli memakai library `jinter` (sebenarnya `jintr`) sebagai
 *   sandboxed interpreter. Sayangnya jintr belum mendukung sintaks ES2020+
 *   (mis. ClassExpression) yang dipakai player YouTube saat ini, sehingga kami
 *   menggunakan `new Function()` — pendekatan resmi yang direkomendasikan
 *   dokumentasi youtubei.js — yang aman dijalankan di sisi server Node.
 * - Hasil download dikirim ke WhatsApp sebagai video (mp4) atau audio (m4a),
 *   dibatasi ukuran agar aman dengan limit upload WhatsApp (~64MB).
 */

export const command = ['yt', 'youtube', 'ytmp4', 'ytmp3'];
export const category = 'download';

// Batas ukuran upload WhatsApp ~64MB. Kita pakai 60MB sebagai buffer aman.
const MAX_FILE_SIZE = 60 * 1024 * 1024;

let innertubePromise: Promise<Innertube> | null = null;
let evaluatorRegistered = false;

/**
 * Daftarkan evaluator Jinter ke `Platform.shim.eval` (sekali saja per-process).
 * Library youtubei.js memanggil ini untuk men-decipher URL signature.
 */
function ensureEvaluator(): void {
    if (evaluatorRegistered) return;

    const shim: any = (Platform as any).shim;
    if (!shim) {
        throw new Error('youtubei.js Platform shim tidak tersedia.');
    }

    shim.eval = (data: { output: string }, env: Record<string, any>) => {
        // Pendekatan resmi sesuai dokumentasi youtubei.js. Script player
        // YouTube berisi `return ...` di top-level — `Function` constructor
        // otomatis membungkusnya jadi fungsi sehingga `return` valid.
        // Variabel env diteruskan sebagai argumen fungsi.
        const keys = Object.keys(env);
        const values = keys.map((k) => env[k]);
        const fn = new Function(...keys, data.output);
        return fn(...values);
    };

    evaluatorRegistered = true;
}

/**
 * Inisialisasi Innertube sekali, lalu cache instance-nya.
 */
async function getInnertube(): Promise<Innertube> {
    ensureEvaluator();
    if (!innertubePromise) {
        innertubePromise = Innertube.create({
            generate_session_locally: true,
            retrieve_player: true,
        }).catch((err) => {
            // Reset cache supaya bisa retry pada panggilan berikutnya.
            innertubePromise = null;
            throw err;
        });
    }
    return innertubePromise;
}

export async function execute(
    sock: ReturnType<typeof makeWASocket>,
    msg: WAMessage,
    args: string[],
    _settings: Record<string, any>
): Promise<void> {
    const jid = msg.key.remoteJid!;
    const cmdAlias = (msg.message?.conversation
        || msg.message?.extendedTextMessage?.text
        || '')
        .split(/\s+/)[0]
        .replace(/^[!\.\/]/, '')
        .toLowerCase();

    if (args.length === 0) {
        await sendWithTyping(sock, jid, { text: buildUsage() }, { quoted: msg });
        return;
    }

    // Subcommand: search → cari video
    const first = args[0].toLowerCase();
    if (first === 'search' || first === 'cari') {
        await handleSearch(sock, jid, msg, args.slice(1));
        return;
    }

    // Tentukan tipe download dari alias / argumen pertama
    let mode: 'video' | 'audio';
    let urlOrId: string | undefined;

    if (first === 'mp3' || first === 'audio') {
        mode = 'audio';
        urlOrId = args[1];
    } else if (first === 'mp4' || first === 'video') {
        mode = 'video';
        urlOrId = args[1];
    } else {
        // Tanpa subcommand → tentukan dari alias command yang dipakai
        mode = cmdAlias === 'ytmp3' ? 'audio' : 'video';
        urlOrId = args[0];
    }

    if (!urlOrId) {
        await fail(sock, jid, msg, '❌ URL atau ID YouTube wajib diisi.\n\n' + buildUsage());
        return;
    }

    const videoId = extractVideoId(urlOrId);
    if (!videoId) {
        await fail(
            sock,
            jid,
            msg,
            '❌ URL/ID YouTube tidak valid. Contoh URL yang didukung:\n' +
            '• https://youtu.be/iTJSbJtS8MU\n' +
            '• https://www.youtube.com/watch?v=iTJSbJtS8MU\n' +
            '• https://www.youtube.com/shorts/<id>'
        );
        return;
    }

    try { await sock.sendMessage(jid, { react: { text: '⏳', key: msg.key } }); } catch (_) {}

    let tempFile: string | null = null;
    try {
        const youtube = await getInnertube();
        const info = await youtube.getInfo(videoId);

        const basic = info.basic_info;
        if (basic.is_live) {
            await fail(sock, jid, msg, '❌ Video live stream tidak didukung.');
            return;
        }

        const duration = basic.duration ?? 0;
        if (duration > 60 * 30) {
            await fail(
                sock,
                jid,
                msg,
                `❌ Durasi video terlalu panjang (${formatDuration(duration)}). ` +
                `Maksimal 30 menit.`
            );
            return;
        }

        // Pilih format dengan kualitas terbaik yang masuk batas ukuran
        const format = pickFormat(info, mode);
        if (!format) {
            await fail(sock, jid, msg, '❌ Tidak menemukan format yang cocok untuk diunduh.');
            return;
        }

        const estimatedSize = Number(format.content_length || 0);
        if (estimatedSize && estimatedSize > MAX_FILE_SIZE) {
            await fail(
                sock,
                jid,
                msg,
                `❌ Ukuran file (${formatBytes(estimatedSize)}) melebihi batas ${formatBytes(MAX_FILE_SIZE)} ` +
                `untuk pengiriman WhatsApp. Coba video lain yang lebih pendek.`
            );
            return;
        }

        // Download stream → simpan ke file sementara
        const ext = mode === 'audio' ? 'm4a' : 'mp4';
        tempFile = path.join(os.tmpdir(), `yt_${Date.now()}_${videoId}.${ext}`);

        const stream = await info.download({
            type: mode === 'audio' ? 'audio' : 'video+audio',
            quality: mode === 'audio' ? 'best' : '360p',
            format: 'mp4',
            client: 'WEB',
        });

        await streamToFile(stream, tempFile, MAX_FILE_SIZE);

        // Bangun caption
        const caption = buildCaption(info, mode);

        // Kirim ke WhatsApp
        if (mode === 'audio') {
            await sock.sendMessage(
                jid,
                {
                    audio: { url: tempFile },
                    mimetype: 'audio/mp4',
                    ptt: false,
                },
                { quoted: msg }
            );
            // Kirim caption sebagai pesan terpisah karena audio tidak punya caption
            await sendWithTyping(sock, jid, { text: caption }, { quoted: msg });
        } else {
            await sock.sendMessage(
                jid,
                {
                    video: { url: tempFile },
                    caption,
                    mimetype: 'video/mp4',
                },
                { quoted: msg }
            );
        }

        try { await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } }); } catch (_) {}
    } catch (error: any) {
        console.error('[YouTube]', error);
        await fail(sock, jid, msg, mapError(error));
    } finally {
        if (tempFile) {
            fs.promises.unlink(tempFile).catch(() => {});
        }
    }
}

/* =========================================================================
 * Search Handler
 * =======================================================================*/

async function handleSearch(
    sock: ReturnType<typeof makeWASocket>,
    jid: string,
    msg: WAMessage,
    args: string[]
): Promise<void> {
    const query = args.join(' ').trim();
    if (!query) {
        await fail(sock, jid, msg, '❌ Query kosong. Contoh: *!yt search lofi hip hop*');
        return;
    }

    try { await sock.sendMessage(jid, { react: { text: '🔍', key: msg.key } }); } catch (_) {}

    try {
        const youtube = await getInnertube();
        const results = await youtube.search(query, { type: 'video' });
        const videos = (results.videos ?? []).slice(0, 8);

        if (videos.length === 0) {
            await fail(sock, jid, msg, `❌ Tidak ada hasil untuk "${query}".`);
            return;
        }

        const lines: string[] = [];
        lines.push(`🔍 *Hasil Pencarian YouTube*: _${query}_\n`);
        videos.forEach((v: any, i: number) => {
            const title = v.title?.text ?? v.title ?? 'No Title';
            const author = v.author?.name ?? '-';
            const dur = v.duration?.text ? ` [${v.duration.text}]` : '';
            const views = v.view_count?.text ? ` 👁️ ${v.view_count.text}` : '';
            const id = v.id ?? v.video_id ?? '';
            lines.push(`${i + 1}. *${title}*${dur}`);
            lines.push(`   👤 ${author}${views}`);
            if (id) lines.push(`   🔗 https://youtu.be/${id}`);
            lines.push('');
        });

        lines.push(`_Download_: *!yt mp4 <url>* atau *!yt mp3 <url>*`);

        await sendWithTyping(
            sock,
            jid,
            { text: trim(lines.join('\n').trimEnd(), 3500) },
            { quoted: msg }
        );

        try { await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } }); } catch (_) {}
    } catch (error: any) {
        console.error('[YouTube][search]', error);
        await fail(sock, jid, msg, mapError(error));
    }
}

/* =========================================================================
 * Helpers
 * =======================================================================*/

function buildUsage(): string {
    return (
        `📹 *YouTube Downloader*\n\n` +
        `Download video / audio dari YouTube langsung ke WhatsApp.\n` +
        `Batas durasi: 30 menit, batas ukuran: 60 MB.\n\n` +
        `*Penggunaan:*\n` +
        `• !yt <url>             — download video (default 360p)\n` +
        `• !yt mp4 <url>         — download video\n` +
        `• !yt mp3 <url>         — download audio (m4a)\n` +
        `• !yt search <query>    — cari video\n` +
        `• !ytmp4 <url>          — alias download video\n` +
        `• !ytmp3 <url>          — alias download audio\n\n` +
        `*Contoh:*\n` +
        `• !yt https://youtu.be/iTJSbJtS8MU\n` +
        `• !ytmp3 https://youtu.be/iTJSbJtS8MU\n` +
        `• !yt search lofi hip hop`
    );
}

/**
 * Ekstrak video ID dari berbagai bentuk URL YouTube atau ID mentah.
 */
export function extractVideoId(input: string): string | null {
    const raw = input.trim();

    // Jika sudah berupa ID 11 karakter (a-z, A-Z, 0-9, _, -)
    if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) return raw;

    // Coba parse sebagai URL
    try {
        const url = new URL(raw);
        const host = url.hostname.replace(/^www\./, '');
        if (host === 'youtu.be') {
            const id = url.pathname.slice(1).split('/')[0];
            return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
        }
        if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
            const v = url.searchParams.get('v');
            if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
            const segs = url.pathname.split('/').filter(Boolean);
            // /shorts/<id>, /embed/<id>, /v/<id>, /live/<id>
            if (['shorts', 'embed', 'v', 'live'].includes(segs[0])) {
                const id = segs[1];
                return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
            }
        }
    } catch (_) {
        // bukan URL valid
    }

    // Fallback: pola dari contoh.js
    const m = raw.match(/(?:vi\/|v=|\/v\/|youtu\.be\/|\/embed\/|\/shorts\/)([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : null;
}

/**
 * Pilih format optimal sesuai mode dan batas ukuran.
 */
function pickFormat(info: any, mode: 'video' | 'audio'): any | null {
    try {
        if (mode === 'audio') {
            return info.chooseFormat({
                type: 'audio',
                quality: 'best',
                format: 'mp4',
                language: 'original',
            });
        }
        return info.chooseFormat({
            type: 'video+audio',
            quality: '360p',
            format: 'mp4',
        });
    } catch (_) {
        // chooseFormat akan throw jika tidak ada format yang cocok
        return null;
    }
}

/**
 * Pipe ReadableStream ke file dengan early-exit kalau melewati batas ukuran.
 */
async function streamToFile(
    stream: ReadableStream<Uint8Array>,
    filePath: string,
    maxBytes: number
): Promise<void> {
    const fileStream = fs.createWriteStream(filePath);
    const reader = stream.getReader();
    let total = 0;

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (!value) continue;

            total += value.byteLength;
            if (total > maxBytes) {
                throw new Error(
                    `Ukuran file melebihi batas ${formatBytes(maxBytes)} (sudah ${formatBytes(total)}). Download dibatalkan.`
                );
            }

            fileStream.write(value);
        }
    } finally {
        await new Promise<void>((resolve) => fileStream.end(() => resolve()));
        try { reader.releaseLock(); } catch (_) {}
    }
}

function buildCaption(info: any, mode: 'video' | 'audio'): string {
    const b = info.basic_info ?? {};
    const lines: string[] = [];
    lines.push(`📹 *YouTube ${mode === 'audio' ? 'Audio' : 'Video'} Downloader*`);
    if (b.title)        lines.push(`📝 *${b.title}*`);
    if (b.author)       lines.push(`👤 ${b.author}`);
    if (b.duration)     lines.push(`⏱️ ${formatDuration(b.duration)}`);
    if (b.view_count)   lines.push(`👁️ ${formatCount(b.view_count)} views`);
    if (b.like_count)   lines.push(`❤️ ${formatCount(b.like_count)} likes`);
    if (b.id)           lines.push(`🔗 https://youtu.be/${b.id}`);
    return lines.join('\n');
}

function formatDuration(seconds: number): string {
    if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
}

function formatBytes(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    let n = bytes;
    while (n >= 1024 && i < units.length - 1) {
        n /= 1024;
        i++;
    }
    return `${n.toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
}

function formatCount(num: number): string {
    if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
    return num.toString();
}

function trim(str: string, max: number): string {
    return str.length > max ? str.slice(0, max).trimEnd() + '…' : str;
}

function mapError(error: any): string {
    const message = String(error?.message ?? error);
    if (/timeout/i.test(message)) {
        return '⏱️ Request timeout. Coba lagi nanti.';
    }
    if (/UnavailableContentError|video unavailable|not available/i.test(message)) {
        return '❌ Video tidak tersedia atau dibatasi region.';
    }
    if (/age-restricted|sign in/i.test(message)) {
        return '❌ Video ini memerlukan login (age-restricted), tidak bisa di-download.';
    }
    if (/decipher/i.test(message)) {
        return '❌ Gagal decipher URL. Coba lagi nanti — kemungkinan YouTube baru update player.';
    }
    return `❌ Gagal download: ${trim(message, 200)}`;
}

async function fail(
    sock: ReturnType<typeof makeWASocket>,
    jid: string,
    msg: WAMessage,
    text: string
): Promise<void> {
    await sendWithTyping(sock, jid, { text }, { quoted: msg });
    try { await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } }); } catch (_) {}
}
