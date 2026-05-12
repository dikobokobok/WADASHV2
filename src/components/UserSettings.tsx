"use client";

import { useEffect, useState } from "react";
import { User, Mail, Shield, Calendar, Key, AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface UserProfile {
    id: string;
    username: string;
    email: string;
    role: string;
    createdAt: string;
}

export default function UserSettings() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Global Owner settings state
    const [globalOwnerNumber, setGlobalOwnerNumber] = useState("");
    const [savingGlobalOwner, setSavingGlobalOwner] = useState(false);
    const [globalOwnerStatus, setGlobalOwnerStatus] = useState<{type: 'error' | 'success', message: string} | null>(null);

    // Profile edit state
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [editUsername, setEditUsername] = useState("");
    const [editEmail, setEditEmail] = useState("");
    const [profileStatus, setProfileStatus] = useState<{type: 'error' | 'success', message: string} | null>(null);
    const [savingProfile, setSavingProfile] = useState(false);

    // Password change state
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordStatus, setPasswordStatus] = useState<{type: 'error' | 'success', message: string} | null>(null);
    const [changing, setChanging] = useState(false);
    const [showPassword, setShowPassword] = useState({ current: false, new: false, confirm: false });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch("/api/user");
                if (!res.ok) throw new Error("Failed to load profile data");
                const data = await res.json();
                setProfile(data);
                setEditUsername(data.username);
                setEditEmail(data.email);

                if (data.role === 'globOwner') {
                    fetchGlobalOwnerConfig();
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        const fetchGlobalOwnerConfig = async () => {
            try {
                const res = await fetch("/api/admin/global-owner");
                if (res.ok) {
                    const data = await res.json();
                    setGlobalOwnerNumber(data.globalOwnerNumber || "");
                }
            } catch (err) {
                console.error("Failed to fetch global owner config", err);
            }
        };

        fetchProfile();
    }, []);

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileStatus(null);
        setSavingProfile(true);

        try {
            const res = await fetch("/api/user", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: editUsername, email: editEmail })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to update profile");
            }

            setProfileStatus({ type: 'success', message: 'Profile updated successfully' });
            if (profile) {
                setProfile({ ...profile, username: editUsername, email: editEmail });
            }
            setIsEditingProfile(false);
            
            // Clear success message after 3 seconds
            setTimeout(() => setProfileStatus(null), 3000);
        } catch (err: any) {
            setProfileStatus({ type: 'error', message: err.message || 'Failed to update profile' });
        } finally {
            setSavingProfile(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordStatus(null);
        
        if (newPassword !== confirmPassword) {
            setPasswordStatus({ type: 'error', message: 'New passwords do not match' });
            return;
        }

        if (newPassword.length < 6) {
            setPasswordStatus({ type: 'error', message: 'New password must be at least 6 characters' });
            return;
        }

        setChanging(true);
        try {
            const res = await fetch("/api/user/password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPassword, newPassword })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to update password");
            }

            setPasswordStatus({ type: 'success', message: 'Password updated successfully. All other sessions have been logged out. You may need to log in again.' });
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            
            // Redirect to login after 3 seconds since sessions are revoked
            setTimeout(() => {
                window.location.href = "/login";
            }, 3000);
        } catch (err: any) {
            setPasswordStatus({ type: 'error', message: err.message || 'Failed to update password' });
        } finally {
            setChanging(false);
        }
    };

    const handleGlobalOwnerUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setGlobalOwnerStatus(null);
        setSavingGlobalOwner(true);

        try {
            const res = await fetch("/api/admin/global-owner", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ globalOwnerNumber })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to update global owner number");

            setGlobalOwnerStatus({ type: 'success', message: 'Global Owner number updated successfully!' });
            setTimeout(() => setGlobalOwnerStatus(null), 3000);
        } catch (err: any) {
            setGlobalOwnerStatus({ type: 'error', message: err.message || 'Update failed' });
        } finally {
            setSavingGlobalOwner(false);
        }
    };

    if (loading) {
        return (
            <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
                <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg mb-8"></div>
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="h-64 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-2xl"></div>
                    <div className="h-64 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-2xl"></div>
                </div>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="p-4 md:p-8 max-w-4xl mx-auto">
                <div className="bg-rose-50 text-rose-600 p-4 rounded-xl flex items-center gap-3">
                    <AlertCircle className="w-5 h-5" />
                    <p>{error || "Failed to load profile"}</p>
                </div>
            </div>
        );
    }

    const formatDate = (dateString: string) => {
        try {
            return new Intl.DateTimeFormat('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }).format(new Date(dateString));
        } catch {
            return dateString;
        }
    };

    const getRoleBadge = (role: string) => {
        if (role === 'globOwner') return <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">Global Owner</span>;
        if (role === 'Enterprise') return <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Enterprise</span>;
        if (role === 'Pro') return <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Pro</span>;
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400">Basic</span>;
    };

    return (
        <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 page-enter">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Account Settings</h1>
                <p className="text-sm text-slate-500 mt-1">Manage your personal information and security settings.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Personal Information Card */}
                <Card className="border-0 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
                    <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 pb-4">
                        <CardTitle className="text-lg flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                                <User className="w-5 h-5 text-violet-500" />
                                Personal Information
                            </div>
                            {!isEditingProfile && (
                                <button 
                                    onClick={() => setIsEditingProfile(true)}
                                    className="text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline"
                                >
                                    Edit Profile
                                </button>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        {profileStatus && (
                            <div className={`p-3 rounded-lg text-sm flex items-start gap-2 ${
                                profileStatus.type === 'error' 
                                    ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/30' 
                                    : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30'
                            }`}>
                                {profileStatus.type === 'error' ? <AlertCircle className="w-4 h-4 mt-0.5" /> : <CheckCircle2 className="w-4 h-4 mt-0.5" />}
                                <p className="leading-relaxed">{profileStatus.message}</p>
                            </div>
                        )}

                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20 flex-shrink-0">
                                <span className="text-2xl font-bold text-white uppercase">{profile.username.substring(0, 2)}</span>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white capitalize">{profile.username}</h3>
                                <div className="mt-1">{getRoleBadge(profile.role)}</div>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                            {isEditingProfile ? (
                                <form onSubmit={handleProfileUpdate} className="space-y-4">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Username</label>
                                        <input 
                                            type="text" 
                                            value={editUsername}
                                            onChange={(e) => setEditUsername(e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                                            required
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email Address</label>
                                        <input 
                                            type="email" 
                                            value={editEmail}
                                            onChange={(e) => setEditEmail(e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                                            required
                                        />
                                    </div>
                                    <div className="flex gap-2 pt-2">
                                        <button 
                                            type="submit" 
                                            disabled={savingProfile || !editUsername || !editEmail}
                                            className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-medium py-2 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                        >
                                            {savingProfile ? (
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            ) : (
                                                "Save Changes"
                                            )}
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={() => {
                                                setIsEditingProfile(false);
                                                setEditUsername(profile.username);
                                                setEditEmail(profile.email);
                                            }}
                                            disabled={savingProfile}
                                            className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium py-2 rounded-lg text-sm transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email Address</label>
                                        <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                                            <Mail className="w-4 h-4 text-slate-400" />
                                            <span className="text-sm">{profile.email}</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Account Role</label>
                                        <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                                            <Shield className="w-4 h-4 text-slate-400" />
                                            <span className="text-sm capitalize">{profile.role === 'globOwner' ? 'Global Owner' : profile.role}</span>
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Member Since</label>
                                <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                                    <Calendar className="w-4 h-4 text-slate-400" />
                                    <span className="text-sm">{formatDate(profile.createdAt)}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Security Settings Card */}
                <Card className="border-0 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
                    <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 pb-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Key className="w-5 h-5 text-emerald-500" />
                            Security Settings
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <form onSubmit={handlePasswordChange} className="space-y-4">
                            {passwordStatus && (
                                <div className={`p-3 rounded-lg text-sm flex items-start gap-2 ${
                                    passwordStatus.type === 'error' 
                                        ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/30' 
                                        : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30'
                                }`}>
                                    {passwordStatus.type === 'error' ? <AlertCircle className="w-4 h-4 mt-0.5" /> : <CheckCircle2 className="w-4 h-4 mt-0.5" />}
                                    <p className="leading-relaxed">{passwordStatus.message}</p>
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Current Password</label>
                                <div className="relative">
                                    <input 
                                        type={showPassword.current ? "text" : "password"} 
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-3 pr-10 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                                        placeholder="••••••••"
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => setShowPassword(prev => ({ ...prev, current: !prev.current }))}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                    >
                                        {showPassword.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">New Password</label>
                                <div className="relative">
                                    <input 
                                        type={showPassword.new ? "text" : "password"} 
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-3 pr-10 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                                        placeholder="••••••••"
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => setShowPassword(prev => ({ ...prev, new: !prev.new }))}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                    >
                                        {showPassword.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Confirm New Password</label>
                                <div className="relative">
                                    <input 
                                        type={showPassword.confirm ? "text" : "password"} 
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-3 pr-10 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                                        placeholder="••••••••"
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => setShowPassword(prev => ({ ...prev, confirm: !prev.confirm }))}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                    >
                                        {showPassword.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                disabled={changing || !currentPassword || !newPassword || !confirmPassword}
                                className="w-full mt-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 text-white font-medium py-2 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {changing ? (
                                    <div className="w-5 h-5 border-2 border-white/30 dark:border-slate-900/30 border-t-white dark:border-t-slate-900 rounded-full animate-spin"></div>
                                ) : (
                                    "Update Password"
                                )}
                            </button>
                        </form>
                    </CardContent>
                </Card>

                {/* Global Owner Configuration Card */}
                {profile?.role === 'globOwner' && (
                    <Card className="border-0 shadow-sm bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 overflow-hidden md:col-span-2 mt-4">
                        <CardHeader className="border-b border-indigo-100 dark:border-indigo-900/30 pb-4">
                            <CardTitle className="text-lg flex items-center gap-2 text-indigo-900 dark:text-indigo-200">
                                <Shield className="w-5 h-5 text-indigo-500" />
                                Global Owner Configuration
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="max-w-2xl space-y-6">
                                <div className="bg-indigo-100/50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-100 dark:border-indigo-800/30 text-sm text-indigo-800 dark:text-indigo-300 leading-relaxed">
                                    <span className="font-semibold block mb-1">Set Global Owner JID</span>
                                    Masukkan <strong>JID</strong> (WhatsApp ID) Anda, bukan nomor telepon. JID dapat dilihat dari perintah bot <code>checkrole</code>. Contoh format: <code>6285135957662@s.whatsapp.net</code> atau <code>128665023213725@lid</code>.
                                    <br />Nomor ini akan mendapat akses penuh ke semua perintah bot termasuk <code>!exec</code> dan <code>!eval</code>.
                                </div>

                                {globalOwnerStatus && (
                                    <div className={`p-3 rounded-lg text-sm flex items-start gap-2 ${
                                        globalOwnerStatus.type === 'error' 
                                            ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/30' 
                                            : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30'
                                    }`}>
                                        {globalOwnerStatus.type === 'error' ? <AlertCircle className="w-4 h-4 mt-0.5" /> : <CheckCircle2 className="w-4 h-4 mt-0.5" />}
                                        <p className="leading-relaxed">{globalOwnerStatus.message}</p>
                                    </div>
                                )}

                                <form onSubmit={handleGlobalOwnerUpdate} className="flex flex-col sm:flex-row gap-3">
                                    <input 
                                        type="text" 
                                        value={globalOwnerNumber}
                                        onChange={(e) => setGlobalOwnerNumber(e.target.value)}
                                        placeholder="e.g. 128665023213725@lid atau 6285135957662@s.whatsapp.net"
                                        className="flex-1 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-lg px-4 py-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono"
                                        required
                                    />
                                    <button 
                                        type="submit" 
                                        disabled={savingGlobalOwner || !globalOwnerNumber}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center sm:w-auto w-full shadow-md shadow-indigo-500/20"
                                    >
                                        {savingGlobalOwner ? (
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        ) : (
                                            "Save Configuration"
                                        )}
                                    </button>
                                </form>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
