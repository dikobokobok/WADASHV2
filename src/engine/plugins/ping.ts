import { WAMessage } from '@whiskeysockets/baileys';
import makeWASocket from '@whiskeysockets/baileys';

export const command = ['ping', 'p'];
export const category = 'general';

export async function execute(
    sock: ReturnType<typeof makeWASocket>,
    msg: WAMessage,
    _args: string[],
    _settings: Record<string, any>
) {
    await sock.sendMessage(msg.key.remoteJid!, { text: 'Pong! 🏓 WADASH Engine works!' });
}
