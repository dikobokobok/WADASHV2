"use client";

import { Check, X, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function Pricing() {
    return (
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 page-enter">
            <div className="text-center space-y-4 max-w-2xl mx-auto">
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                    Simple, Transparent Pricing
                </h1>
                <p className="text-lg text-slate-500 dark:text-slate-400">
                    Choose the perfect plan for your WhatsApp Bot needs. Upgrade at any time.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
                {/* Basic Plan */}
                <Card className="border-0 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden bg-white dark:bg-slate-900">
                    <CardContent className="p-8">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Basic</h3>
                        <div className="mt-4 flex items-baseline text-4xl font-extrabold text-slate-900 dark:text-white">
                            Free
                        </div>
                        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                            Perfect for personal use and exploring features.
                        </p>
                        <ul className="mt-8 space-y-4">
                            {['Up to 100 auto-replies/day', 'Basic bot configuration', 'Standard community support'].map((feature, i) => (
                                <li key={i} className="flex items-center gap-3">
                                    <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                                    <span className="text-sm text-slate-700 dark:text-slate-300">{feature}</span>
                                </li>
                            ))}
                            {['Premium UI features', 'Priority 24/7 support', 'Unlimited commands'].map((feature, i) => (
                                <li key={i} className="flex items-center gap-3 opacity-50">
                                    <X className="w-5 h-5 text-slate-400 flex-shrink-0" />
                                    <span className="text-sm text-slate-500 dark:text-slate-400 line-through">{feature}</span>
                                </li>
                            ))}
                        </ul>
                        <button className="mt-8 w-full py-3 px-4 rounded-xl text-sm font-semibold text-slate-700 dark:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                            Current Plan
                        </button>
                    </CardContent>
                </Card>

                {/* Pro Plan */}
                <Card className="border-0 shadow-xl relative overflow-hidden bg-white dark:bg-slate-900 ring-2 ring-violet-500 transform md:-translate-y-4">
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-violet-600 to-indigo-600" />
                    <div className="absolute top-4 right-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-violet-700 bg-violet-100 dark:bg-violet-900/30 dark:text-violet-300">
                            <Zap className="w-3.5 h-3.5" /> Most Popular
                        </span>
                    </div>
                    <CardContent className="p-8">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Pro</h3>
                        <div className="mt-4 flex items-baseline text-4xl font-extrabold text-slate-900 dark:text-white">
                            Rp 50K
                            <span className="ml-1 text-xl font-medium text-slate-500">/mo</span>
                        </div>
                        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                            For growing communities and serious creators.
                        </p>
                        <ul className="mt-8 space-y-4">
                            {['Unlimited auto-replies', 'Advanced bot configuration', 'Priority 24/7 support', 'Premium UI features', 'Unlimited commands'].map((feature, i) => (
                                <li key={i} className="flex items-center gap-3">
                                    <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                                    <span className="text-sm text-slate-700 dark:text-slate-300">{feature}</span>
                                </li>
                            ))}
                        </ul>
                        <button className="mt-8 w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-md shadow-violet-500/25 transition-all hover:shadow-lg hover:-translate-y-0.5">
                            Upgrade to Pro
                        </button>
                    </CardContent>
                </Card>

                {/* Enterprise Plan */}
                <Card className="border-0 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden bg-white dark:bg-slate-900">
                    <CardContent className="p-8">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Enterprise</h3>
                        <div className="mt-4 flex items-baseline text-4xl font-extrabold text-slate-900 dark:text-white">
                            Custom
                        </div>
                        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                            For large businesses requiring custom integration.
                        </p>
                        <ul className="mt-8 space-y-4">
                            {['Everything in Pro', 'Custom API integrations', 'Dedicated account manager', 'White-labeling options', '99.9% Uptime SLA'].map((feature, i) => (
                                <li key={i} className="flex items-center gap-3">
                                    <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                                    <span className="text-sm text-slate-700 dark:text-slate-300">{feature}</span>
                                </li>
                            ))}
                        </ul>
                        <button className="mt-8 w-full py-3 px-4 rounded-xl text-sm font-semibold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/10 hover:bg-violet-100 dark:hover:bg-violet-900/20 transition-colors">
                            Contact Sales
                        </button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
