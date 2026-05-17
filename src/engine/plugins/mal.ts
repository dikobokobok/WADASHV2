import { WAMessage } from '@whiskeysockets/baileys';
import makeWASocket from '@whiskeysockets/baileys';
import { sendWithTyping } from './utils';
import malScraper from 'mal-scraper';

/**
 * Plugin: MyAnimeList Lookup
 *
 * Diadaptasi dari contoh.js untuk arsitektur plugin WADASH.
 * Menggunakan library `mal-scraper` untuk:
 *  - Pencarian anime
 *  - Detail anime via URL
 *  - Daftar anime musiman
 *  - Watchlist user MAL
 *  - Berita terbaru MAL
 */

export const command = ['mal', 'myanimelist', 'anime-mal'];
export const category = 'general';

type Subcommand = 'search' | 'info' | 'season' | 'watchlist' | 'news';

const VALID_SEASONS = ['spring', 'summer', 'fall', 'winter'] as const;
type Season = typeof VALID_SEASONS[number];

const VALID_SEASON_TYPES = [
    'TV', 'TVNew', 'TVCon', 'Movies', 'OVAs', 'ONAs', 'Specials',
] as const;
type SeasonType = typeof VALID_SEASON_TYPES[number];

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

    const sub = parseSubcommand(args[0]);
    const rest = sub ? args.slice(1) : args;
    const action: Subcommand = sub ?? 'search';

    try {
        await sock.sendMessage(jid, { react: { text: '⏳', key: msg.key } });
    } catch (_) {}

    try {
        switch (action) {
            case 'search':
                await handleSearch(sock, jid, msg, rest);
                break;
            case 'info':
                await handleInfo(sock, jid, msg, rest);
                break;
            case 'season':
                await handleSeason(sock, jid, msg, rest);
                break;
            case 'watchlist':
                await handleWatchlist(sock, jid, msg, rest);
                break;
            case 'news':
                await handleNews(sock, jid, msg, rest);
                break;
        }

        try {
            await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } });
        } catch (_) {}
    } catch (error: any) {
        console.error(`[MAL][${action}]`, error);
        await fail(sock, jid, msg, mapError(error));
    }
}

/* =========================================================================
 * Subcommand Handlers
 * =======================================================================*/

async function handleSearch(
    sock: ReturnType<typeof makeWASocket>,
    jid: string,
    msg: WAMessage,
    args: string[]
): Promise<void> {
    const query = args.join(' ').trim();
    if (!query) {
        await fail(sock, jid, msg, '❌ Query kosong. Contoh: *!mal search Naruto*');
        return;
    }

    const results = await withTimeout(
        malScraper.getResultsFromSearch(query),
        20000
    );

    if (!Array.isArray(results) || results.length === 0) {
        await fail(sock, jid, msg, `❌ Tidak ada hasil untuk "${query}".`);
        return;
    }

    const top = results.slice(0, 10);
    const lines: string[] = [];
    lines.push(`🔎 *Hasil Pencarian MAL*: _${query}_`);
    lines.push(`Ditemukan ${results.length} hasil. Menampilkan ${top.length} teratas:\n`);

    top.forEach((item, i) => {
        const score = item.payload?.score ? ` ⭐ ${item.payload.score}` : '';
        const type = item.payload?.media_type ? ` [${item.payload.media_type}]` : '';
        lines.push(`${i + 1}. *${item.name}*${type}${score}`);
    });

    lines.push('');
    lines.push('_Gunakan_: *!mal info <nama anime>* untuk detail lengkap.');

    const thumb = top[0].image_url || top[0].thumbnail_url;
    const text = lines.join('\n');

    if (thumb) {
        try {
            await sock.sendMessage(
                jid,
                { image: { url: thumb }, caption: trim(text, 1000) },
                { quoted: msg }
            );
            return;
        } catch (e) {
            console.error('[MAL][search] gagal kirim image, fallback teks:', e);
        }
    }

    await sendWithTyping(sock, jid, { text }, { quoted: msg });
}

async function handleInfo(
    sock: ReturnType<typeof makeWASocket>,
    jid: string,
    msg: WAMessage,
    args: string[]
): Promise<void> {
    const query = args.join(' ').trim();
    if (!query) {
        await fail(sock, jid, msg, '❌ Query kosong. Contoh: *!mal info Naruto*');
        return;
    }

    // Ambil hasil pencarian dulu, lalu detail dari URL teratas (lebih cepat & akurat)
    const search = await withTimeout(malScraper.getResultsFromSearch(query), 20000);
    if (!Array.isArray(search) || search.length === 0) {
        await fail(sock, jid, msg, `❌ Anime "${query}" tidak ditemukan.`);
        return;
    }

    // SearchResultsDataModel tidak selalu punya `url`, jadi kita konstruksi dari id+type
    const first = search[0] as any;
    const animeUrl: string =
        first.url ||
        (first.id && first.type
            ? `https://myanimelist.net/${first.type}/${first.id}`
            : '');

    let details: any;
    if (animeUrl) {
        details = await withTimeout(malScraper.getInfoFromURL(animeUrl), 25000);
    } else {
        details = await withTimeout(malScraper.getInfoFromName(query, true), 25000);
    }

    if (!details || !details.title) {
        await fail(sock, jid, msg, `❌ Detail anime "${query}" tidak bisa diambil.`);
        return;
    }

    const caption = buildAnimeCaption(details);
    const picture = details.picture as string | undefined;

    if (picture) {
        try {
            await sock.sendMessage(
                jid,
                { image: { url: picture }, caption },
                { quoted: msg }
            );
            return;
        } catch (e) {
            console.error('[MAL][info] gagal kirim image, fallback teks:', e);
        }
    }

    await sendWithTyping(sock, jid, { text: caption }, { quoted: msg });
}

