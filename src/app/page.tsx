/**
 * Dashboard page — main application shell
 *
 * Responsibilities:
 *  - Fetches & caches user/config data
 *  - Renders sidebar, header, and tab-based content area
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import ConfigForm from "@/components/ConfigForm";
import MenuForm from "@/components/MenuForm";
import CommandsList from "@/components/CommandsList";
import ApiResponderForm from "@/components/ApiResponderForm";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
    Home, CreditCard, HelpCircle, RotateCcw, Wrench,
    Inbox, Info, Filter, Edit, ShoppingBag, Users,
    UserPlus, LogOut, Settings, FileText, Zap,
    ChevronRight, Activity, Clock, Shield, Terminal,
    Play, Square, Trash2, Power,
} from "lucide-react";
import type { BotConfig } from "@/lib/database";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "dashboard" | "config" | "menu" | "commands" | "api-responder";

interface NavItem {
    label: string;
    icon: React.ElementType;
    tab?: Tab;
}

interface StatCard {
    label: string;
    value: string;
    sub: string;
    icon: React.ElementType;
    iconBg: string;
    iconColor: string;
    dot: string;
}

interface QuickLink {
    label: string;
    icon: React.ElementType;
    color: string;
    bg: string;
    tab?: Tab;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: BotConfig = {
    botName: "",
    packname: "",
    authorname: "",
    footerText: "",
    limit: 100,
    balance: 10000,
    ownerName: "",
    ownerNumber: "",
    prefix: "!",
    prefixType: "single",
    onlineOnConnect: true,
    premiumNotification: true,
    sewaNotificationToGroup: false,
    sewaNotificationToOwner: false,
    joinToUse: false,
    autoRead: false,
    menuTemplate: ""
};

const NAV_ITEMS: NavItem[] = [
    { label: "Dashboard", icon: Home, tab: "dashboard" },
    { label: "Pricing", icon: CreditCard },
    { label: "FAQ's", icon: HelpCircle },
    { label: "Changelog", icon: RotateCcw },
];

const BOT_NAV_ITEMS: NavItem[] = [
    { label: "Config", icon: Wrench, tab: "config" },
    { label: "Messages", icon: Inbox },
    { label: "Commands", icon: Info, tab: "commands" },
    { label: "API Chat Responder", icon: Filter, tab: "api-responder" as Tab },
    { label: "Menu", icon: Edit, tab: "menu" },
    { label: "Catalog", icon: ShoppingBag },
];

const USER_NAV_ITEMS: NavItem[] = [
    { label: "Settings", icon: Settings },
    { label: "Invoice", icon: FileText },
    { label: "Affiliate", icon: Users },
];

const STAT_CARDS: StatCard[] = [
    {
        label: "Bot Status",
        value: "Offline",
        sub: "Last seen: N/A",
        icon: Activity,
        iconBg: "bg-slate-100 dark:bg-slate-800",
        iconColor: "text-slate-500",
        dot: "bg-slate-400",
    },
    {
        label: "Expired At",
        value: "19 Des 2025",
        sub: "In 8 months",
        icon: Clock,
        iconBg: "bg-rose-50 dark:bg-rose-950/40",
        iconColor: "text-rose-500",
        dot: "bg-rose-400",
    },
    {
        label: "Runtime",
        value: "00:00:00",
        sub: "Uptime tracking",
        icon: Zap,
        iconBg: "bg-emerald-50 dark:bg-emerald-950/40",
        iconColor: "text-emerald-500",
        dot: "bg-emerald-400",
    },
    {
        label: "Role",
        value: "Basic Plan",
        sub: "Upgrade available",
        icon: Shield,
        iconBg: "bg-violet-50 dark:bg-violet-950/40",
        iconColor: "text-violet-500",
        dot: "bg-violet-400",
    },
];

const QUICK_LINKS: QuickLink[] = [
    { label: "Commands", icon: Info, color: "text-blue-500", bg: "bg-blue-50    dark:bg-blue-950/40", tab: "commands" as any },
    { label: "Catalog", icon: ShoppingBag, color: "text-amber-500", bg: "bg-amber-50   dark:bg-amber-950/40" },
    { label: "Affiliate", icon: UserPlus, color: "text-violet-500", bg: "bg-violet-50  dark:bg-violet-950/40" },
    { label: "Invoice", icon: FileText, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function NavSection({ title, items, activeTab, onTabChange, onClose }: {
    title: string;
    items: NavItem[];
    activeTab: Tab;
    onTabChange: (tab: Tab) => void;
    onClose: () => void;
}) {
    return (
        <div className="pt-5 pb-1">
            <p className="text-[10px] font-semibold text-gray-400 dark:text-slate-600 uppercase tracking-widest px-3 mb-2">
                {title}
            </p>
            {items.map((item) => (
                <SidebarButton
                    key={item.label}
                    item={item}
                    isActive={!!item.tab && activeTab === item.tab}
                    onClick={() => {
                        if (item.tab) onTabChange(item.tab);
                        onClose();
                    }}
                />
            ))}
        </div>
    );
}

function SidebarButton({ item, isActive, onClick }: {
    item: NavItem;
    isActive: boolean;
    onClick: () => void;
}) {
    const { icon: Icon, label } = item;

    return (
        <button
            onClick={onClick}
            className={[
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl",
                "text-sm font-medium transition-all duration-200 group",
                isActive
                    ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25"
                    : "text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.08]",
            ].join(" ")}
        >
            <Icon className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${!isActive && "group-hover:scale-110"}`} />
            <span className="truncate">{label}</span>
            {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-70" />}
        </button>
    );
}

function SkeletonCard() {
    return (
        <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
                <div className="flex items-start justify-between">
                    <div className="space-y-2.5">
                        <div className="h-4 w-16 bg-muted animate-pulse rounded-lg" />
                        <div className="h-6 w-24 bg-muted animate-pulse rounded-lg" />
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-muted animate-pulse" />
                </div>
            </CardContent>
        </Card>
    );
}

function ConfigSkeleton() {
    return (
        <div className="p-4 md:p-6 lg:p-8 max-w-4xl space-y-4">
            <div className="h-8 w-48 bg-muted animate-pulse rounded-xl" />
            <div className="h-4 w-64 bg-muted animate-pulse rounded-lg" />
            {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="h-36 bg-muted animate-pulse rounded-2xl" />
            ))}
        </div>
    );
}

// ─── Page component ───────────────────────────────────────────────────────────

export default function Dashboard() {
    const router = useRouter();

    const [username, setUsername] = useState("User");
    const [activeTab, setActiveTab] = useState<Tab>("dashboard");
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [config, setConfig] = useState<BotConfig>(DEFAULT_CONFIG);
    const [configLoaded, setConfigLoaded] = useState(false);
    const [loadingUser, setLoadingUser] = useState(true);
    const [loadingConfig, setLoadingConfig] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [botStatus, setBotStatus] = useState<'offline' | 'connecting' | 'online'>('offline');
    const [qrDataUrl, setQrDataUrl] = useState<string>('');
    const [botLogs, setBotLogs] = useState<string[]>([]);
    const [botOnlineAt, setBotOnlineAt] = useState<number | undefined>(undefined);

    // ── Data fetching ────────────────────────────────────────────────────────

    const fetchUserData = useCallback(async () => {
        setLoadingUser(true);
        try {
            const res = await fetch("/api/user");
            if (res.ok) {
                const data = await res.json();
                setUsername(data.username || "User");
            } else if (res.status === 401 || res.status === 404) {
                router.push("/login");
            }
        } catch {
            // Network error — stay on page silently
        } finally {
            setLoadingUser(false);
        }
    }, [router]);

    const fetchConfig = useCallback(async () => {
        setLoadingConfig(true);
        try {
            const res = await fetch("/api/config");
            if (res.ok) {
                setConfig(await res.json());
                setConfigLoaded(true);
            } else if (res.status === 401 || res.status === 404) {
                router.push("/login");
            }
        } catch {
            // Network error — stay on page silently
        } finally {
            setLoadingConfig(false);
        }
    }, [router]);

    useEffect(() => { fetchUserData(); }, [fetchUserData]);

    useEffect(() => {
        if ((activeTab === "config" || activeTab === "menu") && !configLoaded) fetchConfig();
    }, [activeTab, configLoaded, fetchConfig]);

    // ── Bot Engine SSE ───────────────────────────────────────────────────────
    useEffect(() => {
        const evtSource = new EventSource('/api/engine/stream');

        evtSource.addEventListener('status', (e) => {
            try {
                const data = JSON.parse(e.data);
                setBotStatus(data.status);
                setBotOnlineAt(data.onlineAt);
                if (data.qrCode) {
                    setQrDataUrl(data.qrCode);
                } else {
                    setQrDataUrl('');
                }
            } catch (error) {
                console.error("SSE parse error", error);
            }
        });

        evtSource.addEventListener('log', (e) => {
            try {
                const data = JSON.parse(e.data);
                if (data.message) {
                    setBotLogs(prev => [...prev, data.message].slice(-15));
                }
            } catch (error) { }
        });

        // Ping handler to prevent connection from dropping
        evtSource.addEventListener('ping', () => { });

        return () => evtSource.close();
    }, []);

    // ── Handlers ─────────────────────────────────────────────────────────────

    const handleBotAction = async (action: 'start' | 'stop' | 'delete') => {
        try {
            await fetch('/api/engine/action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action })
            });
        } catch (error) { }
    };

    const handleSaveConfig = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage("");

        try {
            const res = await fetch("/api/config", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(config),
            });

            const msg = res.ok
                ? "Configuration saved successfully!"
                : "Failed to save configuration.";

            setMessage(msg);
            if (res.ok) setTimeout(() => setMessage(""), 3000);
        } catch {
            setMessage("An error occurred. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" });
            router.push("/login");
            router.refresh();
        } catch {
            // Silent — session likely expired already
        }
    };

    const closeMobileMenu = () => setMobileMenuOpen(false);

    // ── Render ────────────────────────────────────────────────────────────────

    const userInitial = username.charAt(0).toUpperCase();

    return (
        <div className="flex min-h-screen bg-background">

            {/* Mobile overlay */}
            {mobileMenuOpen && (
                <div
                    aria-hidden
                    className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
                    onClick={closeMobileMenu}
                />
            )}

            {/* ── Sidebar ──────────────────────────────────────────────────── */}
            <aside className={[
                "sidebar w-60 fixed h-screen flex flex-col z-50",
                "transition-transform duration-300 ease-out",
                mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
            ].join(" ")}>

                {/* Brand */}
                <div className="h-16 flex items-center gap-3 px-5 border-b border-gray-200 dark:border-white/8 flex-shrink-0">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30 flex-shrink-0">
                        <span className="text-white font-bold text-sm">W</span>
                    </div>
                    <div>
                        <p className="text-gray-900 dark:text-white font-bold text-sm leading-none">WADASH</p>
                        <p className="text-gray-400 dark:text-slate-500 text-[10px] mt-0.5">Bot Dashboard</p>
                    </div>
                    <button className="ml-auto w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                        <HelpCircle className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
                    {NAV_ITEMS.map((item) => (
                        <SidebarButton
                            key={item.label}
                            item={item}
                            isActive={!!item.tab && activeTab === item.tab}
                            onClick={() => { if (item.tab) setActiveTab(item.tab); closeMobileMenu(); }}
                        />
                    ))}
                    <NavSection title="Bot" items={BOT_NAV_ITEMS} activeTab={activeTab} onTabChange={setActiveTab} onClose={closeMobileMenu} />
                    <NavSection title="User" items={USER_NAV_ITEMS} activeTab={activeTab} onTabChange={setActiveTab} onClose={closeMobileMenu} />
                </nav>

                {/* User footer */}
                <div className="px-3 py-4 border-t border-gray-200 dark:border-white/8">
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs font-bold">{userInitial}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            {loadingUser ? (
                                <div className="h-3 w-20 bg-gray-200 dark:bg-slate-700 animate-pulse rounded" />
                            ) : (
                                <p className="text-gray-900 dark:text-white text-sm font-medium truncate">{username}</p>
                            )}
                            <p className="text-gray-400 dark:text-slate-500 text-[10px]">Basic Plan</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* ── Main ─────────────────────────────────────────────────────── */}
            <main className="flex-1 flex flex-col lg:ml-60 min-h-screen">

                {/* Header */}
                <header className="bg-card/80 glass border-b border-border px-4 md:px-6 h-16 flex items-center justify-between sticky top-0 z-30">
                    <div className="flex items-center gap-3">
                        {/* Mobile menu toggle */}
                        <button
                            onClick={() => setMobileMenuOpen((prev) => !prev)}
                            className="lg:hidden w-8 h-8 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground"
                            aria-label="Toggle menu"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>

                        {/* Breadcrumb */}
                        <span className="hidden sm:block text-sm font-semibold text-foreground capitalize">
                            {activeTab}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <ThemeToggle className="w-8 h-8" />

                        <div className="w-px h-5 bg-border mx-1" />

                        {/* User avatar */}
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Avatar className="w-8 h-8 ring-2 ring-violet-500/30">
                                    <AvatarFallback className="text-white text-xs font-bold bg-gradient-to-br from-violet-600 to-indigo-600">
                                        {userInitial}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-background status-dot-pulse" />
                            </div>
                            {!loadingUser && (
                                <span className="hidden md:block text-sm font-medium text-foreground">{username}</span>
                            )}
                        </div>

                        {/* Logout */}
                        <button
                            onClick={handleLogout}
                            title="Logout"
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all duration-200"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </header>

                {/* Tab content */}
                <div key={activeTab} className="flex-1 page-enter">
                    {activeTab === "dashboard" && (
                        <DashboardContent
                            loadingUser={loadingUser}
                            botStatus={botStatus}
                            qrDataUrl={qrDataUrl}
                            botLogs={botLogs}
                            botOnlineAt={botOnlineAt}
                            handleBotAction={handleBotAction}
                            setActiveTab={setActiveTab}
                        />
                    )}
                    {activeTab === "config" && (
                        loadingConfig
                            ? <ConfigSkeleton />
                            : (
                                <ConfigForm
                                    config={config}
                                    setConfig={setConfig}
                                    handleSubmit={handleSaveConfig}
                                    saving={saving}
                                    message={message}
                                />
                            )
                    )}
                    {activeTab === "menu" && (
                        loadingConfig
                            ? <ConfigSkeleton />
                            : (
                                <MenuForm
                                    config={config}
                                    setConfig={setConfig}
                                    handleSubmit={handleSaveConfig}
                                    saving={saving}
                                    message={message}
                                />
                            )
                    )}
                    {activeTab === "commands" && (
                        <CommandsList />
                    )}
                    {activeTab === "api-responder" && (
                        <ApiResponderForm />
                    )}
                </div>
            </main>
        </div>
    );
}

