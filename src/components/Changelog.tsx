"use client";

import { CheckCircle2, Circle, Rocket, Bug, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const CHANGELOG_DATA = [
    {
        version: "v2.0.0",
        date: "May 12, 2026",
        badge: "Latest",
        badgeColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
        icon: Rocket,
        iconBg: "bg-emerald-500",
        changes: [
            { type: "feature", text: "Complete UI overhaul with a brand new Dashboard" },
            { type: "feature", text: "Introduced secure session deletion with inline verification modal" },
            { type: "feature", text: "Added CSS-based dynamic loading spinners for better UX" },
            { type: "improvement", text: "Improved split-screen layout for Login and Register pages" },
        ]
    },
    {
        version: "v1.5.2",
        date: "April 28, 2026",
        icon: Sparkles,
        iconBg: "bg-violet-500",
        changes: [
            { type: "feature", text: "Added API Chat Responder configuration tab" },
            { type: "improvement", text: "Refined dark mode color palette for better contrast" },
            { type: "fix", text: "Fixed an issue where the bot status indicator would occasionally desync" },
        ]
    },
    {
        version: "v1.5.0",
        date: "April 10, 2026",
        icon: Circle,
        iconBg: "bg-blue-500",
        changes: [
            { type: "feature", text: "Live streaming of bot logs directly to the dashboard" },
            { type: "feature", text: "QR code rendering optimization for faster scanning" },
            { type: "fix", text: "Resolved memory leak during long-running sessions" },
        ]
    },
    {
        version: "v1.0.0",
        date: "January 15, 2026",
        icon: Rocket,
        iconBg: "bg-slate-500",
        changes: [
            { type: "feature", text: "Initial release of WADASH Bot Dashboard" },
            { type: "feature", text: "Basic configuration and menu setup" },
            { type: "feature", text: "Start/Stop/Delete bot controls" },
        ]
    }
];

function getChangeIcon(type: string) {
    switch (type) {
        case "feature": return <Sparkles className="w-4 h-4 text-violet-500" />;
        case "fix": return <Bug className="w-4 h-4 text-rose-500" />;
        case "improvement": return <CheckCircle2 className="w-4 h-4 text-blue-500" />;
        default: return <Circle className="w-4 h-4 text-slate-500" />;
    }
}

export default function Changelog() {
    return (
        <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto space-y-8 page-enter">
            <div className="text-center space-y-4 mb-12">
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                    Changelog
                </h1>
                <p className="text-lg text-slate-500 dark:text-slate-400">
                    New updates, improvements, and fixes for WADASH Bot.
                </p>
            </div>

            <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 md:ml-8 space-y-12 pb-8">
                {CHANGELOG_DATA.map((release, index) => (
                    <div key={index} className="relative pl-8 md:pl-12">
                        {/* Timeline node */}
                        <div className={`absolute -left-[17px] top-1 w-8 h-8 rounded-full border-4 border-background flex items-center justify-center ${release.iconBg} text-white shadow-sm`}>
                            <release.icon className="w-3.5 h-3.5" />
                        </div>
                        
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                                {release.version}
                            </h2>
                            {release.badge && (
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${release.badgeColor}`}>
                                    {release.badge}
                                </span>
                            )}
                            <span className="text-sm font-medium text-slate-500 dark:text-slate-400 sm:ml-auto">
                                {release.date}
                            </span>
                        </div>

                        <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
                            <CardContent className="p-6">
                                <ul className="space-y-4">
                                    {release.changes.map((change, cIdx) => (
                                        <li key={cIdx} className="flex gap-3 text-slate-700 dark:text-slate-300">
                                            <div className="mt-0.5 flex-shrink-0">
                                                {getChangeIcon(change.type)}
                                            </div>
                                            <span className="text-sm leading-relaxed">{change.text}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                ))}
            </div>
        </div>
    );
}