async function handleSeason(
    sock: ReturnType<typeof makeWASocket>,
    jid: string,
    msg: WAMessage,
    args: string[]
): Promise<void> {
    // Format: !mal season [year] [season] [type]
    // Default: tahun & musim sekarang, type TVNew
    const now = new Date();
    let year = now.getFullYear();
    let season: Season = currentSeason(now);
    let type: SeasonType = 'TVNew';

    for (const raw of args) {
        const v = raw.toLowerCase();
        if (/^\d{4}$/.test(v)) {
            year = parseInt(v, 10);
        } else if ((VALID_SEASONS as readonly string[]).includes(v)) {
            season = v as Season;
        } else {
            const matched = VALID_SEASON_TYPES.find(t => t.toLowerCase() === v);
            if (matched) type = matched;
        }
    }

    const data = await withTimeout(
        malScraper.getSeason(year, season, type as any),
        25000
    );

    const list = (data as any)?.[type] ?? [];
    if (!Array.isArray(list) || list.length === 0) {
        await fail(
            sock,
            jid,
            msg,
            `❌ Tidak ada anime ${type} pada musim ${season} ${year}.`
        );
        return;
    }

    const lines: string[] = [];
    lines.push(`📅 *Anime ${type} - ${capitalize(season)} ${year}*`);
    lines.push(`Total: ${list.length} judul. Menampilkan 10 teratas:\n`);

    list.slice(0, 10).forEach((anime: any, i: number) => {
        const score = anime.score ? ` ⭐ ${anime.score}` : '';
        const eps = anime.nbEps ? ` [${anime.nbEps} eps]` : '';
        lines.push(`${i + 1}. *${anime.title}*${eps}${score}`);
    });

    await sendWithTyping(sock, jid, { text: lines.join('\n') }, { quoted: msg });
}

async function handleWatchlist(
    sock: ReturnType<typeof makeWASocket>,
    jid: string,
    msg: WAMessage,
    args: string[]
): Promise<void> {
    const username = args[0]?.trim();
    if (!username) {
        await fail(
            sock,
            jid,
            msg,
            '❌ Username kosong. Contoh: *!mal watchlist Kylart*'
        );
        return;
    }

    const list = await withTimeout(
        malScraper.getWatchListFromUser(username, 0, 'anime'),
        25000
    );

    if (!Array.isArray(list) || list.length === 0) {
        await fail(
            sock,
            jid,
            msg,
            `❌ User *${username}* tidak ditemukan atau watchlist kosong.`
        );
        return;
    }

    const lines: string[] = [];
    lines.push(`📋 *Watchlist MAL — ${username}*`);
    lines.push(`Total: ${list.length} anime. Menampilkan 10 teratas:\n`);

    list.slice(0, 10).forEach((entry: any, i: number) => {
        const status = mapWatchStatus(entry.status);
        const score = entry.score ? ` ⭐ ${entry.score}` : '';
        const eps = entry.numWatchedEpisodes != null && entry.animeNumEpisodes
            ? ` (${entry.numWatchedEpisodes}/${entry.animeNumEpisodes})`
            : '';
        lines.push(`${i + 1}. *${entry.animeTitle}* — ${status}${eps}${score}`);
    });

    await sendWithTyping(sock, jid, { text: lines.join('\n') }, { quoted: msg });
}

async function handleNews(
    sock: ReturnType<typeof makeWASocket>,
    jid: string,
    msg: WAMessage,
    args: string[]
): Promise<void> {
    let count = parseInt(args[0] ?? '5', 10);
    if (!Number.isFinite(count) || count < 1) count = 5;
    if (count > 15) count = 15;

    const news = await withTimeout(malScraper.getNewsNoDetails(count), 25000);

    if (!Array.isArray(news) || news.length === 0) {
        await fail(sock, jid, msg, '❌ Gagal mengambil berita terbaru.');
        return;
    }

    const lines: string[] = [];
    lines.push(`📰 *Berita Terbaru MyAnimeList* (${news.length})\n`);
    news.forEach((n, i) => {
        lines.push(`${i + 1}. *${n.title}*`);
        if (n.text) lines.push(`   _${trim(n.text, 120)}_`);
        if (n.link) lines.push(`   🔗 ${n.link}`);
        lines.push('');
    });

    await sendWithTyping(
        sock,
        jid,
        { text: trim(lines.join('\n').trimEnd(), 3500) },
        { quoted: msg }
    );
}

