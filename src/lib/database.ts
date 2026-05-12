import fs from "fs";
import path from "path";
import crypto from "crypto";
import { hashPassword } from "@/lib/password";

const DB_DIR = path.join(process.cwd(), "database");
const GLOBAL_ADMIN_PATH = path.join(DB_DIR, "global_admin.json");
const OLD_DB_PATH = path.join(DB_DIR, "database.json");

export interface LoginSecurityState {
    failedAttempts: number;
    lockedUntil: string | null;
}

export interface UserAuth {
    id: string;
    username: string;
    email: string;
    password: string;
    role: string;
    createdAt: string;
    loginSecurity?: LoginSecurityState;
}

export interface AuthSessionRecord {
    jti: string;
    userId: string;
    createdAt: string;
    revokedAt: string | null;
    csrfToken: string;
}

export interface SecurityAuditEntry {
    at: string;
    action: string;
    userId?: string;
    detail?: string;
    ip?: string;
}

export interface GlobalAdminData {
    users: UserAuth[];
    systemStats: Record<string, unknown>;
    securityLogs: SecurityAuditEntry[];
    sessions: AuthSessionRecord[];
    globalOwnerNumber?: string;
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
    sendOption: "text" | "media" | "image" | "video" | "gif" | "sticker";
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
    contacts: unknown[];
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
    menuTemplate: "halo {user.bot}🙌🏻\n\nWELCOME TO {name.bot}\n> Name BOT : {name.bot}\n> Uptime : {uptime}\n> Jam : {time}\n> Tanggal : {date}\n> Prefix : {action.prefix}\n\nList Bot :\n{all fitur}\n\nList Bot by Kategori :\n{kategori}"
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
        const newGlobalAdmin: GlobalAdminData = {
            users: [],
            systemStats: {},
            securityLogs: [],
            sessions: [],
        };

