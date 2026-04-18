import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "database", "database.json");

export interface User {
    id: string;
    username: string;
    email: string;
    password: string;
    createdAt: string;
    botConfig?: BotConfig;
}

export interface BotConfig {
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
}

interface Database {
    users: User[];
}

const defaultBotConfig: BotConfig = {
    botName: "WibuBot",
    packname: "WADASH",
    authorname: "WADASH",
    footerText: "© 2024 WADASH Bot",
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
};

export function readDatabase(): Database {
    try {
        const data = fs.readFileSync(DB_PATH, "utf-8");
        return JSON.parse(data);
    } catch (error) {
        return {
            users: [],
        };
    }
}

export function writeDatabase(data: Database): void {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

export function findUserById(id: string): User | undefined {
    const db = readDatabase();
    return db.users.find((user) => user.id === id);
}

export function getBotConfig(userId: string): BotConfig {
    const db = readDatabase();
    const user = db.users.find((u) => u.id === userId);

    if (!user) {
        throw new Error("User not found");
    }

    // If user doesn't have a config, initialize with default
    if (!user.botConfig) {
        user.botConfig = { ...defaultBotConfig };
        writeDatabase(db);
    }

    return user.botConfig;
}

export function updateBotConfig(userId: string, config: Partial<BotConfig>): BotConfig {
    const db = readDatabase();
    const user = db.users.find((u) => u.id === userId);

    if (!user) {
        throw new Error("User not found");
    }

    // Initialize config if it doesn't exist
    if (!user.botConfig) {
        user.botConfig = { ...defaultBotConfig };
    }

    // Update config
    user.botConfig = { ...user.botConfig, ...config };
    writeDatabase(db);

    return user.botConfig;
}

export function findUserByEmail(email: string): User | undefined {
    const db = readDatabase();
    return db.users.find((user) => user.email.toLowerCase() === email.toLowerCase());
}

export function findUserByUsername(username: string): User | undefined {
    const db = readDatabase();
    return db.users.find((user) => user.username.toLowerCase() === username.toLowerCase());
}

export function findUserByEmailOrUsername(identifier: string): User | undefined {
    const db = readDatabase();
    return db.users.find(
        (user) =>
            user.email.toLowerCase() === identifier.toLowerCase() ||
            user.username.toLowerCase() === identifier.toLowerCase()
    );
}

export function createUser(username: string, email: string, password: string): User {
    const db = readDatabase();
    const newUser: User = {
        id: Date.now().toString(),
        username,
        email,
        password,
        createdAt: new Date().toISOString(),
        botConfig: { ...defaultBotConfig },
    };
    db.users.push(newUser);
    writeDatabase(db);
    return newUser;
}
