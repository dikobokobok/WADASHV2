import { WAMessage } from '@whiskeysockets/baileys';
import makeWASocket from '@whiskeysockets/baileys';

// === Import plugin di sini ===
import * as ping from './ping';
import * as owner from './owner';
import * as sticker from './sticker';
import * as exec from './exec';
import * as evalPlugin from './eval';
// ============================

export interface Plugin {
    command: string | string[];  // Bisa satu alias atau array alias, contoh: ['sticker', 'stiker', 's']
    category?: string;           // e.g. 'owner', 'sticker', 'download', 'general'
    execute: (
        sock: ReturnType<typeof makeWASocket>,
        msg: WAMessage,
        args: string[],
        settings: Record<string, any>
    ) => Promise<void>;
}

// Daftar semua plugin yang aktif
const pluginList: Plugin[] = [
    ping,
    owner,
    sticker,
    exec,
    evalPlugin,
];

// Build map command -> plugin
const pluginRegistry = new Map<string, Plugin>();

// Build map category -> command list (untuk menu dinamis)
export const categoryRegistry = new Map<string, string[]>();

for (const plugin of pluginList) {
    if (plugin.command && typeof plugin.execute === 'function') {
        // Normalisasi: jadikan selalu array
        const aliases = Array.isArray(plugin.command) ? plugin.command : [plugin.command];
        const primaryCommand = aliases[0]; // Alias utama untuk menu

        // Daftarkan semua alias ke registry
        for (const alias of aliases) {
            pluginRegistry.set(alias, plugin);
        }

        console.log(`[PluginLoader] Registered plugin: ${aliases.join(' | ')} [${plugin.category || 'general'}]`);

        // Daftarkan hanya alias utama ke kategori (untuk tampilan menu)
        const cat = plugin.category || 'general';
        if (!categoryRegistry.has(cat)) categoryRegistry.set(cat, []);
        categoryRegistry.get(cat)!.push(primaryCommand);
    }
}

export default pluginRegistry;
