import { WAMessage } from '@whiskeysockets/baileys';
import makeWASocket from '@whiskeysockets/baileys';

/**
 * Mengirim pesan dengan simulasi mengetik seperti manusia.
 * Menampilkan status "mengetik..." (composing) selama beberapa detik
 * sebelum pesan dikirim. Durasi jeda dihitung dari panjang teks:
 * ~60ms per karakter, minimal 1.5 detik, maksimal 5 detik.
 */
export async function sendWithTyping(
    sock: ReturnType<typeof makeWASocket>,
    jid: string,
    content: Parameters<ReturnType<typeof makeWASocket>['sendMessage']>[1],
    options?: Parameters<ReturnType<typeof makeWASocket>['sendMessage']>[2]
) {
    let charCount = 80; // default fallback untuk non-teks (media, kontak, dll)
    if (typeof (content as any).text === 'string') {
        charCount = (content as any).text.length;
    }
    const delay = Math.min(Math.max(charCount * 60, 1500), 5000);

    try { await sock.sendPresenceUpdate('composing', jid); } catch (_) {}
    await new Promise(res => setTimeout(res, delay));
    try { await sock.sendPresenceUpdate('paused', jid); } catch (_) {}

    return sock.sendMessage(jid, content, options);
}

/**
 * Normalisasi nomor telepon ke format internasional (e.g. 6283xxx)
 * - "083175858167"                   → "6283175858167"
 * - "6283175858167"                  → "6283175858167"
 * - "6283175858167@s.whatsapp.net"   → "6283175858167"
 */
export function normalizeNumber(raw: string): string {
    // Hapus semua non-angka (strip @s.whatsapp.net, +, spasi, dll)
    let num = raw.trim().replace(/[^0-9]/g, '');

    // Konversi format lokal 08xxx → 628xxx
    if (num.startsWith('0')) {
        num = '62' + num.slice(1);
    }

    return num;
}

import { getGlobalOwnerNumber } from '@/lib/database';

/**
 * Mendapatkan role pengguna (globOwner, Owner, atau User)
 */
export function getUserRole(msg: WAMessage, settings: Record<string, any>): "globOwner" | "Owner" | "User" {
    const participant = (msg.key?.participant || '').toString();
    const remoteJid = (msg.key?.remoteJid || '').toString();

    // globOwner: cocokkan langsung JID (mendukung @lid maupun @s.whatsapp.net)
    const dbGlobOwner = getGlobalOwnerNumber();
    const globOwnerJid = dbGlobOwner || process.env.GLOBAL_OWNER_NUMBER || "";

    if (globOwnerJid && (participant === globOwnerJid || remoteJid === globOwnerJid)) {
        return "globOwner";
    }

    // Fallback: normalisasi nomor (untuk backward compatibility)
    const senderNorm = normalizeNumber(participant || remoteJid);
    if (globOwnerJid && !globOwnerJid.includes('@')) {
        // Jika yang disimpan adalah nomor biasa (bukan JID), normalisasi dan bandingkan
        if (senderNorm === normalizeNumber(globOwnerJid)) {
            return "globOwner";
        }
    }

    // Owner: owner dari bot (berdasarkan setting)
    const senderJid = participant || remoteJid;
    const ownerRaw: string = (settings.ownerNumber ?? '').toString().trim();
    if (ownerRaw) {
        const ownerNorm = normalizeNumber(ownerRaw);
        if (normalizeNumber(senderJid) === ownerNorm) {
            return "Owner";
        }
    }

    // User: pengguna biasa
    return "User";
}


/**
 * Mengecek apakah pengguna adalah globOwner (memiliki seluruh hak akses)
 */
export function isGlobOwner(msg: WAMessage, settings: Record<string, any>): boolean {
    return getUserRole(msg, settings) === "globOwner";
}

/**
 * Mengecek apakah pengguna adalah Owner atau globOwner (karena globOwner memiliki seluruh akses)
 */
export function isOwner(msg: WAMessage, settings: Record<string, any>): boolean {
    const role = getUserRole(msg, settings);
    return role === "Owner" || role === "globOwner";
}