        for (const u of oldData.users) {
            const role = u.username.toLowerCase() === 'admin' ? 'globOwner' : 'basic';

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

function normalizeGlobalAdmin(raw: unknown): GlobalAdminData {
    const o = raw as Partial<GlobalAdminData>;
    return {
        users: Array.isArray(o.users) ? o.users : [],
        systemStats:
            o.systemStats && typeof o.systemStats === "object" && !Array.isArray(o.systemStats)
                ? (o.systemStats as Record<string, unknown>)
                : {},
        securityLogs: Array.isArray(o.securityLogs) ? (o.securityLogs as SecurityAuditEntry[]) : [],
        sessions: Array.isArray(o.sessions) ? (o.sessions as AuthSessionRecord[]) : [],
        globalOwnerNumber: o.globalOwnerNumber,
    };
}

export function readGlobalAdmin(): GlobalAdminData {
    if (!fs.existsSync(GLOBAL_ADMIN_PATH)) {
        const defaultData: GlobalAdminData = {
            users: [],
            systemStats: {},
            securityLogs: [],
            sessions: [],
        };
        writeGlobalAdmin(defaultData);
        return defaultData;
    }
    try {
        const parsed: unknown = JSON.parse(fs.readFileSync(GLOBAL_ADMIN_PATH, "utf-8"));
        return normalizeGlobalAdmin(parsed);
    } catch {
        return { users: [], systemStats: {}, securityLogs: [], sessions: [] };
    }
}

export function writeGlobalAdmin(data: GlobalAdminData): void {
    fs.writeFileSync(GLOBAL_ADMIN_PATH, JSON.stringify(data, null, 2));
}

export function getGlobalOwnerNumber(): string | undefined {
    return readGlobalAdmin().globalOwnerNumber;
}

export function setGlobalOwnerNumber(number: string): void {
    const db = readGlobalAdmin();
    db.globalOwnerNumber = number;
    writeGlobalAdmin(db);
}

const MAX_AUDIT_LOG = 2000;
const LOGIN_FAILURES_BEFORE_LOCK = 5;
const LOGIN_LOCK_MINUTES = 30;

function getLoginSecurity(user: UserAuth): LoginSecurityState {
    return user.loginSecurity ?? { failedAttempts: 0, lockedUntil: null };
}

export function isUserAccountLocked(user: UserAuth): boolean {
    const s = getLoginSecurity(user);
    if (!s.lockedUntil) return false;
    return new Date(s.lockedUntil).getTime() > Date.now();
}

export function recordUserLoginFailure(userId: string): void {
    const db = readGlobalAdmin();
    const idx = db.users.findIndex((u) => u.id === userId);
    if (idx === -1) return;
    const u = db.users[idx];
    if (isUserAccountLocked(u)) return;

    const s = getLoginSecurity(u);
    const failed = s.failedAttempts + 1;
    let lockedUntil: string | null = s.lockedUntil;
    if (failed >= LOGIN_FAILURES_BEFORE_LOCK) {
        lockedUntil = new Date(Date.now() + LOGIN_LOCK_MINUTES * 60 * 1000).toISOString();
    }
    db.users[idx] = {
        ...u,
        loginSecurity: { failedAttempts: failed, lockedUntil },
    };
    writeGlobalAdmin(db);
}

export function resetUserLoginSecurity(userId: string): void {
    const db = readGlobalAdmin();
    const idx = db.users.findIndex((u) => u.id === userId);
    if (idx === -1) return;
    const u = db.users[idx];
    db.users[idx] = {
        ...u,
        loginSecurity: { failedAttempts: 0, lockedUntil: null },
    };
    writeGlobalAdmin(db);
}

export function appendSecurityAudit(entry: Omit<SecurityAuditEntry, "at"> & { at?: string }): void {
    const db = readGlobalAdmin();
    const row: SecurityAuditEntry = {
        at: entry.at ?? new Date().toISOString(),
        action: entry.action,
        userId: entry.userId,
        detail: entry.detail,
        ip: entry.ip,
    };
    db.securityLogs.push(row);
    if (db.securityLogs.length > MAX_AUDIT_LOG) {
        db.securityLogs.splice(0, db.securityLogs.length - MAX_AUDIT_LOG);
    }
    writeGlobalAdmin(db);
}

export function findActiveAuthSession(jti: string): AuthSessionRecord | undefined {
    const db = readGlobalAdmin();
    return db.sessions.find((s) => s.jti === jti && s.revokedAt === null);
}

export function createAuthSession(record: AuthSessionRecord): void {
    const db = readGlobalAdmin();
    db.sessions.push(record);
    writeGlobalAdmin(db);
}

export function revokeAuthSessionByJti(jti: string): void {
    const db = readGlobalAdmin();
    const now = new Date().toISOString();
    let changed = false;
    for (const s of db.sessions) {
        if (s.jti === jti && s.revokedAt === null) {
            s.revokedAt = now;
            changed = true;
            break;
        }
    }
    if (changed) writeGlobalAdmin(db);
}

export function revokeAllAuthSessionsForUser(userId: string): void {
    const db = readGlobalAdmin();
    const now = new Date().toISOString();
    let changed = false;
    for (const s of db.sessions) {
        if (s.userId === userId && s.revokedAt === null) {
            s.revokedAt = now;
            changed = true;
        }
    }
    if (changed) writeGlobalAdmin(db);
}

export function newSessionCsrfToken(): string {
    return crypto.randomBytes(24).toString("hex");
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

export function updateUserPasswordHash(userId: string, passwordHash: string): void {
    const db = readGlobalAdmin();
    const idx = db.users.findIndex((u) => u.id === userId);
    if (idx === -1) throw new Error("User not found");
    db.users[idx] = { ...db.users[idx], password: passwordHash };
    writeGlobalAdmin(db);
}

export function updateUserProfile(userId: string, data: { username?: string, email?: string }): void {
    const db = readGlobalAdmin();
    const idx = db.users.findIndex((u) => u.id === userId);
    if (idx === -1) throw new Error("User not found");
    
    if (data.username) db.users[idx].username = data.username;
    if (data.email) db.users[idx].email = data.email;
    
    writeGlobalAdmin(db);

    const profile = readProfile(userId);
    if (profile) {
        if (data.username) profile.username = data.username;
        writeProfile(userId, profile);
    }
}

export function createUser(username: string, email: string, password: string): User {
    const db = readGlobalAdmin();
    const role = 'basic';
    const newUserAuth: UserAuth = {
        id: crypto.randomUUID(),
        username,
        email,
        password: hashPassword(password),
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
