"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import Link from "next/link";
import { Facebook, Linkedin, Github, Eye, EyeOff } from "lucide-react";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

export default function RegisterPage() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState({ password: false, confirm: false });
    const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
    const turnstileContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!TURNSTILE_SITE_KEY) return;

        type TurnstileApi = {
            render: (el: HTMLElement, opts: Record<string, unknown>) => string;
            remove: (id: string) => void;
        };

        let widgetId: string | undefined;
        let cancelled = false;

        const tryRender = () => {
            const el = turnstileContainerRef.current;
            const api = (window as unknown as { turnstile?: TurnstileApi }).turnstile;
            if (cancelled || !el || !api) return false;
            widgetId = api.render(el, {
                sitekey: TURNSTILE_SITE_KEY,
                callback: (token: string) => setTurnstileToken(token),
                "expired-callback": () => setTurnstileToken(null),
            });
            return true;
        };

        const timer = window.setTimeout(() => {
            if (cancelled) return;
            if (tryRender()) return;
            const script = document.createElement("script");
            script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
            script.async = true;
            script.onload = () => {
                if (!cancelled) tryRender();
            };
            document.body.appendChild(script);
        }, 80);

        return () => {
            cancelled = true;
            window.clearTimeout(timer);
            const api = (window as unknown as { turnstile?: TurnstileApi }).turnstile;
            if (widgetId && api) {
                try {
                    api.remove(widgetId);
                } catch {
                    /* ignore */
                }
            }
        };
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Validation
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }

        if (TURNSTILE_SITE_KEY && !turnstileToken) {
            setError("Please complete the verification challenge.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username,
                    email,
                    password,
                    ...(turnstileToken ? { turnstileToken } : {}),
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || "Registration failed");
                setLoading(false);
                return;
            }

            router.push("/");
            router.refresh();
        } catch (err) {
            setError("An error occurred. Please try again.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-gray-900 dark:to-gray-950 p-4 transition-colors">
            <style>{`
                @keyframes slidePanelLeft {
                    0% { transform: translateX(150%); }
                    100% { transform: translateX(0); }
                }
                @keyframes slideFormRight {
                    0% { transform: translateX(-66%); opacity: 0; }
                    100% { transform: translateX(0); opacity: 1; }
                }
                .animate-panel-left { animation: slidePanelLeft 0.7s cubic-bezier(0.25, 1, 0.5, 1) forwards; }
                .animate-form-right { animation: slideFormRight 0.7s cubic-bezier(0.25, 1, 0.5, 1) forwards; }
                
                @media (max-width: 768px) {
                    .animate-panel-left, .animate-form-right {
                        animation: none; /* Disable sliding on mobile to avoid layout bugs */
                    }
                }

                /* HTML: <div class="loader"></div> */
                .loader {
                    width: 24px;
                    aspect-ratio: 1;
                    border-radius: 50%;
                    border: 4px solid;
                    border-color: #fff #0000;
                    animation: l1 1s infinite;
                }
                @keyframes l1 {to{transform: rotate(.5turn)}}
            `}</style>
            
            {/* Theme Toggle - Fixed Position */}
            <div className="fixed top-4 right-4 z-50">
                <ThemeToggle />
            </div>

            <div className="flex flex-col md:flex-row w-full max-w-4xl bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden min-h-[550px] relative">
                
                {/* Left Side - Welcome Back (Purple Panel) */}
                <div className="w-full md:w-2/5 bg-gradient-to-br from-[#5a32a8] to-[#42228f] text-white p-8 md:p-12 flex flex-col justify-center items-center text-center md:rounded-r-[100px] shadow-2xl relative z-10 animate-panel-left order-first md:order-none">
                    <h2 className="text-4xl font-bold mb-6">Welcome Back!</h2>
                    <p className="text-purple-100 mb-10 max-w-[260px] text-[15px] leading-relaxed">
                        To keep connected with us please login with your personal info.
                    </p>
                    <Link href="/login">
                        <button type="button" className="px-14 py-3 border-2 border-white text-white rounded-full font-semibold hover:bg-white hover:text-[#5a32a8] transition-colors uppercase tracking-widest text-sm">
                            SIGN IN
                        </button>
                    </Link>
                </div>

                {/* Right Side - Sign Up Form */}
                <div className="w-full md:w-3/5 p-8 md:p-12 flex flex-col justify-center items-center bg-white dark:bg-gray-800 z-0 animate-form-right">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">Create Account</h1>
                    
                    <div className="flex space-x-4 mb-4">
                        <button type="button" className="p-3 border border-gray-200 dark:border-gray-700 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                            <Facebook className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                        </button>
                        <button type="button" className="p-3 border border-gray-200 dark:border-gray-700 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                            <Github className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                        </button>
                        <button type="button" className="p-3 border border-gray-200 dark:border-gray-700 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                            <Linkedin className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                        </button>
                    </div>
                    
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">or use your email for registration</p>

                    <form onSubmit={handleSubmit} className="w-full max-w-[320px] flex flex-col items-center">
                        {error && (
                            <div className="w-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm text-center py-2 rounded mb-4">
                                {error}
                            </div>
                        )}
                        
                        <div className="w-full space-y-3 mb-6">
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-5 py-3 bg-gray-100 dark:bg-gray-900/50 border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white placeholder-gray-400"
                                placeholder="Username"
                                required
                            />
                            
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-5 py-3 bg-gray-100 dark:bg-gray-900/50 border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white placeholder-gray-400"
                                placeholder="Email"
                                required
                            />
                            
                            <div className="flex flex-col sm:flex-row gap-2">
                                <div className="relative w-full sm:w-1/2">
                                    <input
                                        type={showPassword.password ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-5 pr-10 py-3 bg-gray-100 dark:bg-gray-900/50 border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white placeholder-gray-400 text-sm"
                                        placeholder="Password"
                                        required
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => setShowPassword(prev => ({...prev, password: !prev.password}))}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                                    >
                                        {showPassword.password ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                <div className="relative w-full sm:w-1/2">
                                    <input
                                        type={showPassword.confirm ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full pl-5 pr-10 py-3 bg-gray-100 dark:bg-gray-900/50 border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white placeholder-gray-400 text-sm"
                                        placeholder="Confirm"
                                        required
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => setShowPassword(prev => ({...prev, confirm: !prev.confirm}))}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                                    >
                                        {showPassword.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                            {TURNSTILE_SITE_KEY ? (
                                <div className="w-full flex justify-center py-2">
                                    <div ref={turnstileContainerRef} />
                                </div>
                            ) : null}
                        </div>
                        
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-14 py-3 bg-[#4c2b9f] hover:bg-[#3c227d] text-white rounded-full font-semibold transition-colors uppercase tracking-widest text-sm shadow-md disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center min-w-[160px] min-h-[48px]"
                        >
                            {loading ? <div className="loader"></div> : "SIGN UP"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
