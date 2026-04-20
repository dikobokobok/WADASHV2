import fs from "fs";
import path from "path";

const DB_DIR = path.join(process.cwd(), "database");
const GLOBAL_ADMIN_PATH = path.join(DB_DIR, "global_admin.json");
const OLD_DB_PATH = path.join(DB_DIR, "database.json");

export interface UserAuth {
    id: string;
    username: string;
    email: string;
    password: string;
    role: string;
    createdAt: string;
}

export interface GlobalAdminData {
    users: UserAuth[];
    systemStats: Record<string, any>;
    securityLogs: any[];
}

export interface UserProfile {
    id: string;
    username: string;
    role: string;
    subscriptionEnd: string | null;
    createdAt: string;
}

export interface ApiResponderCommand {
    id: string;
    actionTrigger: string;
    category: string;
    apiLink: string;
    sendOption: "text" | "media" | "sticker";
}

export interface BotConfig { // Mapped to {uuid}.settings.json
    botName: string;
    packname: string;
    authorname: string;
    footerText: string;
    limit: number;
    balance: number;
    ownerName: string;
    ownerNumber: string;
    prefix: string;
    prefixType: "single" | "multi" | "empty";
    onlineOnConnect: boolean;
    premiumNotification: boolean;
    sewaNotificationToGroup: boolean;
    sewaNotificationToOwner: boolean;
    joinToUse: boolean;
    autoRead: boolean;
    menuTemplate: string;
}

export interface BotOperationalData { // Mapped to {uuid}.bot.json
    contacts: any[];
    commandStats: Record<string, number>;
    messagesSent: number;
}

type User = UserAuth & { botConfig?: BotConfig }; // Backward compatibility for some old usages if any

const defaultBotConfig: BotConfig = {
    botName: "WADASH Bot",
    packname: "WADASH",
    authorname: "WADASH",
    footerText: "© 2026 WADASH Bot",
    limit: 100,
    balance: 10000,
    ownerName: "Admin",
    ownerNumber: "62xxx",
    prefix: "#",
    prefixType: "single",
    onlineOnConnect: true,
    premiumNotification: true,
    sewaNotificationToGroup: false,
    sewaNotificationToOwner: false,
    joinToUse: false,
    autoRead: false,
    menuTemplate: "halo {user.bot}🙌🏻\n\nWELCOME TO {name.bot}\n> Name BOT : {name.bot}\n> Uptime : {uptime}\n> Jam : {time}\n> Tanggal : {date}\n> Prefix : {action.prefix}\n\nList Bot :\n{action.prefix}{all fitur}\n\nList Bot by Kategori :\ndownload : \n{action.prefix}{kategori.download}\nsticker :\n{action.prefix}{kategori.sticker}\nowner :\n{action.prefix}{kategori.owner}"
};

const defaultBotData: BotOperationalData = {
    contacts: [],
    commandStats: {},
    messagesSent: 0
};

// Ensure directory exists
if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
}

// Migrate old database.json to new structure
if (fs.existsSync(OLD_DB_PATH) && !fs.existsSync(GLOBAL_ADMIN_PATH)) {
    try {
        const oldData = JSON.parse(fs.readFileSync(OLD_DB_PATH, "utf-8"));
        const newGlobalAdmin: GlobalAdminData = { users: [], systemStats: {}, securityLogs: [] };

        for (const u of oldData.users) {
            const role = u.username.toLowerCase() === 'admin' ? 'admin' : 'user';

            newGlobalAdmin.users.push({
                id: u.id,
                username: u.username,
                email: u.email,
                password: u.password,
                role: role,
                createdAt: u.createdAt
            });

            writeProfile(u.id, {
                id: u.id,
                username: u.username,
                role: role,
                subscriptionEnd: null,
                createdAt: u.createdAt
            });

            writeBotSettings(u.id, u.botConfig || { ...defaultBotConfig });
            writeBotData(u.id, { ...defaultBotData });
        }

        fs.writeFileSync(GLOBAL_ADMIN_PATH, JSON.stringify(newGlobalAdmin, null, 2));
        fs.unlinkSync(OLD_DB_PATH);
    } catch (err) {
        console.error("Failed to migrate database.json:", err);
    }
}

export function readGlobalAdmin(): GlobalAdminData {
    if (!fs.existsSync(GLOBAL_ADMIN_PATH)) {
        const defaultData: GlobalAdminData = { users: [], systemStats: {}, securityLogs: [] };
        writeGlobalAdmin(defaultData);
        return defaultData;
    }
    try {
        return JSON.parse(fs.readFileSync(GLOBAL_ADMIN_PATH, "utf-8"));
    } catch (e) {
        return { users: [], systemStats: {}, securityLogs: [] };
    }
}

