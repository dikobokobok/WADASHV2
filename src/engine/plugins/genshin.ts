import { WAMessage } from '@whiskeysockets/baileys';
import makeWASocket from '@whiskeysockets/baileys';
import { sendWithTyping } from './utils';

/**
 * Plugin: Genshin Impact Character Lookup
 *
 * Mengambil data karakter dari API publik genshin.jmp.blue.
 * Implementasi menggunakan `fetch` native (Node 18+) tanpa dependency tambahan
 * agar kompatibel dengan bundler Next.js.
 */

export const command = ['genshin', 'gi', 'genshinchar'];
export const category = 'general';

const API_BASE = 'https://genshin.jmp.blue';

interface SkillTalent {
    name: string;
    unlock: string;
    description: string;
    type?: string;
}

interface PassiveTalent {
    name: string;
    unlock?: string;
    description: string;
    level?: number;
}

interface Constellation {
    name: string;
    unlock: string;
    description: string;
    level: number;
}

interface GenshinCharacter {
    name: string;
    title?: string;
    vision: string;
    weapon: string;
    nation: string;
    affiliation: string;
    rarity: number;
    constellation?: string;
    birthday: string;
    description: string;
    specialDish?: string;
    skillTalents: SkillTalent[];
    passiveTalents: PassiveTalent[];
    constellations: Constellation[];
}

interface ApiError {
    error: string;
}

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

    // Subcommand: list / all → daftar nama karakter
    const first = args[0].toLowerCase();
    if (first === 'list' || first === 'all') {
        try { await sock.sendMessage(jid, { react: { text: '⏳', key: msg.key } }); } catch (_) {}
        try {
            const list = await fetchJson<string[]>(`${API_BASE}/characters`);
            if (!Array.isArray(list) || list.length === 0) {
                await fail(sock, jid, msg, '❌ Gagal mengambil daftar karakter.');
                return;
            }
            const text =
                `📜 *Daftar Karakter Genshin Impact* (${list.length})\n\n` +
                list.map((n, i) => `${i + 1}. ${n}`).join('\n') +
                `\n\n_Gunakan_: *!genshin <nama>*`;
            await sendWithTyping(sock, jid, { text }, { quoted: msg });
            try { await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } }); } catch (_) {}
        } catch (error: any) {
            console.error('[Genshin][list]', error);
            await fail(sock, jid, msg, mapError(error));
        }
        return;
    }

    // Cari karakter berdasarkan nama
    const rawQuery = args.join(' ').trim();
    const slug = toCharacterSlug(rawQuery);

    if (!slug) {
        await fail(sock, jid, msg, '❌ Nama karakter tidak valid.');
        return;
    }

    try { await sock.sendMessage(jid, { react: { text: '⏳', key: msg.key } }); } catch (_) {}

    try {
        const url = `${API_BASE}/characters/${encodeURIComponent(slug)}`;
        const result = await fetchJson<GenshinCharacter | ApiError>(url);

        if (!result || isErrorResponse(result)) {
            await fail(
                sock,
                jid,
                msg,
                `❌ Karakter "${rawQuery}" tidak ditemukan.\n\n` +
                `Pakai *!genshin list* untuk lihat daftar nama yang tersedia.`
            );
            return;
        }

        const data = result as GenshinCharacter;
        const caption = buildCaption(data);
        const imageUrl = `${API_BASE}/characters/${encodeURIComponent(slug)}/portrait`;

        try {
            await sock.sendMessage(
                jid,
                { image: { url: imageUrl }, caption },
                { quoted: msg }
            );
        } catch (sendErr) {
            // Fallback: kalau pengiriman gambar gagal, kirim teks saja
            console.error('[Genshin] gagal kirim image, fallback ke teks:', sendErr);
            await sendWithTyping(sock, jid, { text: caption }, { quoted: msg });
        }

        try { await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } }); } catch (_) {}
    } catch (error: any) {
        console.error('[Genshin]', error);
        await fail(sock, jid, msg, mapError(error));
    }
}

/**
 * Fetch JSON dengan timeout via AbortController.
 */
async function fetchJson<T>(url: string, timeoutMs = 20000): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(url, {
            signal: controller.signal,
            headers: { 'User-Agent': 'WADASH-Bot/1.0' },
        });
        if (!res.ok && res.status !== 404) {
            throw new Error(`HTTP ${res.status} ${res.statusText}`);
        }
        return (await res.json()) as T;
    } catch (err: any) {
        if (err?.name === 'AbortError') throw new Error('Connection timeout');
        throw err;
    } finally {
        clearTimeout(timer);
    }
}