// ─── Dashboard tab content ────────────────────────────────────────────────────

function DashboardContent({ loadingUser, botStatus, qrDataUrl, botLogs, botOnlineAt, handleBotAction, setActiveTab }: { loadingUser: boolean, botStatus: string, qrDataUrl: string, botLogs: string[], botOnlineAt?: number, handleBotAction: (action: any) => void, setActiveTab: (tab: Tab) => void }) {
    const [uptimeString, setUptimeString] = useState<string>("00:00:00");

    useEffect(() => {
        if (!botOnlineAt) {
            setUptimeString("00:00:00");
            return;
        }
        const interval = setInterval(() => {
            const diff = Math.floor((Date.now() - botOnlineAt) / 1000);
            const hh = String(Math.floor(diff / 3600)).padStart(2, "0");
            const mm = String(Math.floor((diff % 3600) / 60)).padStart(2, "0");
            const ss = String(diff % 60).padStart(2, "0");
            setUptimeString(`${hh}:${mm}:${ss}`);
        }, 1000);

        return () => clearInterval(interval);
    }, [botOnlineAt]);

    return (
        <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl">

            {/* Upgrade banner */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 p-px shadow-xl shadow-violet-500/20">
                <div className="rounded-2xl bg-gradient-to-r from-violet-600/95 via-purple-600/95 to-indigo-600/95 px-5 py-4 flex items-center gap-4">
                    <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                        <Zap className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                        <p className="text-white font-semibold text-sm">Unlock Premium Features</p>
                        <p className="text-violet-200 text-xs mt-0.5">
                            You&apos;re on Basic plan. Upgrade to access all bot features.
                        </p>
                    </div>
                    <button className="flex-shrink-0 bg-white text-violet-700 hover:bg-violet-50 font-semibold px-4 py-1.5 rounded-xl text-xs transition-colors shadow-sm">
                        Upgrade →
                    </button>
                </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {loadingUser
                    ? Array.from({ length: 4 }, (_, i) => <SkeletonCard key={i} />)
                    : STAT_CARDS.map((card) => {
                        let currentCard = { ...card };
                        if (card.label === "Bot Status") {
                            if (botStatus === "online") {
                                currentCard.value = "Online";
                                currentCard.sub = "Live";
                                currentCard.iconBg = "bg-emerald-50 dark:bg-emerald-950/40";
                                currentCard.iconColor = "text-emerald-500";
                                currentCard.dot = "bg-emerald-400";
                            } else if (botStatus === "connecting") {
                                currentCard.value = "Connecting...";
                                currentCard.sub = "Handshake in progress";
                                currentCard.iconBg = "bg-amber-50 dark:bg-amber-950/40";
                                currentCard.iconColor = "text-amber-500";
                                currentCard.dot = "bg-amber-400 animate-pulse";
                            } else {
                                currentCard.value = "Offline";
                                currentCard.sub = "Disconnected";
                                currentCard.iconBg = "bg-slate-100 dark:bg-slate-800 text-slate-500";
                                currentCard.iconColor = "text-slate-500";
                                currentCard.dot = "bg-slate-400";
                            }
                        } else if (card.label === "Runtime") {
                            if (botOnlineAt && botStatus === "online") {
                                currentCard.value = uptimeString;
                                currentCard.sub = "Bot is actively running";
                                currentCard.iconBg = "bg-emerald-50 dark:bg-emerald-950/40";
                                currentCard.iconColor = "text-emerald-500";
                                currentCard.dot = "bg-emerald-400 animate-pulse";
                            } else {
                                currentCard.value = "00:00:00";
                                currentCard.sub = "Uptime tracking paused";
                                currentCard.iconBg = "bg-slate-100 dark:bg-slate-800 text-slate-500";
                                currentCard.iconColor = "text-slate-500";
                                currentCard.dot = "bg-slate-400";
                            }
                        }
                        return <StatCardItem key={currentCard.label} card={currentCard} />
                    })
                }
            </div>

            {/* Logs + Control panel */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <BotLogsCard botLogs={botLogs} />
                <ControlPanelCard botStatus={botStatus} qrDataUrl={qrDataUrl} handleBotAction={handleBotAction} />
            </div>

            {/* Quick links */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {QUICK_LINKS.map((link) => (
                    <button
                        key={link.label}
                        onClick={() => {
                            if (link.tab) setActiveTab(link.tab as Tab);
                        }}
                        className="flex flex-col items-center gap-2.5 p-4 rounded-2xl bg-card border border-border hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-md transition-all duration-200 group"
                    >
                        <div className={`w-10 h-10 rounded-xl ${link.bg} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                            <link.icon className={`w-5 h-5 ${link.color}`} />
                        </div>
                        <span className="text-xs font-semibold text-foreground">{link.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}

function StatCardItem({ card }: { card: StatCard }) {
    return (
        <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
            <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-xs font-medium text-muted-foreground mb-1">{card.label}</p>
                        <p className="text-base font-bold text-foreground truncate">{card.value}</p>
                        <div className="flex items-center gap-1.5 mt-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${card.dot}`} />
                            <p className="text-[11px] text-muted-foreground">{card.sub}</p>
                        </div>
                    </div>
                    <div className={`w-11 h-11 rounded-2xl ${card.iconBg} flex items-center justify-center flex-shrink-0`}>
                        <card.icon className={`w-5 h-5 ${card.iconColor}`} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function BotLogsCard({ botLogs }: { botLogs: string[] }) {
    return (
        <Card className="lg:col-span-2 border-0 shadow-sm">
            <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-slate-800 flex items-center justify-center">
                            <Terminal className="w-4 h-4 text-violet-500 dark:text-slate-400" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-foreground">Bot Logs</p>
                            <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 dark:bg-slate-400" />
                                <p className="text-[11px] text-muted-foreground">{botLogs.length > 0 ? "Live logs incoming..." : "Waiting for logs"}</p>
                            </div>
                        </div>
                    </div>
                    <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-violet-100 dark:bg-slate-800 text-violet-600 dark:text-slate-500">
                        Live
                    </span>
                </div>

                <div className="h-44 rounded-xl border flex flex-col p-3 gap-1 bg-violet-50 dark:bg-slate-950 border-violet-200 dark:border-slate-800 overflow-y-auto">
                    {botLogs.length === 0 ? (
                        <div className="flex items-center justify-center flex-col h-full gap-2 opacity-70">
                            <Terminal className="w-5 h-5 text-violet-300 dark:text-slate-600" />
                            <p className="text-xs font-mono text-violet-400 dark:text-slate-500">No logs available</p>
                        </div>
                    ) : (
                        botLogs.map((log, idx) => (
                            <p key={idx} className="text-[11px] font-mono whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                                <span className="text-violet-500 dark:text-violet-400">&gt;</span> {log}
                            </p>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function ControlPanelCard({ botStatus, qrDataUrl, handleBotAction }: { botStatus: string, qrDataUrl: string, handleBotAction: (action: any) => void }) {
    return (
        <Card className="lg:col-span-1 border-0 shadow-sm overflow-hidden flex flex-col">
            <CardContent className="p-5 flex-1 flex flex-col">
                {/* Header */}
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-5 h-5 rounded-md bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center">
                        <Settings className="w-3 h-3 text-violet-500 dark:text-violet-400" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">Control</p>
                    <span className="w-2 h-2 ml-auto rounded-full mt-1" style={{ backgroundColor: botStatus === 'online' ? '#10b981' : botStatus === 'connecting' ? '#f59e0b' : '#ef4444' }} />
                </div>

                {/* Tab-style button group */}
                <div className="flex items-center rounded-lg bg-gray-100 dark:bg-slate-800 p-0.5 gap-0.5">
                    {/* Start Bot */}
                    <button onClick={() => handleBotAction('start')} disabled={botStatus !== 'offline'} className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold shadow-sm transition-all duration-150 ${botStatus === 'offline' ? 'bg-violet-600 dark:bg-slate-600 text-white hover:bg-violet-700 dark:hover:bg-slate-500' : 'text-gray-400 bg-transparent cursor-not-allowed'}`}>
                        <Play className="w-3 h-3 fill-current" />
                        Start
                    </button>

                    {/* Stop Bot */}
                    <button onClick={() => handleBotAction('stop')} disabled={botStatus === 'offline'} className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${botStatus !== 'offline' ? 'text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-700 shadow-sm' : 'text-gray-400 bg-transparent cursor-not-allowed'}`}>
                        <Square className="w-3 h-3 fill-current" />
                        Stop
                    </button>

                    {/* Delete */}
                    <button onClick={() => handleBotAction('delete')} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-gray-500 dark:text-slate-400 text-xs font-medium transition-all duration-150 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10">
                        <Trash2 className="w-3 h-3" />
                        Del
                    </button>
                </div>

                {/* Status Body */}
                <div className="flex-1 flex flex-col items-center justify-center mt-6">
                    {botStatus === 'connecting' && qrDataUrl ? (
                        <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                            <div className="bg-white p-2 rounded-xl shadow-sm border mb-3">
                                <img src={qrDataUrl} alt="WhatsApp QR Code" className="w-36 h-36 border border-gray-100 rounded-md" />
                            </div>
                            <p className="text-xs text-muted-foreground animate-pulse text-center">Scan QR Code with WhatsApp</p>
                        </div>
                    ) : botStatus === 'connecting' ? (
                        <div className="flex flex-col items-center opacity-50 animate-pulse">
                            <div className="w-16 h-16 rounded-xl border-4 border-slate-200 border-t-violet-500 animate-spin mb-3 text-center grid place-items-center"><span className="opacity-0">.</span></div>
                            <p className="text-xs text-muted-foreground text-center">Connecting to Engine...</p>
                        </div>
                    ) : botStatus === 'online' ? (
                        <div className="flex flex-col items-center animate-in slide-in-from-bottom-2 fade-in duration-300">
                            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-3 shadow-inner shadow-emerald-500/20">
                                <Power className="w-8 h-8 text-emerald-500 drop-shadow-md" />
                            </div>
                            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 text-center">Bot is Online</p>
                        </div>
                    ) : (
                        <p className="text-xs text-muted-foreground text-center">Bot is currently offline</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
