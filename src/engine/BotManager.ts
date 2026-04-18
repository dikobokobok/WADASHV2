import makeWASocket, { useMultiFileAuthState, DisconnectReason, ConnectionState, WAMessage, fetchLatestBaileysVersion, Browsers } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import path from 'path';
import fs from 'fs';
import { EventEmitter } from 'events';
import qrcodeTerminal from 'qrcode-terminal';

// Extend global so we can preserve BotManager across HMR in Next.js development
declare global {
    var botManager: BotManager | undefined;
}

export type BotStatus = 'offline' | 'connecting' | 'online';

export interface BotState {
    status: BotStatus;
    qrCode?: string;
    lastError?: string;
    onlineAt?: number;
}

const DATABASE_DIR = path.join(process.cwd(), 'database');
const SESSIONS_DIR = path.join(DATABASE_DIR, 'sessions');

export class BotManager extends EventEmitter {
    private bots: Map<string, ReturnType<typeof makeWASocket>> = new Map();
    private statuses: Map<string, BotState> = new Map();
    private intentionalStops: Set<string> = new Set();

    constructor() {
        super();
        if (!fs.existsSync(SESSIONS_DIR)) {
            fs.mkdirSync(SESSIONS_DIR, { recursive: true });
        }
    }

    public getStatus(uuid: string): BotState {
        return this.statuses.get(uuid) || { status: 'offline' };
    }

    public async startBot(uuid: string) {
        if (this.bots.has(uuid)) {
            console.log(`Bot for ${uuid} is already running.`);
            return;
        }

        this.intentionalStops.delete(uuid);
        const sessionFolder = path.join(SESSIONS_DIR, uuid);

        // Update status map
        this.updateStatus(uuid, { status: 'connecting', qrCode: undefined, lastError: undefined, onlineAt: undefined });

        try {
            const { state, saveCreds } = await useMultiFileAuthState(sessionFolder);
            const { version } = await fetchLatestBaileysVersion();

            const sock = makeWASocket({
                version,
                auth: state,
                printQRInTerminal: false, // Custom QR printing
                syncFullHistory: false,
                markOnlineOnConnect: true, // Or driven by settings json
                browser: Browsers.ubuntu('Chrome')
            });

            this.bots.set(uuid, sock);

            sock.ev.on('creds.update', saveCreds);

            sock.ev.on('connection.update', async (update: Partial<ConnectionState>) => {
                const { connection, lastDisconnect, qr } = update;

                if (qr) {
                    try {
                        const QRCode = await import('qrcode');
                        const qrDataUrl = await QRCode.toDataURL(qr, { scale: 8, margin: 2, color: { dark: '#4f46e5', light: '#ffffff' } });
                        // Emit QR code to the dashboard
                        this.updateStatus(uuid, { status: 'connecting', qrCode: qrDataUrl });
                    } catch (e) {
                        this.updateStatus(uuid, { status: 'connecting', qrCode: qr });
                    }

                    // Also print to terminal for development (without 'small' parameter to prevent formatting issues in PowerShell)
                    console.log(`\n\n------- QR Code for User ${uuid} -------`);
                    qrcodeTerminal.generate(qr);
                    console.log(`----------------------------------------\n\n`);
                    this.pushLog(uuid, 'New QR Code generated, waiting for scan...');
                }

                if (connection === 'close') {
                    const isManualStop = this.intentionalStops.has(uuid);
                    const isLoggedOut = (lastDisconnect?.error as Boom)?.output?.statusCode === DisconnectReason.loggedOut;
                    const shouldReconnect = !isManualStop && !isLoggedOut;

                    console.log(`Connection closed for ${uuid}. Reconnecting: ${shouldReconnect} (Manual: ${isManualStop})`);
                    this.pushLog(uuid, `Connection drop detected. Reconnecting: ${shouldReconnect}`);

                    this.updateStatus(uuid, { status: 'offline', onlineAt: undefined });
                    this.bots.delete(uuid);

                    if (shouldReconnect) {
                        // try to auto-reconnect
                        setTimeout(() => {
                            // double check it wasn't manually stopped during the timeout
                            if (!this.intentionalStops.has(uuid)) {
                                this.pushLog(uuid, 'Attempting auto-reconnect...');
                                this.startBot(uuid);
                            }
                        }, 5000);
                    } else if (isLoggedOut) {
                        // Logged out natively, clean up folders
                        this.pushLog(uuid, 'Session invalidated (Logged Out).');
                        this.deleteSessionFolder(uuid);
                    }
                } else if (connection === 'open') {
                    console.log(`Bot connected for ${uuid}!`);
                    this.pushLog(uuid, 'WebSocket attached and Handshake succeeded!');
                    this.updateStatus(uuid, { status: 'online', qrCode: undefined, onlineAt: Date.now() });
                }
            });

            sock.ev.on('messages.upsert', async (m) => {
                // Here we would implement Message Handling logic based on "{uuid}.settings.json"
                if (m.type !== 'notify') return;
                const msg = m.messages[0];
                if (!msg.key.fromMe && msg.message) {
                    this.pushLog(uuid, `Message received from ${msg.key.remoteJid}`);
                    this.handleIncomingMessage(uuid, sock, msg);
                }
            });

        } catch (error: any) {
            console.error(`Error starting bot for ${uuid}:`, error);
            this.pushLog(uuid, `Fatal startup error: ${error.message}`);
            this.updateStatus(uuid, { status: 'offline', lastError: error.message, onlineAt: undefined });
            this.bots.delete(uuid);
        }
    }

