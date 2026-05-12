import { compareSync, hashSync } from "bcryptjs";

const BCRYPT_ROUNDS = 12;

function applyPepper(plain: string): string {
    const p = process.env.PASSWORD_PEPPER?.trim();
    if (!p) return plain;
    return `${plain}\0${p}`;
}

export function hashPassword(plain: string): string {
    return hashSync(applyPepper(plain), BCRYPT_ROUNDS);
}

/** True if stored value looks like a bcrypt hash. */
export function isPasswordHashed(stored: string): boolean {
    return stored.startsWith("$2a$") || stored.startsWith("$2b$") || stored.startsWith("$2y$");
}

export function verifyPassword(stored: string, plain: string): boolean {
    if (isPasswordHashed(stored)) {
        if (compareSync(applyPepper(plain), stored)) return true;
        return compareSync(plain, stored);
    }
    return stored === plain;
}
