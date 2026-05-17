import { WAMessage } from '@whiskeysockets/baileys';
import makeWASocket from '@whiskeysockets/baileys';
import { sendWithTyping } from './utils';
import primbon from 'primbon-scraper';

/**
 * Plugin: Primbon Scraper
 *
 * Diadaptasi dari contoh.js untuk arsitektur plugin WADASH.
 * Mengintegrasikan 10 fitur scraper Primbon:
 *  1. Arti nama
 *  2. Tafsir mimpi
 *  3. Kecocokan nama pasangan (jodoh)
 *  4. Karakteristik tanggal jadian / pernikahan
 *  5. Watak & karakter artis / tokoh
 *  6. Ramalan jodoh (weton berpasangan)
 *  7. Ramalan rezeki & hoki (Pal Srigati)
 *  8. Kecocokan nama dengan tanggal lahir
 *  9. Hari baik (Petung Kamarokam)
 * 10. Hari larangan / naas
 */

export const command = ['primbon', 'pb'];
export const category = 'general';

type Subcommand =
    | 'artinama'
    | 'tafsirmimpi'
    | 'jodoh'
    | 'tanggaljadi'
    | 'watakartis'
    | 'ramalanjodoh'
    | 'rejekiweton'
    | 'kecocokannama'
    | 'haribaik'
    | 'harilarangan';

const SUBCOMMAND_MAP: Record<string, Subcommand> = {
    // Arti nama
    artinama: 'artinama',
    nama: 'artinama',
    arti: 'artinama',
    // Tafsir mimpi
    tafsirmimpi: 'tafsirmimpi',
    mimpi: 'tafsirmimpi',
    tafsir: 'tafsirmimpi',
    // Kecocokan nama pasangan
    jodoh: 'jodoh',
    cinta: 'jodoh',
    pasangan: 'jodoh',
    // Tanggal jadian
    tanggaljadi: 'tanggaljadi',
    tgljadi: 'tanggaljadi',
    nikah: 'tanggaljadi',
    // Watak artis
    watakartis: 'watakartis',
    artis: 'watakartis',
    watak: 'watakartis',
    // Ramalan jodoh weton
    ramalanjodoh: 'ramalanjodoh',
    weton: 'ramalanjodoh',
    rj: 'ramalanjodoh',
    // Rezeki weton
    rejekiweton: 'rejekiweton',
    rezeki: 'rejekiweton',
    hoki: 'rejekiweton',
    // Kecocokan nama
    kecocokannama: 'kecocokannama',
    cocoknama: 'kecocokannama',
    numerologi: 'kecocokannama',
    // Hari baik
    haribaik: 'haribaik',
    haribagus: 'haribaik',
    // Hari larangan
    harilarangan: 'harilarangan',
    harinaas: 'harilarangan',
    larangan: 'harilarangan',
};

export async function execute(
    sock: ReturnType<typeof makeWASocket>,
    msg: WAMessage,
    args: string[],
    _settings: Record<string, any>
): Promise<void> {
    const jid = msg.key.remoteJid!;

    if (args.length === 0) {
        await sendWithTyping(sock, jid, { text: buildUsage() }, { quoted: msg });
        return;
    }

    const sub = SUBCOMMAND_MAP[args[0].toLowerCase()];
    if (!sub) {
        await sendWithTyping(
            sock,
            jid,
            { text: `❌ Subcommand "${args[0]}" tidak dikenali.\n\n${buildUsage()}` },
            { quoted: msg }
        );
        return;
    }

    const rest = args.slice(1);

    try {
        await sock.sendMessage(jid, { react: { text: '🔮', key: msg.key } });
    } catch (_) {}

    try {
        switch (sub) {
            case 'artinama':       await handleArtiNama(sock, jid, msg, rest); break;
            case 'tafsirmimpi':    await handleTafsirMimpi(sock, jid, msg, rest); break;
            case 'jodoh':          await handleJodoh(sock, jid, msg, rest); break;
            case 'tanggaljadi':    await handleTanggalJadi(sock, jid, msg, rest); break;
            case 'watakartis':     await handleWatakArtis(sock, jid, msg, rest); break;
            case 'ramalanjodoh':   await handleRamalanJodoh(sock, jid, msg, rest); break;
            case 'rejekiweton':    await handleRejekiWeton(sock, jid, msg, rest); break;
            case 'kecocokannama':  await handleKecocokanNama(sock, jid, msg, rest); break;
            case 'haribaik':       await handleHariBaik(sock, jid, msg, rest); break;
            case 'harilarangan':   await handleHariLarangan(sock, jid, msg, rest); break;
        }

        try {
            await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } });
        } catch (_) {}
    } catch (error: any) {
        console.error(`[Primbon][${sub}]`, error);
        await fail(sock, jid, msg, mapError(error));
    }
}