    public stopBot(uuid: string, logout: boolean = false) {
        this.intentionalStops.add(uuid);
        const sock = this.bots.get(uuid);
        if (sock) {
            this.pushLog(uuid, 'Initiating manual socket shutdown...');
            sock.ws.close();
            if (logout) {
                sock.logout();
                this.deleteSessionFolder(uuid);
            }
            this.bots.delete(uuid);
            this.updateStatus(uuid, { status: 'offline', qrCode: undefined, onlineAt: undefined });
            console.log(`Bot for ${uuid} intentionally stopped.`);
            this.pushLog(uuid, 'Process fully stopped.');
        }
    }

    public deleteSession(uuid: string) {
        this.intentionalStops.add(uuid);
        this.stopBot(uuid, true); // Will trigger logout and delete folder
        if (!this.bots.has(uuid)) {
            // Failsafe delete
            this.deleteSessionFolder(uuid);
        }
    }

    public pushLog(uuid: string, log: string) {
        const timestamp = new Date().toLocaleTimeString();
        this.emit('log-update', { uuid, log: `[${timestamp}] ${log}` });
    }

    private updateStatus(uuid: string, status: BotState) {
        this.statuses.set(uuid, status);
        this.emit('status-update', { uuid, status });

        // Also push a log about status changes
        this.pushLog(uuid, `Status changed to: ${status.status.toUpperCase()}`);
    }

    private deleteSessionFolder(uuid: string) {
        const sessionFolder = path.join(SESSIONS_DIR, uuid);
        if (fs.existsSync(sessionFolder)) {
            fs.rmSync(sessionFolder, { recursive: true, force: true });
        }
    }

    private handleIncomingMessage(uuid: string, sock: ReturnType<typeof makeWASocket>, msg: WAMessage) {
        // Read {uuid}.settings.json dynamically
        const settingsPath = path.join(DATABASE_DIR, `${uuid}.settings.json`);
        let settings: any = {};
        if (fs.existsSync(settingsPath)) {
            try {
                settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
            } catch (err) { }
        }

        const prefix = settings.prefix || '#';
        // Extract text message content
        const textMessage = msg.message?.conversation || msg.message?.extendedTextMessage?.text || "";

        if (textMessage.startsWith(prefix)) {
            // Process command (sample logic)
            const command = textMessage.slice(prefix.length).trim().split(' ')[0];

            if (command === 'ping') {
                sock.sendMessage(msg.key.remoteJid!, { text: 'Pong! 🏓 WADASH Engine works!' });
            }
        }
    }
}

// Singleton instantiation
const manager = global.botManager || new BotManager();
if (process.env.NODE_ENV !== 'production') {
    global.botManager = manager;
}

export default manager;