/**
 * Susun panduan penggunaan plugin.
 */
function buildUsage(): string {
    return (
        `🌟 *Genshin Impact Character Lookup*\n\n` +
        `Cek detail karakter Genshin Impact (vision, weapon, talents, dll).\n\n` +
        `*Penggunaan:*\n` +
        `• !genshin <nama karakter>\n` +
        `• !genshin list   (daftar semua karakter)\n\n` +
        `*Contoh:*\n` +
        `• !genshin arlecchino\n` +
        `• !genshin furina\n` +
        `• !gi raiden shogun`
    );
}

/**
 * Bangun caption berisi data karakter, talent, passive, dan constellation.
 */
function buildCaption(data: GenshinCharacter): string {
    const stars = '⭐'.repeat(Math.max(0, Math.min(5, Number(data.rarity) || 0)));
    const lines: string[] = [];

    lines.push(`🌟 *${data.name.toUpperCase()}* ${stars}`);
    if (data.title) lines.push(`_${data.title}_`);
    lines.push('');
    lines.push(`👁️ *Vision*       : ${data.vision}`);
    lines.push(`🗡️ *Weapon*       : ${data.weapon}`);
    lines.push(`🌍 *Nation*       : ${data.nation}`);
    if (data.affiliation)   lines.push(`🤝 *Affiliation*  : ${data.affiliation}`);
    if (data.birthday)      lines.push(`🎂 *Birthday*     : ${data.birthday}`);
    if (data.specialDish)   lines.push(`🍲 *Special Dish* : ${data.specialDish}`);
    if (data.constellation) lines.push(`✨ *Constellation*: ${data.constellation}`);

    if (data.description) {
        lines.push('');
        lines.push(`📝 ${trim(data.description, 400)}`);
    }

    if (Array.isArray(data.skillTalents) && data.skillTalents.length > 0) {
        lines.push('');
        lines.push(`🎯 *Skill Talents*`);
        data.skillTalents.slice(0, 5).forEach((s, i) => {
            const unlock = s.unlock ? ` [${s.unlock}]` : '';
            lines.push(`${i + 1}. ${s.name}${unlock}`);
        });
    }

    if (Array.isArray(data.passiveTalents) && data.passiveTalents.length > 0) {
        lines.push('');
        lines.push(`💠 *Passive Talents*`);
        data.passiveTalents.slice(0, 5).forEach((p, i) => {
            const unlock = p.unlock ? ` [${p.unlock}]` : ' [Automatic]';
            lines.push(`${i + 1}. ${p.name}${unlock}`);
        });
    }

    if (Array.isArray(data.constellations) && data.constellations.length > 0) {
        lines.push('');
        lines.push(`🌠 *Constellations*`);
        data.constellations.forEach((c) => {
            lines.push(`• [${c.unlock}] ${c.name}`);
        });
    }

    // WhatsApp punya batas caption ~1024 karakter; potong bila kepanjangan.
    const out = lines.join('\n');
    return out.length > 1000 ? out.slice(0, 1000) + '\n…(dipotong)' : out;
}

/**
 * Normalisasi nama karakter ke slug API (lowercase, spasi → strip).
 * Contoh: "Raiden Shogun" → "raiden-shogun"
 */
function toCharacterSlug(name: string): string {
    return name
        .toLowerCase()
        .trim()
        .replace(/['"`’]/g, '')
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
}

/**
 * Cek apakah response dari API merupakan error.
 */
function isErrorResponse(res: unknown): res is ApiError {
    if (!res || typeof res !== 'object') return true;
    const r = res as Record<string, unknown>;
    if (typeof r.error === 'string') return true;
    if (r.code && Number(r.code) >= 400) return true;
    if (typeof r.name !== 'string') return true; // karakter valid pasti punya `name`
    return false;
}

/**
 * Konversi error menjadi pesan yang ramah user.
 */
function mapError(error: any): string {
    if (error?.message && /timeout/i.test(error.message)) {
        return '⏱️ Request timeout. Coba lagi nanti.';
    }
    return `❌ Gagal mengambil data: ${error?.message || 'Unknown error'}`;
}

/**
 * Potong string ke panjang maksimum dengan suffix elipsis.
 */
function trim(str: string, max: number): string {
    return str.length > max ? str.slice(0, max).trimEnd() + '…' : str;
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
