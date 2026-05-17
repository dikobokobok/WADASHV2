import { WAMessage } from '@whiskeysockets/baileys';
import makeWASocket from '@whiskeysockets/baileys';
import { sendWithTyping } from './utils';
import { AnimeWallpaper, AnimeSource } from 'anime-wallpaper';
import type { dataImageFormat, live2D } from 'anime-wallpaper/dist/typing';

const wall = new AnimeWallpaper();

export const command = ['wallpaper', 'wp', 'anime'];
export const category = 'download';

type Source = 'wallhaven' | 'zerochan' | 'wallpapers' | 'pinterest' | 'random' | 'live2d';

export async function execute(
    sock: ReturnType<typeof makeWASocket>,
    msg: WAMessage,
    args: string[],
    _settings: Record<string, any>
): Promise<void> {
    const jid = msg.key.remoteJid!;

    // Tanpa argumen → tampilkan panduan
    if (args.length === 0) {
        await sendWithTyping(sock, jid, { text: buildUsage() }, { quoted: msg });
        return;
    }

    // Parse subcommand: kata pertama bisa berupa source, atau langsung query
    const first = args[0].toLowerCase();
    let source: Source;
    let query: string;

    const sources: Record<string, Source> = {
        wallhaven: 'wallhaven',
        wh: 'wallhaven',
        zerochan: 'zerochan',
        zc: 'zerochan',
        wallpapers: 'wallpapers',
        pinterest: 'pinterest',
        pin: 'pinterest',
        random: 'random',
        rand: 'random',
        live2d: 'live2d',
        l2d: 'live2d',
    };

    if (first in sources) {
        source = sources[first];
        query = args.slice(1).join(' ').trim();
    } else {
        // Default: WallHaven
        source = 'wallhaven';
        query = args.join(' ').trim();
    }

    // Validasi: source non-random butuh query
    if (source !== 'random' && !query) {
        await sendWithTyping(
            sock,
            jid,
            { text: `❌ Query kosong. Contoh: *!wallpaper ${source} firefly honkai*` },
            { quoted: msg }
        );
        return;
    }

    // Reaksi loading
    try { await sock.sendMessage(jid, { react: { text: '⏳', key: msg.key } }); } catch (_) {}

    try {
        if (source === 'live2d') {
            const results = await withTimeout(wall.live2d(query), 30000);
            if (!results || results.length === 0) {
                await fail(sock, jid, msg, '❌ Tidak ada hasil Live2D ditemukan.');
                return;
            }
            await sendLive2D(sock, jid, msg, pickRandom(results), query);
        } else {
            let results: dataImageFormat[];

            switch (source) {
                case 'random':
                    results = await withTimeout(wall.random(), 30000);
                    break;
                case 'pinterest':
                    results = await withTimeout(wall.pinterest(query), 30000);
                    break;
                case 'wallhaven':
                    results = await withTimeout(
                        wall.search(
                            { title: query, page: '1', type: 'sfw', aiArt: true },
                            AnimeSource.WallHaven
                        ),
                        30000
                    );
                    break;
                case 'zerochan':
                    results = await withTimeout(
                        wall.search({ title: query }, AnimeSource.ZeroChan),
                        30000
                    );
                    break;
                case 'wallpapers':
                    results = await withTimeout(
                        wall.search({ title: query }, AnimeSource.Wallpapers),
                        30000
                    );
                    break;
                default:
                    results = [];
            }

            if (!results || results.length === 0) {
                await fail(sock, jid, msg, '❌ Tidak ada hasil ditemukan. Coba kata kunci lain.');
                return;
            }

            await sendImage(sock, jid, msg, pickRandom(results), source, query);
        }

        try { await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } }); } catch (_) {}
    } catch (error: any) {
        console.error('[Wallpaper]', error);
        const message = error?.message && /timeout/i.test(error.message)
            ? '⏱️ Request timeout. Coba lagi nanti.'
            : `❌ Gagal mengambil wallpaper: ${error?.message || 'Unknown error'}`;
        await fail(sock, jid, msg, message);
    }
}

/**
 * Bangun teks panduan penggunaan.
 */
