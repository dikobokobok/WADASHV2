/**
 * ConfigForm — bot configuration editor
 *
 * Renders grouped form sections for all BotConfig fields
 * with live validation feedback and a single save action.
 */

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Save, Bot, Sticker, BarChart2,
    User, Hash, ToggleLeft, CheckCircle, XCircle,
} from "lucide-react";
import type { BotConfig } from "@/lib/database";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ConfigFormProps {
    config: BotConfig;
    setConfig: (config: BotConfig) => void;
    handleSubmit: (e: React.FormEvent) => void;
    saving: boolean;
    message: string;
}

interface SectionProps {
    title: string;
    subtitle?: string;
    icon: React.ElementType;
    iconColor?: string;
    iconBg?: string;
    children: React.ReactNode;
}

interface ToggleSwitchProps {
    checked: boolean;
    onChange: (value: boolean) => void;
    label: string;
    description?: string;
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const INPUT_CLASS =
    "w-full px-4 py-2.5 bg-background border border-input rounded-xl text-sm " +
    "text-foreground placeholder:text-muted-foreground " +
    "focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 " +
    "transition-all duration-200";

const LABEL_CLASS =
    "block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5";

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({
    title,
    subtitle,
    icon: Icon,
    iconColor = "text-violet-500",
    iconBg = "bg-violet-50 dark:bg-violet-950/40",
    children,
}: SectionProps) {
    return (
        <Card className="border-0 shadow-sm overflow-hidden">
            <CardHeader className="pb-0 px-6 pt-5">
                <div className="flex items-center gap-3 mb-1">
                    <div className={`w-8 h-8 rounded-xl ${iconBg} flex items-center justify-center`}>
                        <Icon className={`w-4 h-4 ${iconColor}`} />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-foreground">{title}</h2>
                        {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
                    </div>
                </div>
                <div className="h-px bg-border mt-4" />
            </CardHeader>
            <CardContent className="px-6 pt-5 pb-6">
                {children}
            </CardContent>
        </Card>
    );
}

function ToggleSwitch({ checked, onChange, label, description }: ToggleSwitchProps) {
    return (
        <div className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-muted/60 transition-colors">
            <div>
                <p className="text-sm font-medium text-foreground">{label}</p>
                {description && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>
                )}
            </div>
            <label className="toggle-switch flex-shrink-0">
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                />
                <span className="toggle-slider" />
            </label>
        </div>
    );
}

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
                : <XCircle    className="w-4 h-4 flex-shrink-0" />}
            {message}
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ConfigForm({
    config,
    setConfig,
    handleSubmit,
    saving,
    message,
}: ConfigFormProps) {
    /** Applies a partial patch to the current config */
    const update = (patch: Partial<BotConfig>) => setConfig({ ...config, ...patch });

    return (
        <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Page heading */}
                <div className="mb-2">
                    <h1 className="text-2xl font-bold text-foreground">Bot Configuration</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Customize your WhatsApp bot settings
                    </p>
                </div>

                {/* Status feedback */}
                {message && <StatusMessage message={message} />}

                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* ── Bot Information ──────────────────────────────────── */}
                    <Section
                        title="Bot Information"
                        subtitle="Name and identity of your bot"
                        icon={Bot}
                        iconColor="text-violet-500"
                        iconBg="bg-violet-50 dark:bg-violet-950/40"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={LABEL_CLASS}>Bot Name</label>
                                <input
                                    type="text"
                                    value={config.botName}
                                    placeholder="WibuBot"
                                    onChange={(e) => update({ botName: e.target.value })}
                                    className={INPUT_CLASS}
                                />
                            </div>
                            <div>
                                <label className={LABEL_CLASS}>Footer Text</label>
                                <input
                                    type="text"
                                    value={config.footerText}
                                    placeholder="© 2024 WADASH Bot"
                                    onChange={(e) => update({ footerText: e.target.value })}
                                    className={INPUT_CLASS}
                                />
                            </div>
                        </div>
                    </Section>

                    {/* ── Sticker ──────────────────────────────────────────── */}
                    <Section
                        title="Sticker Configuration"
                        subtitle="Metadata for stickers created by the bot"
                        icon={Sticker}
                        iconColor="text-pink-500"
                        iconBg="bg-pink-50 dark:bg-pink-950/40"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={LABEL_CLASS}>Pack Name</label>
                                <input
                                    type="text"
                                    value={config.packname}
                                    placeholder="WADASH"
                                    onChange={(e) => update({ packname: e.target.value })}
                                    className={INPUT_CLASS}
                                />
                            </div>
                            <div>
                                <label className={LABEL_CLASS}>Author Name</label>
                                <input
                                    type="text"
                                    value={config.authorname}
                                    placeholder="WADASH"
                                    onChange={(e) => update({ authorname: e.target.value })}
                                    className={INPUT_CLASS}
                                />
                            </div>
                        </div>
                    </Section>

                    {/* ── Limits & Balance ─────────────────────────────────── */}
                    <Section
                        title="Limits & Balance"
                        subtitle="Default values applied to new users"
                        icon={BarChart2}
                        iconColor="text-emerald-500"
                        iconBg="bg-emerald-50 dark:bg-emerald-950/40"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={LABEL_CLASS}>Default Limit</label>
                                <input
                                    type="number"
                                    value={config.limit}
                                    placeholder="100"
                                    onChange={(e) => update({ limit: parseInt(e.target.value, 10) })}
                                    className={INPUT_CLASS}
                                />
                            </div>
                            <div>
                                <label className={LABEL_CLASS}>Default Balance</label>
                                <input
                                    type="number"
                                    value={config.balance}
                                    placeholder="10000"
                                    onChange={(e) => update({ balance: parseInt(e.target.value, 10) })}
                                    className={INPUT_CLASS}
                                />
                            </div>
                        </div>
                    </Section>

                    {/* ── Owner Information ────────────────────────────────── */}
                    <Section
                        title="Owner Information"
                        subtitle="Your personal bot admin details"
                        icon={User}
                        iconColor="text-blue-500"
                        iconBg="bg-blue-50 dark:bg-blue-950/40"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={LABEL_CLASS}>Owner Name</label>
                                <input
                                    type="text"
                                    value={config.ownerName}
                                    placeholder="Admin"
                                    onChange={(e) => update({ ownerName: e.target.value })}
                                    className={INPUT_CLASS}
                                />
                            </div>
                            <div>
                                <label className={LABEL_CLASS}>Owner Number</label>
                                <input
                                    type="text"
                                    value={config.ownerNumber}
                                    placeholder="628xxxxxxxxxx"
                                    onChange={(e) => update({ ownerNumber: e.target.value })}
                                    className={INPUT_CLASS}
                                />
                            </div>
                        </div>
                    </Section>

                    {/* ── Prefix Settings ──────────────────────────────────── */}
                    <Section
                        title="Prefix Settings"
                        subtitle="How users trigger bot commands"
                        icon={Hash}
                        iconColor="text-amber-500"
                        iconBg="bg-amber-50 dark:bg-amber-950/40"
                    >
                        <div className="space-y-4">
                            <div>
                                <label className={LABEL_CLASS}>Prefix Character</label>
                                <input
                                    type="text"
                                    value={config.prefix}
                                    placeholder="#"
                                    onChange={(e) => update({ prefix: e.target.value })}
                                    className={`${INPUT_CLASS} max-w-xs`}
                                />
                            </div>
                            <div>
                                <label className={LABEL_CLASS}>Prefix Mode</label>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {(["single", "multi", "empty"] as const).map((type) => (
                                        <label key={type} className="radio-pill">
                                            <input
                                                type="radio"
                                                name="prefixType"
                                                className="sr-only"
                                                checked={config.prefixType === type}
                                                onChange={() => update({ prefixType: type })}
                                            />
                                            <span className="text-sm font-medium capitalize">
                                                {type === "single" ? "Single" : type === "multi" ? "Multi" : "No Prefix"}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Section>

                    {/* ── Bot Features ─────────────────────────────────────── */}
                    <Section
                        title="Bot Features"
                        subtitle="Toggle bot behaviors and notifications"
                        icon={ToggleLeft}
                        iconColor="text-indigo-500"
                        iconBg="bg-indigo-50 dark:bg-indigo-950/40"
                    >
                        <div className="space-y-1">
                            <ToggleSwitch
                                checked={config.onlineOnConnect}
                                label="Online On Connect"
                                description="Bot appears online when connected"
                                onChange={(v) => update({ onlineOnConnect: v })}
                            />
                            <ToggleSwitch
                                checked={config.premiumNotification}
                                label="Premium Notification"
                                description="Notify users about premium expiry"
                                onChange={(v) => update({ premiumNotification: v })}
                            />
                            <ToggleSwitch
                                checked={config.sewaNotificationToGroup}
                                label="Sewa Notification → Group"
                                description="Send rental notifications to group"
                                onChange={(v) => update({ sewaNotificationToGroup: v })}
                            />
                            <ToggleSwitch
                                checked={config.sewaNotificationToOwner}
                                label="Sewa Notification → Owner"
                                description="Send rental notifications to owner"
                                onChange={(v) => update({ sewaNotificationToOwner: v })}
                            />
                            <ToggleSwitch
                                checked={config.joinToUse}
                                label="Join To Use"
                                description="Require users to join group before using bot"
                                onChange={(v) => update({ joinToUse: v })}
                            />
                            <ToggleSwitch
                                checked={config.autoRead || false}
                                label="Auto Read"
                                description="Automatically mark incoming messages as read"
                                onChange={(v) => update({ autoRead: v })}
                            />
                        </div>
                    </Section>

                    {/* ── Save action ──────────────────────────────────────── */}
                    <div className="flex justify-end pb-8 pt-2">
                        <Button
                            type="submit"
                            disabled={saving}
                            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white px-8 py-5 gap-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-200"
                        >
                            <Save className="w-4 h-4" />
                            {saving ? "Saving…" : "Save Configuration"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