/* =========================================================================
 * Helpers
 * =======================================================================*/

function parseSubcommand(raw: string): Subcommand | null {
    const s = raw.toLowerCase();
    const map: Record<string, Subcommand> = {
        search: 'search',
        find: 'search',
        info: 'info',
        detail: 'info',
        details: 'info',
        season: 'season',
        seasonal: 'season',
        watchlist: 'watchlist',
        wl: 'watchlist',
        list: 'watchlist',
        news: 'news',
        berita: 'news',
    };
    return map[s] ?? null;
}

function buildUsage(): string {
    return (
        `🎌 *MyAnimeList Lookup*\n\n` +
        `Cari info anime, musiman, watchlist, & berita terbaru dari MAL.\n\n` +
        `*Penggunaan:*\n` +
        `• !mal search <query>           — cari anime\n` +
        `• !mal info <query>             — detail lengkap anime\n` +
        `• !mal season [year] [season] [type]\n` +
        `   season: spring|summer|fall|winter\n` +
        `   type:   TV|TVNew|TVCon|Movies|OVAs|ONAs|Specials\n` +
        `• !mal watchlist <username>     — watchlist user MAL\n` +
        `• !mal news [jumlah]            — berita terbaru (max 15)\n\n` +
        `*Contoh:*\n` +
        `• !mal search Naruto\n` +
        `• !mal info Frieren\n` +
        `• !mal season 2024 winter TVNew\n` +
        `• !mal watchlist Kylart\n` +
        `• !mal news 5`
    );
}

function buildAnimeCaption(d: any): string {
    const lines: string[] = [];
    lines.push(`🎬 *${(d.title ?? 'Unknown').toUpperCase()}*`);
    if (d.englishTitle && d.englishTitle !== d.title) {
        lines.push(`_${d.englishTitle}_`);
    }
    lines.push('');
    if (d.type)        lines.push(`📺 *Type*       : ${d.type}`);
    if (d.episodes)    lines.push(`🔢 *Episodes*   : ${d.episodes}`);
    if (d.status)      lines.push(`📡 *Status*     : ${d.status}`);
    if (d.aired)       lines.push(`📅 *Aired*      : ${d.aired}`);
    if (d.premiered)   lines.push(`🌸 *Premiered*  : ${d.premiered}`);
    if (d.broadcast)   lines.push(`🕒 *Broadcast*  : ${d.broadcast}`);
    if (d.duration)    lines.push(`⏱️ *Duration*   : ${d.duration}`);
    if (d.rating)      lines.push(`🔞 *Rating*     : ${d.rating}`);
    if (d.score)       lines.push(`⭐ *Score*      : ${d.score}`);
    if (d.ranked)      lines.push(`🏆 *Ranked*     : ${d.ranked}`);
    if (d.popularity)  lines.push(`📈 *Popularity* : ${d.popularity}`);
    if (d.members)     lines.push(`👥 *Members*    : ${d.members}`);
    if (d.favorites)   lines.push(`❤️ *Favorites*  : ${d.favorites}`);
    if (d.source)      lines.push(`🧬 *Source*     : ${d.source}`);

    if (Array.isArray(d.studios) && d.studios.length) {
        lines.push(`🏢 *Studios*    : ${d.studios.join(', ')}`);
    }
    if (Array.isArray(d.producers) && d.producers.length) {
        lines.push(`🎥 *Producers*  : ${d.producers.slice(0, 4).join(', ')}`);
    }
    if (Array.isArray(d.genres) && d.genres.length) {
        lines.push(`🎭 *Genres*     : ${d.genres.join(', ')}`);
    }

    if (d.synopsis) {
        lines.push('');
        lines.push(`📝 ${trim(d.synopsis, 500)}`);
    }

    if (d.url) {
        lines.push('');
        lines.push(`🔗 ${d.url}`);
    }

    const out = lines.join('\n');
    return out.length > 1000 ? out.slice(0, 1000) + '\n…(dipotong)' : out;
}

function mapWatchStatus(status: number | undefined): string {
    switch (status) {
        case 1: return 'Watching';
        case 2: return 'Completed';
        case 3: return 'On-Hold';
        case 4: return 'Dropped';
        case 6: return 'Plan to Watch';
        default: return 'Unknown';
    }
}

function currentSeason(d: Date): Season {
    const m = d.getMonth() + 1; // 1..12
    if (m >= 1 && m <= 3) return 'winter';
    if (m >= 4 && m <= 6) return 'spring';
    if (m >= 7 && m <= 9) return 'summer';
    return 'fall';
}

function capitalize(s: string): string {
    return s.length === 0 ? s : s[0].toUpperCase() + s.slice(1);
}

function trim(str: string, max: number): string {
    return str.length > max ? str.slice(0, max).trimEnd() + '…' : str;
}

function mapError(error: any): string {
    if (error?.message && /timeout/i.test(error.message)) {
        return '⏱️ Request timeout. Coba lagi nanti.';
    }
    return `❌ Gagal mengambil data MAL: ${error?.message || 'Unknown error'}`;
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

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    let timer: ReturnType<typeof setTimeout>;
    const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('Connection timeout')), ms);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}