/* =========================================================================
 * Handlers
 * =======================================================================*/

async function handleArtiNama(
    sock: ReturnType<typeof makeWASocket>,
    jid: string,
    msg: WAMessage,
    args: string[]
): Promise<void> {
    const nama = args.join(' ').trim();
    if (!nama) {
        await fail(sock, jid, msg, '❌ Nama kosong. Contoh: *!primbon artinama izo*');
        return;
    }

    const result = await withTimeout(primbon.artiNama(nama), 25000);
    const text =
        `📛 *ARTI NAMA: ${nama.toUpperCase()}*\n\n` +
        cleanText(result);

    await sendWithTyping(sock, jid, { text: trim(text, 3500) }, { quoted: msg });
}

async function handleTafsirMimpi(
    sock: ReturnType<typeof makeWASocket>,
    jid: string,
    msg: WAMessage,
    args: string[]
): Promise<void> {
    const kata = args.join(' ').trim();
    if (!kata) {
        await fail(sock, jid, msg, '❌ Kata kunci kosong. Contoh: *!primbon mimpi hantu*');
        return;
    }

    const result = await withTimeout(primbon.tafsirMimpi(kata), 25000);
    const text =
        `🌙 *TAFSIR MIMPI: ${kata.toUpperCase()}*\n\n` +
        cleanText(result);

    await sendWithTyping(sock, jid, { text: trim(text, 3500) }, { quoted: msg });
}

async function handleJodoh(
    sock: ReturnType<typeof makeWASocket>,
    jid: string,
    msg: WAMessage,
    args: string[]
): Promise<void> {
    // Format: !primbon jodoh <nama1> | <nama2>
    const joined = args.join(' ').trim();
    const parts = splitPipe(joined, 2);
    if (parts.length < 2) {
        await fail(
            sock,
            jid,
            msg,
            '❌ Format salah. Contoh: *!primbon jodoh acil | manda*'
        );
        return;
    }

    const [nama1, nama2] = parts;
    const result = await withTimeout(primbon.Jodoh(nama1, nama2), 25000);

    const caption =
        `💖 *KECOCOKAN NAMA PASANGAN*\n\n` +
        `👤 *Nama Anda*    : ${result.namaAnda}\n` +
        `👥 *Nama Pasangan*: ${result.namaPasangan}\n\n` +
        `✨ *Sifat Positif*:\n${cleanText(result.positif)}\n\n` +
        `⚠️ *Sifat Negatif*:\n${cleanText(result.negatif)}`;

    if (result.love && /^https?:\/\//.test(result.love)) {
        try {
            await sock.sendMessage(
                jid,
                { image: { url: result.love }, caption: trim(caption, 1000) },
                { quoted: msg }
            );
            return;
        } catch (e) {
            console.error('[Primbon][jodoh] gagal kirim image, fallback teks:', e);
        }
    }

    await sendWithTyping(sock, jid, { text: trim(caption, 3500) }, { quoted: msg });
}

async function handleTanggalJadi(
    sock: ReturnType<typeof makeWASocket>,
    jid: string,
    msg: WAMessage,
    args: string[]
): Promise<void> {
    const tgl = args[0]?.trim();
    if (!isValidDate(tgl)) {
        await fail(
            sock,
            jid,
            msg,
            '❌ Tanggal tidak valid. Format: *D-M-YYYY*\nContoh: *!primbon tanggaljadi 1-7-2000*'
        );
        return;
    }

    const result = await withTimeout(primbon.tanggaljadi(tgl), 25000);
    const text =
        `💍 *KARAKTERISTIK TANGGAL JADIAN/PERNIKAHAN*\n` +
        `📅 ${tgl}\n\n` +
        cleanText(result);

    await sendWithTyping(sock, jid, { text: trim(text, 3500) }, { quoted: msg });
}

