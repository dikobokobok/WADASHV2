import { WAMessage } from '@whiskeysockets/baileys';

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

/**
 * Mendapatkan role pengguna (globOwner, Owner, atau User)
 */
export function getUserRole(msg: WAMessage, settings: Record<string, any>): "globOwner" | "Owner" | "User" {
    const senderJid = (msg.key?.participant || msg.key?.remoteJid || '').toString();
    const senderNorm = normalizeNumber(senderJid);

    // globOwner: memiliki seluruh hak akses bot
    const globOwnerNumber = process.env.GLOBAL_OWNER_NUMBER || "628989031500"; // Default globOwner
    if (globOwnerNumber && senderNorm === normalizeNumber(globOwnerNumber)) {
        return "globOwner";
    }

    // Owner: owner dari bot (berdasarkan setting)
    const ownerRaw: string = (settings.ownerNumber ?? '').toString().trim();
    if (ownerRaw) {
        const ownerNorm = normalizeNumber(ownerRaw);
        if (senderNorm === ownerNorm) {
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
