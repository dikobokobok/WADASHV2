"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Info, Folder, Terminal } from "lucide-react";

interface CategoryGroup {
    category: string;
    commands: string[];
}

export default function CommandsList() {
    const [categories, setCategories] = useState<CategoryGroup[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCommands = async () => {
            try {
                const res = await fetch("/api/commands");
                const result = await res.json();
                if (result.success) {
                    setCategories(result.data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchCommands();
    }, []);

    return (
        <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
            <div className="max-w-5xl mx-auto space-y-6">
                
                {/* Page heading */}
                <div className="mb-2">
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex flex-shrink-0 items-center justify-center">
                            <Info className="w-5 h-5 text-violet-500" />
                        </div>
                        Registered Commands
                    </h1>
                    <p className="text-sm text-muted-foreground mt-2">
                        Daftar ini menampilkan semua fitur bot yang terdaftar melalui sistem plugin dan aktif saat ini.
                    </p>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="h-32 bg-muted animate-pulse rounded-2xl" />
                        ))}
                    </div>
                ) : categories.length === 0 ? (
                    <Card className="border-0 shadow-sm mt-8">
                        <CardContent className="p-12 text-center text-muted-foreground bg-secondary/20 rounded-2xl">
                            Belum ada command yang terdaftar pada sistem plugin.
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4 pt-2">
                        {categories.map((group) => (
                            <Card key={group.category} className="border-0 shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
                                <CardHeader className="bg-secondary/40 border-b border-border/50 px-3 py-2.5">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center group-hover:bg-violet-100 dark:group-hover:bg-violet-900/30 transition-colors">
                                            <Folder className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 group-hover:text-violet-600 dark:group-hover:text-violet-400" />
                                        </div>
                                        <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
                                            {group.category}
                                        </h2>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-3.5 bg-card">
                                    <div className="flex flex-wrap gap-1.5">
                                        {group.commands.map((cmd) => (
                                            <div 
                                                key={cmd} 
                                                className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:border-violet-300 dark:hover:border-violet-700 transition-colors"
                                            >
                                                <Terminal className="w-3 h-3 text-violet-400" />
                                                <span>{cmd}</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
