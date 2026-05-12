import makeWASocket, { useMultiFileAuthState, DisconnectReason, ConnectionState, WAMessage, fetchLatestBaileysVersion, Browsers } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import path from 'path';
import fs from 'fs';
import { EventEmitter } from 'events';
import qrcodeTerminal from 'qrcode-terminal';
import os from 'os';
import pluginRegistry, { categoryRegistry } from './plugins/index';
import { readBotApiResponders } from '../lib/database';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import { Readable, PassThrough } from 'stream';
import { FFMPEG_PATH } from './lib/ffmpeg';

if (FFMPEG_PATH) {
    ffmpeg.setFfmpegPath(FFMPEG_PATH);
}



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

    private async handleIncomingMessage(uuid: string, sock: ReturnType<typeof makeWASocket>, msg: WAMessage) {
        // Read {uuid}.settings.json dynamically
        const settingsPath = path.join(DATABASE_DIR, `${uuid}.settings.json`);
        let settings: any = {};
        if (fs.existsSync(settingsPath)) {
            try {
                settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
            } catch (err) { }
        }

        const prefixType = settings.prefixType || 'single';
        const definedPrefix = settings.prefix || '#';

        // Extract text dari semua sumber: teks biasa, caption gambar, reply ke gambar
        const textMessage =
            msg.message?.conversation ||
            msg.message?.extendedTextMessage?.text ||
            msg.message?.imageMessage?.caption ||
            msg.message?.videoMessage?.caption ||
            "";

        // Auto Read Logic
        if (settings.autoRead) {
            try {
                await sock.readMessages([msg.key]);
            } catch (err) { }
        }

        let isCommand = false;
        let command = "";
        let usedPrefix = "";

        // Determine if it's a command based on prefixType
        if (prefixType === 'single') {
            if (textMessage.startsWith(definedPrefix)) {
                isCommand = true;
                usedPrefix = definedPrefix;
                command = textMessage.slice(definedPrefix.length).trim().split(' ')[0].toLowerCase();
            }
        } else if (prefixType === 'multi') {
            const multiPrefixRegex = /^[./!#]/;
            if (multiPrefixRegex.test(textMessage)) {
                isCommand = true;
                usedPrefix = textMessage[0];
                command = textMessage.slice(1).trim().split(' ')[0].toLowerCase();
            }
        } else if (prefixType === 'empty') {
            isCommand = true;
            usedPrefix = "";
            command = textMessage.trim().split(' ')[0].toLowerCase();
        }

        if (isCommand && command) {
            // Try to find and execute a matching plugin first
            const plugin = pluginRegistry.get(command);
            if (plugin) {
                const args = textMessage.slice(usedPrefix.length).trim().split(' ').slice(1);
                try {
                    await plugin.execute(sock, msg, args, settings);
                    this.pushLog(uuid, `Command executed via plugin: ${command}`);
                } catch (err: any) {
                    console.error(`[Plugin:${command}] Error:`, err.message);
                    this.pushLog(uuid, `Plugin error on command "${command}": ${err.message}`);
                }
            } else if (command === 'menu' || command === 'm') {
                const rawMenu = settings.menuTemplate || "Menu template not set in dashboard.";

                // Format Uptime
                const onlineAt = this.statuses.get(uuid)?.onlineAt || Date.now();
                const uptimeMs = Date.now() - onlineAt;
                const hh = String(Math.floor(uptimeMs / 3600000)).padStart(2, "0");
                const mm = String(Math.floor((uptimeMs % 3600000) / 60000)).padStart(2, "0");
                const ss = String(Math.floor((uptimeMs % 60000) / 1000)).padStart(2, "0");
                const uptimeStr = `${hh}:${mm}:${ss}`;

                // Format Time and Date
                const now = new Date();
                const timeStr = now.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta' });
                const dateStr = now.toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' });

                const apiResponders = readBotApiResponders(uuid);

                // Build {all fitur} — semua command dari semua plugin dan API responder
                const pluginCommands = Array.from(categoryRegistry.values()).flat();
                const apiResponderCommands = apiResponders.map(r => r.actionTrigger);
                const combinedAllCommands = [...pluginCommands, ...apiResponderCommands];

                const allCommands = combinedAllCommands
                    .map(c => `${usedPrefix || definedPrefix}${c}`)
                    .join('\n');

                // Build {kategori} — semua kategori beserta command-nya, diurutkan
                const dynamicCategoryMap = new Map<string, string[]>();
                // Masukkan command dari plugin
                for (const [cat, cmds] of categoryRegistry.entries()) {
                    dynamicCategoryMap.set(cat, [...cmds]);
                }
                // Masukkan command dari API responder
                for (const r of apiResponders) {
                    const cat = r.category || 'GENERAL';
                    if (!dynamicCategoryMap.has(cat)) {
                        dynamicCategoryMap.set(cat, []);
                    }
                    dynamicCategoryMap.get(cat)!.push(r.actionTrigger);
                }

                const kategoriText = Array.from(dynamicCategoryMap.entries())
                    .map(([cat, cmds]) => {
                        const cmdList = cmds.map(c => `${usedPrefix || definedPrefix}${c}`).join('\n');
                        return `${cat} :\n${cmdList}`;
                    })
                    .join('\n\n');

                // Format the menu response
                const responseText = rawMenu
                    .replace(/{user\.bot}/g, msg.pushName || "User")
                    .replace(/{name\.bot}/g, settings.botName || "WADASH Bot")
                    .replace(/{uptime}/g, uptimeStr)
                    .replace(/{time}/g, timeStr)
                    .replace(/{date}/g, dateStr)
                    .replace(/{action\.prefix}/g, usedPrefix || definedPrefix)
                    .replace(/{all fitur}/g, allCommands || "menu")
                    .replace(/{kategori}/g, kategoriText || "(belum ada kategori)")
                    .replace(/{footer}/g, settings.footerText || "© 2024 WADASH Bot");

                sock.sendMessage(msg.key.remoteJid!, { text: responseText });
            } else {
                const apiResponders = readBotApiResponders(uuid);
                const fullCommandText = typeof usedPrefix === 'string' ? usedPrefix + command : command;

                let matchedResponder = apiResponders.find(r => r.actionTrigger.toLowerCase() === fullCommandText);
                if (!matchedResponder) {
                    matchedResponder = apiResponders.find(r => r.actionTrigger.toLowerCase() === command);
                }

                if (matchedResponder) {
                    try {
                        this.pushLog(uuid, `API Responder matched: ${matchedResponder.actionTrigger}`);
                        const rawArgs = textMessage.slice((typeof usedPrefix === 'string' ? usedPrefix.length : 0) + command.length).trim();
                        const segments = rawArgs.split('|').map(s => s.trim());

                        let fetchUrl = matchedResponder.apiLink;
                        for (let i = 0; i < segments.length; i++) {
                            const placeholder = new RegExp(`\\{msg${i + 1}\\}`, 'g');
                            fetchUrl = fetchUrl.replace(placeholder, encodeURIComponent(segments[i]));
                        }
                        fetchUrl = fetchUrl.replace(/\{msg\d+\}/g, '');

                        const res = await fetch(fetchUrl);
                        if (!res.ok) throw new Error(`API returned status ${res.status}`);

                        if (matchedResponder.sendOption === 'text') {
                            const textOutput = await res.text();
                            await sock.sendMessage(msg.key.remoteJid!, { text: textOutput }, { quoted: msg });
                        } else if (matchedResponder.sendOption === 'media') {
                            const buffer = Buffer.from(await res.arrayBuffer());
                            const contentType = res.headers.get('content-type') || 'application/octet-stream';

                            if (contentType.startsWith('video/')) {
                                await sock.sendMessage(msg.key.remoteJid!, { video: buffer, mimetype: contentType }, { quoted: msg });
                            } else if (contentType.startsWith('image/')) {
                                let imageBuffer: any = buffer;
                                let finalMime = contentType;
                                // Convert SVG to PNG for WhatsApp compatibility
                                if (contentType.includes('svg')) {
                                    imageBuffer = await sharp(buffer).png().toBuffer();
                                    finalMime = 'image/png';
                                }
                                await sock.sendMessage(msg.key.remoteJid!, { image: imageBuffer, mimetype: finalMime }, { quoted: msg });
                            } else {
                                await sock.sendMessage(msg.key.remoteJid!, { document: buffer, mimetype: contentType, fileName: "download" }, { quoted: msg });
                            }
                        } else if (matchedResponder.sendOption === 'image') {
                            const buffer = Buffer.from(await res.arrayBuffer());
                            const contentType = res.headers.get('content-type') || 'image/jpeg';
                            let imageBuffer: any = buffer;
                            let finalMime = contentType;
                            if (contentType.includes('svg')) {
                                imageBuffer = await sharp(buffer).png().toBuffer();
                                finalMime = 'image/png';
                            }
                            await sock.sendMessage(msg.key.remoteJid!, { image: imageBuffer, mimetype: finalMime }, { quoted: msg });
                        } else if (matchedResponder.sendOption === 'video') {
                            const buffer = Buffer.from(await res.arrayBuffer());
                            const contentType = res.headers.get('content-type') || 'video/mp4';
                            await sock.sendMessage(msg.key.remoteJid!, { video: buffer, mimetype: contentType }, { quoted: msg });
                        } else if (matchedResponder.sendOption === 'gif') {
                            const gifBuffer = Buffer.from(await res.arrayBuffer());
                            // Convert GIF → MP4 (WhatsApp requires MP4 for gifPlayback, raw GIF won't work)
                            const mp4Buffer = await convertGifToMp4(gifBuffer);
                            await sock.sendMessage(msg.key.remoteJid!, { video: mp4Buffer, mimetype: 'video/mp4', gifPlayback: true }, { quoted: msg });
                        } else if (matchedResponder.sendOption === 'sticker') {
                            const buffer = Buffer.from(await res.arrayBuffer());
                            const contentType = res.headers.get('content-type') || '';
                            let webpBuffer: Buffer;

                            if (contentType.startsWith('video/') || contentType.includes('gif')) {
                                webpBuffer = await convertVideoToWebp(buffer);
                            } else {
                                webpBuffer = await sharp(buffer)
                                    .resize(512, 512, {
                                        fit: 'contain',
                                        background: { r: 0, g: 0, b: 0, alpha: 0 }
                                    })
                                    .webp({ quality: 80, lossless: false })
                                    .toBuffer();
                            }
                            await sock.sendMessage(msg.key.remoteJid!, { sticker: webpBuffer }, { quoted: msg });
                        }

                        this.pushLog(uuid, `API Responder "${matchedResponder.actionTrigger}" executed successfully`);
                    } catch (error: any) {
                        console.error(`[API Responder] Error:`, error.message);
                        this.pushLog(uuid, `API Responder Error: ${error.message}`);
                        await sock.sendMessage(msg.key.remoteJid!, { text: `[Error API] Gagal memuat data dari Webhook / API: ${error.message}` }, { quoted: msg });
                    }
                } else {
                    this.pushLog(uuid, `Unknown command: ${command}`);
                }
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

// Helper: Convert Video/GIF buffer to Animated WebP sticker
function convertVideoToWebp(videoBuffer: Buffer): Promise<Buffer> {
    const tmpDir = os.tmpdir();
    const inputPath = path.join(tmpDir, `st_api_in_${Date.now()}.mp4`);
    const outputPath = path.join(tmpDir, `st_api_out_${Date.now()}.webp`);
    
    fs.writeFileSync(inputPath, videoBuffer);

    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .inputOptions(['-t 6']) // Limit 6s for WhatsApp
            .outputOptions([
                '-vf', 'scale=512:512:force_original_aspect_ratio=decrease,fps=15,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000',
                '-vcodec', 'libwebp',
                '-lossless', '0',
                '-compression_level', '4',
                '-q:v', '50',
                '-loop', '0',
                '-preset', 'picture',
                '-an',
                '-vsync', '0'
            ])
            .toFormat('webp')
            .on('end', () => {
                const buffer = fs.readFileSync(outputPath);
                try {
                    fs.unlinkSync(inputPath);
                    fs.unlinkSync(outputPath);
                } catch (e) {}
                resolve(buffer);
            })
            .on('error', (err) => {
                try {
                    fs.unlinkSync(inputPath);
                    fs.unlinkSync(outputPath);
                } catch (e) {}
                reject(err);
            })
            .save(outputPath);
    });
}

// Helper: Convert GIF buffer to MP4 buffer using ffmpeg
// WhatsApp requires MP4 format for gifPlayback to work correctly
function convertGifToMp4(gifBuffer: Buffer): Promise<Buffer> {
// ... existing code ...
    return new Promise((resolve, reject) => {
        const inputStream = new Readable();
        inputStream.push(gifBuffer);
        inputStream.push(null);

        const chunks: Buffer[] = [];
        const outputStream = new PassThrough();
        outputStream.on('data', (chunk: Buffer) => chunks.push(chunk));
        outputStream.on('end', () => resolve(Buffer.concat(chunks)));
        outputStream.on('error', reject);

        ffmpeg(inputStream)
            .inputFormat('gif')
            .videoCodec('libx264')
            .outputOptions([
                '-pix_fmt yuv420p',          // WhatsApp compatible pixel format
                '-vf scale=trunc(iw/2)*2:trunc(ih/2)*2', // Ensure even dimensions
                '-movflags frag_keyframe+empty_moov',    // Streamable MP4
                '-preset ultrafast',
            ])
            .outputFormat('mp4')
            .on('error', reject)
            .pipe(outputStream, { end: true });
    });
}
