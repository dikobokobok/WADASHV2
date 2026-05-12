"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const FAQS = [
    {
        question: "What is WADASH Bot?",
        answer: "WADASH is a comprehensive WhatsApp Bot Dashboard that allows you to easily configure, manage, and monitor your WhatsApp bot without needing advanced coding skills. It connects directly to your WhatsApp via QR code."
    },
    {
        question: "How do I connect my WhatsApp?",
        answer: "Simply go to the Dashboard, ensure the bot is stopped, then click 'Start'. A QR Code will appear. Open WhatsApp on your phone, go to Linked Devices, and scan the QR code to connect."
    },
    {
        question: "Is my session data secure?",
        answer: "Yes, all session data and credentials are kept locally on your server. We do not store your private messages or transmit them to third parties."
    },
    {
        question: "Can I upgrade my plan later?",
        answer: "Absolutely! You can upgrade from the Basic plan to Pro or Enterprise at any time directly from the Pricing page. Your existing settings will carry over seamlessly."
    },
    {
        question: "What happens if my server restarts?",
        answer: "If configured correctly, your bot session will automatically restore itself upon restart, provided you haven't deleted the session manually from the Control panel."
    }
];

export default function FAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const toggleFAQ = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto space-y-8 page-enter">
            <div className="text-center space-y-4 mb-8">
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                    Frequently Asked Questions
                </h1>
                <p className="text-lg text-slate-500 dark:text-slate-400">
                    Find answers to common questions about WADASH Bot.
                </p>
            </div>

            <div className="space-y-4">
                {FAQS.map((faq, index) => {
                    const isOpen = openIndex === index;
                    return (
                        <Card 
                            key={index} 
                            className={`border-0 shadow-sm transition-all duration-200 overflow-hidden cursor-pointer ${isOpen ? 'ring-2 ring-violet-500/50 shadow-md' : 'hover:shadow-md'}`}
                            onClick={() => toggleFAQ(index)}
                        >
                            <CardContent className="p-0">
                                <div className="p-6 flex items-center justify-between gap-4">
                                    <h3 className={`text-base md:text-lg font-semibold transition-colors ${isOpen ? 'text-violet-600 dark:text-violet-400' : 'text-slate-900 dark:text-white'}`}>
                                        {faq.question}
                                    </h3>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${isOpen ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                                        <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                                    </div>
                                </div>
                                <div 
                                    className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 pb-6 opacity-100' : 'max-h-0 pb-0 opacity-0'}`}
                                >
                                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-4">
                                        {faq.answer}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
            
            <div className="mt-12 text-center bg-violet-50 dark:bg-slate-900/50 rounded-2xl p-8 border border-violet-100 dark:border-slate-800">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Still have questions?</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6">Our support team is ready to help you with any issues.</p>
                <button className="px-6 py-2.5 rounded-xl font-semibold text-white bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors">
                    Contact Support
                </button>
            </div>
        </div>
    );
}