async function handleWatakArtis(
    sock: ReturnType<typeof makeWASocket>,
    jid: string,
    msg: WAMessage,
    args: string[]
): Promise<void> {
    // Format: !primbon watakartis <nama> | <tanggal>
    const joined = args.join(' ').trim();
    const parts = splitPipe(joined, 2);
    if (parts.length < 2) {
        await fail(
            sock,
            jid,
            msg,
            '❌ Format salah. Contoh:\n*!primbon watakartis Michelle Ziudith | 20-1-1995*'
        );
        return;
    }

    const [nama, tgl] = parts;
    if (!isValidDate(tgl)) {
        await fail(
            sock,
            jid,
            msg,
            '❌ Tanggal lahir tidak valid. Format: *D-M-YYYY* (contoh: 20-1-1995)'
        );
        return;
    }

    const result = await withTimeout(primbon.watakartis(nama, tgl), 30000);
    const text =
        `🎬 *WATAK & KARAKTER: ${nama.toUpperCase()}*\n\n` +
        cleanText(result);

    await sendWithTyping(sock, jid, { text: trim(text, 3500) }, { quoted: msg });
}

async function handleRamalanJodoh(
    sock: ReturnType<typeof makeWASocket>,
    jid: string,
    msg: WAMessage,
    args: string[]
): Promise<void> {
    // Format: !primbon ramalanjodoh <nama1> | <tgl1> | <nama2> | <tgl2>
    const joined = args.join(' ').trim();
    const parts = splitPipe(joined, 4);
    if (parts.length < 4) {
        await fail(
            sock,
            jid,
            msg,
            '❌ Format salah. Contoh:\n*!primbon ramalanjodoh joe | 11-4-2003 | putri | 1-2-2005*'
        );
        return;
    }

    const [nama1, tgl1, nama2, tgl2] = parts;
    if (!isValidDate(tgl1) || !isValidDate(tgl2)) {
        await fail(
            sock,
            jid,
            msg,
            '❌ Tanggal tidak valid. Format: *D-M-YYYY*'
        );
        return;
    }

    const result = await withTimeout(
        primbon.ramalanjodoh(nama1, tgl1, nama2, tgl2),
        30000
    );

    const text =
        `💞 *RAMALAN JODOH (WETON BERPASANGAN)*\n` +
        `👤 ${nama1} (${tgl1})\n` +
        `👥 ${nama2} (${tgl2})\n\n` +
        cleanText(result);

    await sendWithTyping(sock, jid, { text: trim(text, 3500) }, { quoted: msg });
}

async function handleRejekiWeton(
    sock: ReturnType<typeof makeWASocket>,
    jid: string,
    msg: WAMessage,
    args: string[]
): Promise<void> {
    const tgl = args[0]?.trim();
    if (!isValidDate(tgl)) {
        await fail(
            sock,
            jid,
            msg,
            '❌ Tanggal tidak valid. Format: *D-M-YYYY*\nContoh: *!primbon rezeki 11-1-2000*'
        );
        return;
    }

    const result = await withTimeout(primbon.rejekiweton(tgl), 30000);
    const caption =
        `💰 *RAMALAN REZEKI & HOKI*\n` +
        `📅 ${tgl}\n\n` +
        cleanText(result.penjelasan);

    if (result.statistik && /^https?:\/\//.test(result.statistik)) {
        try {
            await sock.sendMessage(
                jid,
                { image: { url: result.statistik }, caption: trim(caption, 1000) },
                { quoted: msg }
            );
            return;
        } catch (e) {
            console.error('[Primbon][rejeki] gagal kirim image, fallback teks:', e);
        }
    }

    await sendWithTyping(sock, jid, { text: trim(caption, 3500) }, { quoted: msg });
}

async function handleKecocokanNama(
    sock: ReturnType<typeof makeWASocket>,
    jid: string,
    msg: WAMessage,
    args: string[]
): Promise<void> {
    // Format: !primbon kecocokannama <nama> | <tanggal>
    const joined = args.join(' ').trim();
    const parts = splitPipe(joined, 2);
    if (parts.length < 2) {
        await fail(
            sock,
            jid,
            msg,
            '❌ Format salah. Contoh:\n*!primbon kecocokannama angel | 18-5-2005*'
        );
        return;
    }

    const [nama, tgl] = parts;
    if (!isValidDate(tgl)) {
        await fail(
            sock,
            jid,
            msg,
            '❌ Tanggal lahir tidak valid. Format: *D-M-YYYY*'
        );
        return;
    }

    const result = await withTimeout(primbon.kecocokannama(nama, tgl), 25000);
    const text =
        `🔮 *KECOCOKAN NAMA & TANGGAL LAHIR*\n` +
        `👤 ${nama}\n` +
        `📅 ${tgl}\n\n` +
        cleanText(result);

    await sendWithTyping(sock, jid, { text: trim(text, 3500) }, { quoted: msg });
}

