/**
 * MenuForm — bot menu template editor
 *
 * Renders an editor for the bot's interactive menu message to users.
 */

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Save, MessageSquare, Info, CheckCircle, XCircle
} from "lucide-react";
import type { BotConfig } from "@/lib/database";

interface MenuFormProps {
    config: BotConfig;
    setConfig: (config: BotConfig) => void;
    handleSubmit: (e: React.FormEvent) => void;
    saving: boolean;
    message: string;
}

const LABEL_CLASS =
    "block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5";

function StatusMessage({ message }: { message: string }) {
    const isSuccess = message.includes("success");

    return (
        <div className={[
            "flex items-center gap-3 p-4 rounded-2xl text-sm font-medium border",
            isSuccess
                ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50"
                : "bg-rose-50    dark:bg-rose-950/30    text-rose-700    dark:text-rose-400    border-rose-200    dark:border-rose-900/50",
        ].join(" ")}>
            {isSuccess
                ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
                : <XCircle className="w-4 h-4 flex-shrink-0" />}
            {message}
        </div>
    );
}

const AVAILABLE_VARIABLES = [
    { name: "{user.bot}", description: "Username pengguna bot (wajib regis untuk mendapatkan username)" },
    { name: "{name.bot}", description: "Nama dari bot Anda" },
    { name: "{uptime}", description: "Seberapa lama bot telah aktif" },
    { name: "{time}", description: "Waktu sekarang" },
    { name: "{date}", description: "Tanggal sekarang" },
    { name: "{action.prefix}", description: "Prefix yang digunakan oleh user" },
    { name: "{all fitur}", description: "List semua fitur tanpa filter kategori" },
    { name: "{kategori}", description: "Daftar kategori beserta fiturnya yang tersedia" },
    { name: "{footer}", description: "Teks watermark / footer bot" },
];

const DEFAULT_MENU = `halo {user.bot}🙌🏻

WELCOME TO {name.bot}
> Name BOT : {name.bot}
> Uptime : {uptime}
> Jam : {time}
> Tanggal : {date}
> Prefix : {action.prefix}

List Semua Fitur :
{all fitur}

Atau Berdasarkan Kategori :
{kategori}

{footer}`;

export default function MenuForm({
    config,
    setConfig,
    handleSubmit,
    saving,
    message,
}: MenuFormProps) {
    const update = (patch: Partial<BotConfig>) => setConfig({ ...config, ...patch });

    return (
        <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Page heading */}
                <div className="mb-2">
                    <h1 className="text-2xl font-bold text-foreground">Menu Template Configuration</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Customize the menu interface presented by your bot. Connect directly to modify the bot's response template.
                    </p>
                </div>

                {/* Status feedback */}
                {message && <StatusMessage message={message} />}

                <form onSubmit={handleSubmit} className="space-y-4">

                    <Card className="border-0 shadow-sm overflow-hidden">
                        <CardHeader className="pb-0 px-6 pt-5">
                            <div className="flex items-center gap-3 mb-1">
                                <div className="w-8 h-8 rounded-xl bg-violet-50 dark:bg-violet-950/40 flex items-center justify-center">
                                    <MessageSquare className="w-4 h-4 text-violet-500" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold text-foreground">Message Body</h2>
                                    <p className="text-[11px] text-muted-foreground">Main conversational template triggered on menu command</p>
                                </div>
                            </div>
                            <div className="h-px bg-border mt-4" />
                        </CardHeader>
                        <CardContent className="px-6 pt-5 pb-6 flex flex-col md:flex-row gap-6">
                            
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Template Content</label>
                                    <button 
                                        type="button" 
                                        onClick={() => update({ menuTemplate: DEFAULT_MENU })}
                                        className="text-[10px] uppercase font-bold text-violet-500 hover:text-violet-600 dark:hover:text-violet-400 tracking-wider hover:underline"
                                    >
                                        Load Default
                                    </button>
                                </div>
                                <textarea
                                    className="w-full min-h-[400px] px-4 py-3 bg-secondary/50 border border-input rounded-xl text-sm font-mono leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all duration-200 resize-y"
                                    value={config.menuTemplate || ""}
                                    onChange={(e) => update({ menuTemplate: e.target.value })}
                                />
                            </div>

                            <div className="w-full md:w-64 flex-shrink-0">
                                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-border">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Info className="w-4 h-4 text-slate-500" />
                                        <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground">Available Variables</h3>
                                    </div>
                                    <div className="space-y-3">
                                        {AVAILABLE_VARIABLES.map((v) => (
                                            <div key={v.name} className="flex flex-col gap-0.5">
                                                <code className="text-[11px] font-bold text-violet-600 dark:text-violet-400 bg-violet-100/50 dark:bg-violet-900/20 px-1 py-0.5 rounded w-fit">
                                                    {v.name}
                                                </code>
                                                <span className="text-[10px] text-slate-500 font-medium">
                                                    {v.description}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                        </CardContent>
                    </Card>

                    {/* Save action */}
                    <div className="flex justify-end pb-8 pt-2">
                        <Button
                            type="submit"
                            disabled={saving}
                            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white px-8 py-5 gap-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-200"
                        >
                            <Save className="w-4 h-4" />
                            {saving ? "Saving…" : "Save Template"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
