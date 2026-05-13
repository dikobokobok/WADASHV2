import { WAMessage } from '@whiskeysockets/baileys';
import makeWASocket from '@whiskeysockets/baileys';
import { sendWithTyping } from './utils';

export const command = ['ping', 'p'];
export const category = 'general';

export async function execute(
    sock: ReturnType<typeof makeWASocket>,
    msg: WAMessage,
    _args: string[],
    _settings: Record<string, any>
) {
    await sendWithTyping(sock, msg.key.remoteJid!, { text: 'Pong! 🏓 WADASH Engine works!' }, { quoted: msg });
}