async function handleHariBaik(
    sock: ReturnType<typeof makeWASocket>,
    jid: string,
    msg: WAMessage,
    args: string[]
): Promise<void> {
    const tgl = args[0]?.trim();
    if (!isValidDate(tgl)) {
        await fail(
            sock,
            jid,
            msg,
            '❌ Tanggal tidak valid. Format: *D-M-YYYY*\nContoh: *!primbon haribaik 1-1-2000*'
        );
        return;
    }

    const result = await withTimeout(primbon.haribaik(tgl), 25000);
    const text =
        `🌟 *PETUNG HARI BAIK (KAMAROKAM)*\n` +
        `📅 ${tgl}\n\n` +
        cleanText(result);

    await sendWithTyping(sock, jid, { text: trim(text, 3500) }, { quoted: msg });
}

async function handleHariLarangan(
    sock: ReturnType<typeof makeWASocket>,
    jid: string,
    msg: WAMessage,
    args: string[]
): Promise<void> {
    const tgl = args[0]?.trim();
    if (!isValidDate(tgl)) {
        await fail(
            sock,
            jid,
            msg,
            '❌ Tanggal tidak valid. Format: *D-M-YYYY*\nContoh: *!primbon harilarangan 1-1-2000*'
        );
        return;
    }

    const result = await withTimeout(primbon.harilarangan(tgl), 25000);
    const text =
        `⚠️ *HARI LARANGAN / NAAS*\n` +
        `📅 ${tgl}\n\n` +
        cleanText(result);

    await sendWithTyping(sock, jid, { text: trim(text, 3500) }, { quoted: msg });
}

/* =========================================================================
 * Helpers
 * =======================================================================*/

function buildUsage(): string {
    return (
        `🔮 *Primbon Scraper*\n\n` +
        `Bermacam-macam ramalan dari Primbon.com.\n` +
        `Format tanggal: *D-M-YYYY* (contoh: 1-7-2000)\n\n` +
        `*Subcommand:*\n` +
        `• !pb artinama <nama>\n` +
        `• !pb mimpi <kata kunci>\n` +
        `• !pb jodoh <nama1> | <nama2>\n` +
        `• !pb tanggaljadi <tanggal>\n` +
        `• !pb watakartis <nama> | <tanggal>\n` +
        `• !pb ramalanjodoh <nama1> | <tgl1> | <nama2> | <tgl2>\n` +
        `• !pb rezeki <tanggal>\n` +
        `• !pb kecocokannama <nama> | <tanggal>\n` +
        `• !pb haribaik <tanggal>\n` +
        `• !pb harilarangan <tanggal>\n\n` +
        `*Contoh:*\n` +
        `• !pb artinama izo\n` +
        `• !pb mimpi hantu\n` +
        `• !pb jodoh acil | manda\n` +
        `• !pb rezeki 11-1-2000`
    );
}

/**
 * Pisah string berdasarkan `|` dengan jumlah maksimal bagian.
 * Setiap bagian akan di-trim. Bagian kosong akan dibuang.
 */
function splitPipe(input: string, maxParts: number): string[] {
    return input
        .split('|')
        .map(p => p.trim())
        .filter(p => p.length > 0)
        .slice(0, maxParts);
}

/**
 * Validasi format tanggal `D-M-YYYY` (atau `DD-MM-YYYY`).
 */
function isValidDate(s: string | undefined): s is string {
    if (!s) return false;
    const m = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (!m) return false;
    const day = parseInt(m[1], 10);
    const month = parseInt(m[2], 10);
    const year = parseInt(m[3], 10);
    if (day < 1 || day > 31) return false;
    if (month < 1 || month > 12) return false;
    if (year < 1900 || year > 2100) return false;
    return true;
}

/**
 * Bersihkan teks hasil scraping dari noise (adsbygoogle, whitespace berlebih).
 */
function cleanText(s: string): string {
    if (!s) return '';
    return s
        .replace(/\(adsbygoogle\s*=\s*window\.adsbygoogle\s*\|\|\s*\[\]\)\.push\(\{\}\);?/g, '')
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/[ \t]{2,}/g, ' ')
        .trim();
}

function trim(str: string, max: number): string {
    return str.length > max ? str.slice(0, max).trimEnd() + '…' : str;
}

function mapError(error: any): string {
    if (error?.message && /timeout/i.test(error.message)) {
        return '⏱️ Request timeout. Server Primbon lambat, coba lagi nanti.';
    }
    if (error?.response?.status === 500 || /status code 500/i.test(error?.message ?? '')) {
        return '❌ Server Primbon mengalami error (500). Coba ubah parameter atau coba lagi nanti.';
    }
    return `❌ Gagal mengambil data Primbon: ${error?.message || 'Unknown error'}`;
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
