"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import Link from "next/link";
import { Facebook, Linkedin, Github, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ identifier, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || "Login failed");
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
                @keyframes slidePanelRight {
                    0% { transform: translateX(-150%); }
                    100% { transform: translateX(0); }
                }
                @keyframes slideFormLeft {
                    0% { transform: translateX(66%); opacity: 0; }
                    100% { transform: translateX(0); opacity: 1; }
                }
                .animate-panel-right { animation: slidePanelRight 0.7s cubic-bezier(0.25, 1, 0.5, 1) forwards; }
                .animate-form-left { animation: slideFormLeft 0.7s cubic-bezier(0.25, 1, 0.5, 1) forwards; }
                
                @media (max-width: 768px) {
                    .animate-panel-right, .animate-form-left {
                        animation: none;
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
                
                {/* Left Side - Sign In Form */}
                <div className="w-full md:w-3/5 p-8 md:p-12 flex flex-col justify-center items-center bg-white dark:bg-gray-800 z-0 animate-form-left">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">Sign In</h1>
                    
                    <div className="flex space-x-4 mb-6">
                        {/* Social icons */}
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
                    
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">or use your email account</p>

                    <form onSubmit={handleSubmit} className="w-full max-w-[320px] flex flex-col items-center">
                        {error && (
                            <div className="w-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm text-center py-2 rounded mb-4">
                                {error}
                            </div>
                        )}
                        
                        <div className="w-full space-y-4 mb-4">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    className="w-full px-5 py-3 bg-gray-100 dark:bg-gray-900/50 border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white placeholder-gray-400"
                                    placeholder="Email"
                                    required
                                />
                            </div>
                            
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-5 pr-12 py-3 bg-gray-100 dark:bg-gray-900/50 border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white placeholder-gray-400"
                                    placeholder="Password"
                                    required
                                />
                                <button 
                                    type="button" 
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                        
                        <Link href="#" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:underline mb-8">
                            Forgot your password?
                        </Link>

                        <button
                            type="submit"
                            disabled={loading}
                            className="px-14 py-3 bg-[#4c2b9f] hover:bg-[#3c227d] text-white rounded-full font-semibold transition-colors uppercase tracking-widest text-sm shadow-md disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center min-w-[160px] min-h-[48px]"
                        >
                            {loading ? <div className="loader"></div> : "SIGN IN"}
                        </button>
                    </form>
                </div>

                {/* Right Side - Hello Friend */}
                <div className="w-full md:w-2/5 bg-gradient-to-br from-[#5a32a8] to-[#42228f] text-white p-8 md:p-12 flex flex-col justify-center items-center text-center md:rounded-l-[100px] shadow-2xl relative z-10 animate-panel-right">
                    <h2 className="text-4xl font-bold mb-6">Hello, Friend!</h2>
                    <p className="text-purple-100 mb-10 max-w-[260px] text-[15px] leading-relaxed">
                        Register with your personal details to use all of site features.
                    </p>
                    <Link href="/register">
                        <button type="button" className="px-14 py-3 border-2 border-white text-white rounded-full font-semibold hover:bg-white hover:text-[#5a32a8] transition-colors uppercase tracking-widest text-sm">
                            SIGN UP
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
