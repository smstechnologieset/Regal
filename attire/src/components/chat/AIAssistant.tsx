'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MessageCircle, X, Send, User, Bot, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { useServices } from '@/context/ServicesContext';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    links?: { label: string; url: string }[];
}

export default function AIAssistant() {
    const { addToast } = useApp();
    const { isAmharic } = useLanguage();
    const { isServiceEnabled } = useServices();
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Dynamic initial greeting links based on active enabled services
    const initialLinks = useMemo(() => {
        const links: { label: string; url: string }[] = [];
        if (isServiceEnabled('skincare')) {
            links.push({ label: isAmharic ? 'የቆዳ እንክብካቤ' : 'Pure Skincare', url: '/skincare' });
        }
        if (isServiceEnabled('toys')) {
            links.push({ label: isAmharic ? 'የልጆች መጫወቻዎች' : 'Grounded Toys', url: '/toys' });
        }
        if (isServiceEnabled('journals')) {
            links.push({ label: isAmharic ? 'ማስታወሻ ደብተሮች' : 'Mindful Journals', url: '/journals' });
        }
        if (isServiceEnabled('attire')) {
            links.push({ label: isAmharic ? 'አልባሳት' : 'Modest Attire', url: '/attire' });
        }
        if (isServiceEnabled('catering')) {
            links.push({ label: isAmharic ? 'ምግብ ዝግጅት' : 'Wholesome Catering', url: '/catering/menu' });
        }
        if (isServiceEnabled('gifts')) {
            links.push({ label: isAmharic ? 'ስጦታዎች' : 'Curated Gifts', url: '/gifts' });
        }
        if (isServiceEnabled('bridal')) {
            links.push({ label: isAmharic ? 'የሰርግ አገልግሎት' : 'Bridal', url: '/bridal/gallery' });
        }
        if (isServiceEnabled('events')) {
            links.push({ label: isAmharic ? 'የዝግጅት እቅድ' : 'Event Planning', url: '/events' });
        }
        return links;
    }, [isServiceEnabled, isAmharic]);

    // Dynamic initial greeting message
    const initialGreeting = useMemo(() => {
        return isAmharic
            ? 'ሰላም! እኔ የሬጋል ረዳት ነኝ። በንጹህ የቆዳ እንክብካቤ፣ በልጆች መጫወቻዎች፣ በማስታወሻ ደብተሮች፣ በአልባሳት፣ በምግብ ዝግጅት እና በስጦታዎች ዙሪያ ላግዝዎት እችላለሁ። ዛሬ በምን ልርዳዎት?'
            : 'Welcome to Regal! I can guide you through our Pure Skincare, Grounded Childhood Toys, Mindful Journals, Modest Attire, Wholesome Catering, and Curated Gifts. How can I assist you today?';
    }, [isAmharic]);

    const [messages, setMessages] = useState<Message[]>([]);

    useEffect(() => {
        setMessages([
            {
                id: 'init-1',
                role: 'assistant',
                content: initialGreeting,
                timestamp: new Date(),
                links: initialLinks,
            }
        ]);
    }, [initialGreeting, initialLinks]);

    // Dynamic quick suggestion pills
    const quickSuggestions = useMemo(() => {
        const pills: string[] = [];
        if (isServiceEnabled('skincare')) pills.push(isAmharic ? 'የቆዳ እንክብካቤ?' : 'Pure Skincare?');
        if (isServiceEnabled('toys')) pills.push(isAmharic ? 'የልጆች መጫወቻዎች?' : 'Grounded Toys?');
        if (isServiceEnabled('journals')) pills.push(isAmharic ? 'ማስታወሻ ደብተሮች?' : 'Mindful Journals?');
        if (isServiceEnabled('attire')) pills.push(isAmharic ? 'አልባሳት?' : 'Modest Attire?');
        if (isServiceEnabled('catering')) pills.push(isAmharic ? 'ምግብ ዝግጅት?' : 'Catering Menu?');
        pills.push(isAmharic ? 'ስልክ ቁጥር?' : 'Phone number?');
        return pills.slice(0, 5);
    }, [isServiceEnabled, isAmharic]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleSend = async (e?: React.FormEvent, customText?: string) => {
        if (e) e.preventDefault();
        const textToSearch = customText || input;
        if (!textToSearch.trim() || isLoading) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: textToSearch,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/ai/assistant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: textToSearch,
                    history: messages.map(m => ({ role: m.role, content: m.content }))
                })
            });

            if (!response.ok) {
                throw new Error('Fallback needed');
            }

            const data = await response.json();

            const assistantMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.reply || (isAmharic ? 'እርስዎን ለመርዳት ዝግጁ ነኝ! ስብስቦቻችንን መመልከት ይችላሉ።' : 'I am here to help! You can explore our collections and services.'),
                timestamp: new Date(),
                links: data.links
            };

            setMessages(prev => [...prev, assistantMsg]);
        } catch {
            // Friendly in-chat fallback
            const fallbackMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: isAmharic
                    ? 'እርስዎን ለመርዳት ዝግጁ ነኝ! በቆዳ እንክብካቤ፣ በልጆች መጫወቻዎች፣ በማስታወሻ ደብተሮች፣ በአልባሳት፣ በምግብ ዝግጅት ወይም በስጦታዎች ዙሪያ ማገዝ እችላለሁ። በቀጥታ በ +251 912 345 678 ይደውሉልን።'
                    : 'I am here to guide you through Regal! You can browse our active collections below or speak with our team at +251 912 345 678.',
                timestamp: new Date(),
                links: initialLinks.slice(0, 4)
            };
            setMessages(prev => [...prev, fallbackMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-14 h-14 sm:w-16 sm:h-16 bg-[#4A5D4E] text-[#FDFBF7] rounded-full shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-50 group border-2 border-[#C5A059]/40 cursor-pointer"
                aria-label="Open AI Assistant"
            >
                <div className="absolute inset-0 rounded-full animate-ping bg-[#4A5D4E]/20 scale-125" />
                <MessageCircle size={26} className="group-hover:rotate-12 transition-transform" />
            </button>
        );
    }

    return (
        <>
            {/* Mobile Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[998] sm:hidden animate-fade-in"
                onClick={() => setIsOpen(false)}
            />

            {/* Chat Drawer / Window */}
            <div className="fixed inset-x-0 bottom-0 sm:inset-x-auto sm:bottom-6 sm:right-6 z-[999] flex flex-col transition-all duration-300 w-full sm:w-[420px] h-[90dvh] sm:h-[600px] sm:max-h-[640px] px-0 sm:px-0">
                <div className="bg-[#FDFBF7] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-[#E0D6C8] overflow-hidden flex flex-col h-full animate-slide-up">
                    {/* Header */}
                    <div className="bg-[#4A5D4E] px-4 py-3 sm:py-3.5 flex flex-col text-[#FDFBF7] shrink-0">
                        {/* Mobile Grab Pill */}
                        <div className="w-10 h-1 bg-white/30 rounded-full mx-auto mb-2 sm:hidden" />
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-white/10 p-1 flex items-center justify-center backdrop-blur-md border border-[#C5A059]/30">
                                    <Image src="/Logo-bg.png" alt="Regal AI" width={24} height={24} className="object-contain" />
                                </div>
                                <div>
                                    <h3 className="font-serif font-bold text-sm tracking-wide">REGAL Assistant</h3>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                                        <span className="text-[10px] text-[#FDFBF7]/70 uppercase tracking-widest font-semibold">Online</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 sm:p-1.5 hover:bg-white/10 active:bg-white/20 rounded-full transition-colors text-[#FDFBF7] cursor-pointer"
                                    aria-label="Close"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-4 bg-[#FDFBF7]/60">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                            >
                                <div className={`flex gap-2 max-w-[90%] sm:max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border ${
                                        msg.role === 'user' ? 'bg-[#C5A059] text-[#2B2D2F]' : 'bg-white text-[#4A5D4E] border-[#E0D6C8]'
                                    } shadow-2xs text-xs font-bold`}>
                                        {msg.role === 'user' ? <User size={13} /> : <Bot size={13} />}
                                    </div>
                                    <div className="space-y-2">
                                        <div className={`rounded-2xl p-3 shadow-2xs ${
                                            msg.role === 'user'
                                                ? 'bg-[#4A5D4E] text-[#FDFBF7] rounded-tr-none'
                                                : 'bg-white border border-[#E0D6C8] text-[#2B2D2F] rounded-tl-none'
                                        }`}>
                                            <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-line">{stripMarkdownLinks(msg.content).trim()}</p>
                                        </div>

                                        {/* Links/Quick Actions */}
                                        {msg.links && msg.links.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 pt-0.5">
                                                {msg.links.map((link, idx) => (
                                                    <Link
                                                        key={idx}
                                                        href={link.url}
                                                        onClick={() => setIsOpen(false)}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-[#E0D6C8] rounded-full text-[11px] font-semibold text-[#4A5D4E] hover:border-[#C5A059] hover:text-[#C5A059] transition-all shadow-2xs cursor-pointer"
                                                    >
                                                        {link.label} <ArrowRight size={10} />
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start animate-fade-in">
                                <div className="flex gap-2 items-center text-[#2B2D2F]/50">
                                    <div className="w-7 h-7 rounded-full bg-white border border-[#E0D6C8] flex items-center justify-center">
                                        <Loader2 className="animate-spin text-[#4A5D4E]" size={13} />
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider">
                                        {isAmharic ? "እየፈለገ ነው..." : "Thinking..."}
                                    </span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Suggestions */}
                    {!isLoading && messages.length <= 3 && quickSuggestions.length > 0 && (
                        <div className="px-3 py-2 bg-white border-t border-[#E0D6C8] overflow-x-auto whitespace-nowrap scrollbar-hide">
                            <div className="flex gap-1.5">
                                {quickSuggestions.map((suggestion) => (
                                    <button
                                        key={suggestion}
                                        onClick={() => handleSend(undefined, suggestion)}
                                        className="px-2.5 py-1 bg-[#FDFBF7] border border-[#E0D6C8] rounded-full text-[11px] font-medium text-[#2B2D2F]/80 hover:border-[#4A5D4E] hover:text-[#4A5D4E] transition-all cursor-pointer"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Input Area */}
                    <form onSubmit={handleSend} className="p-3 bg-white border-t border-[#E0D6C8] pb-safe sm:pb-3">
                        <div className="flex gap-2 bg-[#F4EFEA] rounded-2xl p-1.5 items-center focus-within:bg-white focus-within:ring-2 focus-within:ring-[#4A5D4E]/20 transition-all border border-transparent focus-within:border-[#4A5D4E]/30">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={isAmharic ? "ስለ ሬጋል ይጠይቁ..." : "Ask anything about Regal..."}
                                className="flex-1 bg-transparent border-none focus:ring-0 text-xs sm:text-sm px-2 text-[#2B2D2F] placeholder:text-[#2B2D2F]/40 outline-none"
                                disabled={isLoading}
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                className="w-9 h-9 bg-[#4A5D4E] text-[#FDFBF7] rounded-xl flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#38463B] transition-colors shadow-xs shrink-0 cursor-pointer"
                                aria-label="Send message"
                            >
                                <Send size={15} />
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}

function stripMarkdownLinks(text: string): string {
    return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1');
}