function buildUsage(): string {
    return (
        `🖼️ *Anime Wallpaper Downloader*\n\n` +
        `Cari wallpaper anime dari berbagai sumber.\n\n` +
        `*Penggunaan:*\n` +
        `• !wallpaper <query>            (default: WallHaven)\n` +
        `• !wallpaper wh <query>         (WallHaven)\n` +
        `• !wallpaper zc <query>         (ZeroChan)\n` +
        `• !wallpaper wallpapers <query> (Wallpapers.com)\n` +
        `• !wallpaper pin <query>        (Pinterest)\n` +
        `• !wallpaper random             (Hqdwalls random)\n` +
        `• !wallpaper live2d <query>     (Moe Walls — video)\n\n` +
        `*Contoh:*\n` +
        `• !wallpaper firefly honkai\n` +
        `• !wallpaper l2d Jane Doe\n` +
        `• !wp pin Ellen Joe`
    );
}

/**
 * Kirim wallpaper berbentuk gambar.
 */
async function sendImage(
    sock: ReturnType<typeof makeWASocket>,
    jid: string,
    msg: WAMessage,
    item: dataImageFormat,
    source: Source,
    query: string
): Promise<void> {
    const url = item.image || item.thumbnail;
    if (!url) {
        await fail(sock, jid, msg, '❌ URL gambar tidak tersedia pada hasil.');
        return;
    }

    const caption =
        `🖼️ *Anime Wallpaper*\n\n` +
        (item.title ? `📝 ${item.title}\n` : '') +
        `🌐 Source: ${prettySource(source)}\n` +
        (query ? `🔎 Query: ${query}` : '');

    await sock.sendMessage(
        jid,
        {
            image: { url },
            caption: caption.trim(),
        },
        { quoted: msg }
    );
}

/**
 * Kirim wallpaper Live2D (video) dari Moe Walls.
 */
async function sendLive2D(
    sock: ReturnType<typeof makeWASocket>,
    jid: string,
    msg: WAMessage,
    item: live2D,
    query: string
): Promise<void> {
    const videoUrl = item.video;
    const thumbUrl = item.thumbnail;

    const caption =
        `🎞️ *Live2D Wallpaper*\n\n` +
        (item.title ? `📝 ${item.title}\n` : '') +
        `🌐 Source: Moe Walls\n` +
        `🔎 Query: ${query}` +
        (item.url ? `\n🔗 ${item.url}` : '');

    if (videoUrl) {
        await sock.sendMessage(
            jid,
            {
                video: { url: videoUrl },
                caption: caption.trim(),
                mimetype: 'video/mp4',
                gifPlayback: true,
            },
            { quoted: msg }
        );
        return;
    }

    // Fallback ke thumbnail apabila tidak ada video
    if (thumbUrl) {
        await sock.sendMessage(
            jid,
            {
                image: { url: thumbUrl },
                caption: (caption + '\n\n⚠️ Video tidak tersedia, mengirim thumbnail.').trim(),
            },
            { quoted: msg }
        );
        return;
    }

    await fail(sock, jid, msg, '❌ Hasil Live2D tidak memiliki media yang bisa dikirim.');
}

/**
 * Kirim pesan gagal sekaligus reaksi error.
 */
async function fail(
    sock: ReturnType<typeof makeWASocket>,
    jid: string,
    msg: WAMessage,
    text: string
): Promise<void> {
    await sendWithTyping(sock, jid, { text }, { quoted: msg });
    try { await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } }); } catch (_) {}
}

/**
 * Ambil elemen acak dari array.
 */
function pickRandom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Format nama sumber untuk caption.
 */
function prettySource(source: Source): string {
    switch (source) {
        case 'wallhaven': return 'WallHaven';
        case 'zerochan': return 'ZeroChan';
        case 'wallpapers': return 'Wallpapers.com';
        case 'pinterest': return 'Pinterest';
        case 'random': return 'Hqdwalls (random)';
        case 'live2d': return 'Moe Walls';
    }
}

/**
 * Timeout wrapper untuk promise.
 */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    let timer: ReturnType<typeof setTimeout>;
    const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('Connection timeout')), ms);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}
