import { WAMessage } from '@whiskeysockets/baileys';
import makeWASocket from '@whiskeysockets/baileys';

export const command = ['owner', 'own', 'o'];
export const category = 'general';

export async function execute(
    sock: ReturnType<typeof makeWASocket>,
    msg: WAMessage,
    _args: string[],
    settings: Record<string, any>
) {
    const ownerName = settings.ownerName || 'Admin';
    const ownerNumber = settings.ownerNumber || '628989031500';

    const vcard =
        'BEGIN:VCARD\n' +
        'VERSION:3.0\n' +
        `FN:${ownerName}\n` +
        `TEL;type=CELL;type=VOICE;waid=${ownerNumber}:${ownerNumber}\n` +
        'END:VCARD';

    await sock.sendMessage(msg.key.remoteJid!, {
        contacts: {
            displayName: ownerName,
            contacts: [{ vcard }]
        }
    });
}