export function writeGlobalAdmin(data: GlobalAdminData): void {
    fs.writeFileSync(GLOBAL_ADMIN_PATH, JSON.stringify(data, null, 2));
}

// Profile
export function readProfile(uuid: string): UserProfile | null {
    const p = path.join(DB_DIR, `${uuid}.profile.json`);
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, "utf-8"));
}
export function writeProfile(uuid: string, data: UserProfile): void {
    fs.writeFileSync(path.join(DB_DIR, `${uuid}.profile.json`), JSON.stringify(data, null, 2));
}

// Settings (Bot Config)
export function readBotSettings(uuid: string): BotConfig | null {
    const p = path.join(DB_DIR, `${uuid}.settings.json`);
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, "utf-8"));
}
export function writeBotSettings(uuid: string, data: BotConfig): void {
    fs.writeFileSync(path.join(DB_DIR, `${uuid}.settings.json`), JSON.stringify(data, null, 2));
}

// Bot Data
export function readBotData(uuid: string): BotOperationalData | null {
    const p = path.join(DB_DIR, `${uuid}.bot.json`);
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, "utf-8"));
}
export function writeBotData(uuid: string, data: BotOperationalData): void {
    fs.writeFileSync(path.join(DB_DIR, `${uuid}.bot.json`), JSON.stringify(data, null, 2));
}

// API Responders
export function readBotApiResponders(uuid: string): ApiResponderCommand[] {
    const p = path.join(DB_DIR, `${uuid}.api.json`);
    if (!fs.existsSync(p)) return [];
    return JSON.parse(fs.readFileSync(p, "utf-8"));
}
export function writeBotApiResponders(uuid: string, data: ApiResponderCommand[]): void {
    fs.writeFileSync(path.join(DB_DIR, `${uuid}.api.json`), JSON.stringify(data, null, 2));
}

// Legacy-like operations for old code compatibility
export function readDatabase(): { users: User[] } {
    const globalAdmin = readGlobalAdmin();
    const users: User[] = globalAdmin.users.map(u => ({
        ...u,
        botConfig: readBotSettings(u.id) || undefined
    }));
    return { users };
}

export function findUserById(id: string): User | undefined {
    const db = readGlobalAdmin();
    const auth = db.users.find((user) => user.id === id);
    if (!auth) return undefined;
    return { ...auth, botConfig: readBotSettings(id) || undefined };
}

export function getBotConfig(userId: string): BotConfig {
    let settings = readBotSettings(userId);
    if (!settings) {
        settings = { ...defaultBotConfig };
        writeBotSettings(userId, settings);
    }
    return settings;
}

export function updateBotConfig(userId: string, config: Partial<BotConfig>): BotConfig {
    const auth = findUserById(userId);
    if (!auth) throw new Error("User not found");

    const currentConfig = readBotSettings(userId) || { ...defaultBotConfig };
    const newConfig = { ...currentConfig, ...config };
    writeBotSettings(userId, newConfig);

    return newConfig;
}

export function findUserByEmail(email: string): User | undefined {
    const db = readGlobalAdmin();
    const auth = db.users.find((user) => user.email.toLowerCase() === email.toLowerCase());
    if (!auth) return undefined;
    return { ...auth, botConfig: readBotSettings(auth.id) || undefined };
}

export function findUserByUsername(username: string): User | undefined {
    const db = readGlobalAdmin();
    const auth = db.users.find((user) => user.username.toLowerCase() === username.toLowerCase());
    if (!auth) return undefined;
    return { ...auth, botConfig: readBotSettings(auth.id) || undefined };
}

export function findUserByEmailOrUsername(identifier: string): User | undefined {
    const db = readGlobalAdmin();
    const auth = db.users.find(
        (user) =>
            user.email.toLowerCase() === identifier.toLowerCase() ||
            user.username.toLowerCase() === identifier.toLowerCase()
    );
    if (!auth) return undefined;
    return { ...auth, botConfig: readBotSettings(auth.id) || undefined };
}

export function createUser(username: string, email: string, password: string): User {
    const db = readGlobalAdmin();
    const role = username.toLowerCase() === 'admin' ? 'admin' : 'user';
    const newUserAuth: UserAuth = {
        id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(), // fallback for some environments
        username,
        email,
        password,
        role,
        createdAt: new Date().toISOString()
    };

    db.users.push(newUserAuth);
    writeGlobalAdmin(db);

    writeProfile(newUserAuth.id, {
        id: newUserAuth.id,
        username,
        role,
        subscriptionEnd: null,
        createdAt: newUserAuth.createdAt
    });

    const botConfig = { ...defaultBotConfig };
    writeBotSettings(newUserAuth.id, botConfig);
    writeBotData(newUserAuth.id, { ...defaultBotData });

    return { ...newUserAuth, botConfig };
}
