"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Save, Filter } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { ApiResponderCommand } from "@/lib/database";

export default function ApiResponderForm() {
    const [responders, setResponders] = useState<ApiResponderCommand[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditingData, setIsEditingData] = useState<ApiResponderCommand | null>(null);
    const [viewMode, setViewMode] = useState<"list" | "form">("list");
    const [message, setMessage] = useState("");

    useEffect(() => {
        const fetchResponders = async () => {
            try {
                const res = await fetch("/api/api-responders");
                if (res.ok) {
                    const data = await res.json();
                    setResponders(data);
                }
            } catch (error) {
                console.error("Failed to fetch API responders", error);
            } finally {
                setLoading(false);
            }
        };
        fetchResponders();
    }, []);

    const saveToServer = async (newData: ApiResponderCommand[]) => {
        setSaving(true);
        setMessage("");
        try {
            const res = await fetch("/api/api-responders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newData),
            });
            if (res.ok) {
                setMessage("Saved successfully!");
                setResponders(newData);
            } else {
                setMessage("Failed to save.");
            }
        } catch (error) {
            setMessage("An error occurred.");
        } finally {
            setSaving(false);
            setTimeout(() => setMessage(""), 3000);
        }
    };

    const handleCreate = () => {
        setIsEditingData({
            id: Date.now().toString(),
            actionTrigger: "",
            category: "general",
            apiLink: "",
            sendOption: "image",
        });
        setViewMode("form");
    };

    const handleEditForm = (item: ApiResponderCommand) => {
        setIsEditingData(item);
        setViewMode("form");
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Hapus responder ini?")) return;
        const newResponders = responders.filter(r => r.id !== id);
        await saveToServer(newResponders);
    };

    const handleSubmitForm = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isEditingData) return;

        const exists = responders.find(r => r.id === isEditingData.id);
        let newResponders;
        if (exists) {
            newResponders = responders.map(r => r.id === isEditingData.id ? isEditingData : r);
        } else {
            newResponders = [...responders, isEditingData];
        }

        setViewMode("list");
        setIsEditingData(null);
        await saveToServer(newResponders);
    };

    if (viewMode === "form" && isEditingData) {
        return (
            <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-4xl">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
                        <Filter className="w-5 h-5 text-violet-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">API Responder Form</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">Konfigurasi aksi bot saat trigger digunakan</p>
                    </div>
                </div>

                <Card className="border-0 shadow-sm">
                    <CardHeader className="bg-secondary/40 border-b border-border/50 px-5 py-4">
                        <h2 className="text-sm font-semibold text-foreground">Detail Aksi</h2>
                    </CardHeader>
                    <CardContent className="p-5">
                        <form onSubmit={handleSubmitForm} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground">Action Trigger <span className="text-rose-500">*</span></label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            required
                                            value={isEditingData.actionTrigger}
                                            onChange={(e) => setIsEditingData({ ...isEditingData, actionTrigger: e.target.value.toLowerCase() })}
                                            className="w-full h-10 px-3 bg-secondary/30 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 font-medium"
                                            placeholder="Contoh: !contohfitur"
                                        />
                                    </div>
                                    <p className="text-[10px] text-muted-foreground">Ketik perintah untuk trigger bot, contoh: !quotes atau !meme</p>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground">Kategori Menu <span className="text-rose-500">*</span></label>
                                    <input
                                        type="text"
                                        required
                                        value={isEditingData.category}
                                        onChange={(e) => setIsEditingData({ ...isEditingData, category: e.target.value })}
                                        className="w-full h-10 px-3 bg-secondary/30 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                                        placeholder="Contoh: fun"
                                    />
                                    <p className="text-[10px] text-muted-foreground">Opsi ditaruh bagian kategori mana di menu</p>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-foreground">Form Link API <span className="text-rose-500">*</span></label>
                                <input
                                    type="url"
                                    required
                                    value={isEditingData.apiLink}
                                    onChange={(e) => setIsEditingData({ ...isEditingData, apiLink: e.target.value })}
                                    className="w-full h-10 px-3 bg-secondary/30 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                                    placeholder="https://api.example.com/data?pesan1={msg1}&pesan2={msg2}"
                                />
                                <p className="text-[10px] text-muted-foreground">Gunakan <b>{'{msg1}'}</b>, <b>{'{msg2}'}</b> dsb. untuk param dari text user (dipisahkan ole |).</p>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-foreground">Opsi Pilihan Kirim</label>
                                <select
                                    value={isEditingData.sendOption}
                                    onChange={(e) => setIsEditingData({ ...isEditingData, sendOption: e.target.value as any })}
                                    className="w-full h-10 px-3 bg-secondary/30 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                                >
                                    <option value="text">Text (Output berupa Teks)</option>
                                    <option value="image">Gambar (Image dari API)</option>
                                    <option value="video">Video (Video dari API)</option>
                                    <option value="gif">GIF (Animasi GIF dari API)</option>
                                    <option value="sticker">Sticker (Konversi Gambar ke Stiker)</option>
                                </select>
                            </div>

                            <div className="pt-4 flex items-center justify-end gap-3 border-t border-border mt-4">
                                <button
                                    type="button"
                                    onClick={() => setViewMode("list")}
                                    className="px-4 py-2 text-sm font-semibold rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm font-semibold rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition-colors flex items-center gap-2"
                                >
                                    <Save className="w-4 h-4" />
                                    Simpan Perubahan
                                </button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
                <div className="h-12 w-64 bg-muted animate-pulse rounded-xl" />
                <div className="h-48 bg-muted animate-pulse rounded-2xl" />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex flex-shrink-0 items-center justify-center">
                        <Filter className="w-5 h-5 text-violet-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">API Chat Responder</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">Kelola perintah untuk otomatis mengirim data api (text/media).</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {message && (
                        <div className="text-xs text-emerald-500 font-semibold px-2 animate-pulse">{message}</div>
                    )}
                </div>
            </div>

            <Card className="border-0 shadow-sm relative overflow-hidden">
                <CardHeader className="bg-secondary/40 border-b border-border/50 px-5 py-4 flex flex-row items-center justify-between">
                    <div>
                        <h2 className="text-sm font-semibold text-foreground">Daftar Responder</h2>
                        <p className="text-[10px] text-muted-foreground">({responders.length}) Responder tersimpan</p>
                    </div>
                    <button
                        onClick={handleCreate}
                        disabled={saving}
                        className="px-3 py-1.5 flex items-center gap-1.5 text-xs font-semibold rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-900/50 transition-colors disabled:opacity-50"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Tambah Baru
                    </button>
                </CardHeader>
                <CardContent className="p-0">
                    {responders.length === 0 ? (
                        <div className="p-10 text-center flex flex-col items-center">
                            <div className="w-12 h-12 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center mb-3">
                                <Plus className="w-5 h-5 text-gray-400" />
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Belum ada API Responder.</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Klik tombol &quot;Tambah Baru&quot; untuk mulai.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border/50">
                            {responders.map(r => (
                                <div key={r.id} className="p-4 flex items-center justify-between hover:bg-secondary/10 transition-colors group">
                                    <div className="flex-1 min-w-0 pr-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-sm text-foreground bg-secondary/50 px-2 py-0.5 rounded text-violet-500 border border-violet-100 dark:border-violet-900">
                                                {r.actionTrigger}
                                            </span>
                                            <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-500">
                                                ({r.category})
                                            </span>
                                            <span className="text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 px-1.5 py-0.5 rounded">
                                                {r.sendOption}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground font-mono truncate">{r.apiLink}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleEditForm(r)}
                                            disabled={saving}
                                            className="w-8 h-8 rounded-md flex items-center justify-center text-slate-400 hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/30 transition-colors disabled:opacity-50"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(r.id)}
                                            disabled={saving}
                                            className="w-8 h-8 rounded-md flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors disabled:opacity-50"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
