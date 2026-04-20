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
 * Cek apakah pengirim pesan adalah owner berdasarkan settings.ownerNumber
 * Handle: DM (remoteJid = sender), Group (participant = sender), format 08xxx & 628xxx
 */
export function isOwner(msg: WAMessage, settings: Record<string, any>): boolean {
    const ownerRaw: string = (settings.ownerNumber ?? '').toString().trim();
    if (!ownerRaw) return false;

    const ownerNorm = normalizeNumber(ownerRaw);
    if (!ownerNorm) return false;

    // Di DM: participant = null/undefined, remoteJid = nomor pengirim
    // Di Group: participant = nomor pengirim, remoteJid = group JID
    const senderJid = (msg.key?.participant || msg.key?.remoteJid || '').toString();
    const senderNorm = normalizeNumber(senderJid);

    // Cek strict equality setelah normalisasi
    return senderNorm === ownerNorm;
}
