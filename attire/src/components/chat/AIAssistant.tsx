'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, User, Bot, Sparkles, ArrowRight, Loader2, Minimize2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import Link from 'next/link';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    links?: { label: string; url: string }[];
}

export default function AIAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: "Hello! I'm your REGAL Assistant. How can I help you today?",
            timestamp: new Date(),
            links: [
                { label: 'Book an Event', url: '/events/custom' },
                { label: 'Catering Menu', url: '/catering/menu' },
                { label: 'Bridal Gowns', url: '/bridal/gowns' }
            ]
        }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const { user } = useAuth();
    const { addToast } = useApp();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Remove markdown links from text since we show them as buttons
    const stripMarkdownLinks = (text: string) => {
        return text.replace(/\[([^\]]+)\]\([^)]+\)/g, '');
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleSend = async (e?: React.FormEvent, presetText?: string) => {
        e?.preventDefault();
        const textToSearch = presetText || input.trim();
        if (!textToSearch || isLoading) return;

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

            if (!response.ok) throw new Error('Failed to get response');

            const data = await response.json();

            const assistantMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.reply,
                timestamp: new Date(),
                links: data.links
            };

            setMessages(prev => [...prev, assistantMsg]);
        } catch (error) {
            console.error('AI Error:', error);
            addToast('Could not reach the assistant. Please try again later.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 w-16 h-16 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all z-50 group border-4 border-white/10"
                aria-label="Open AI Assistant"
            >
                <div className="absolute inset-0 rounded-full animate-ping bg-primary/20 scale-125" />
                <MessageCircle size={28} className="group-hover:rotate-12 transition-transform" />
            </button>
        );
    }

    return (
        <div className={`fixed bottom-6 right-6 z-50 flex flex-col transition-all duration-300 ${isMinimized ? 'h-16 w-16' : 'w-[90vw] md:w-[400px] h-[600px] max-h-[80vh]'}`}>
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-full animate-slide-up">
                {/* Header */}
                <div className="bg-primary p-4 flex items-center justify-between text-white">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                            <Bot size={22} className="text-secondary" />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm">REGAL Assistant</h3>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                                <span className="text-[10px] text-white/70 uppercase tracking-widest font-bold">Online</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                        >
                            <div className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${msg.role === 'user' ? 'bg-secondary text-white' : 'bg-white text-primary'
                                    } shadow-sm`}>
                                    {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                                </div>
                                <div className="space-y-2">
                                    <div className={`rounded-2xl p-3 shadow-sm ${msg.role === 'user'
                                        ? 'bg-secondary text-white rounded-tr-none'
                                        : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                                        }`}>
                                        <p className="text-sm leading-relaxed">{stripMarkdownLinks(msg.content).trim()}</p>
                                    </div>

                                    {/* Links/Quick Actions */}
                                    {msg.links && msg.links.length > 0 && (
                                        <div className="flex flex-wrap gap-2 pt-1">
                                            {msg.links.map((link, idx) => (
                                                <Link
                                                    key={idx}
                                                    href={link.url}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-semibold text-primary hover:border-secondary hover:text-secondary transition-all shadow-sm"
                                                >
                                                    {link.label} <ArrowRight size={12} />
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
                            <div className="flex gap-2 items-center text-slate-400">
                                <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center">
                                    <Loader2 className="animate-spin" size={14} />
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-wider">Thinking...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Suggestions */}
                {!isLoading && messages.length === 1 && (
                    <div className="px-4 py-2 bg-white border-t border-slate-100 overflow-x-auto whitespace-nowrap scrollbar-hide">
                        <div className="flex gap-2">
                            {['How do I book?', 'Catering packages?', 'Wedding dresses'].map((suggestion) => (
                                <button
                                    key={suggestion}
                                    onClick={() => handleSend(undefined, suggestion)}
                                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-xs text-slate-600 hover:border-secondary hover:text-secondary transition-all"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Input Area */}
                <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-100">
                    <div className="flex gap-2 bg-slate-100 rounded-2xl p-1.5 items-center focus-within:bg-white focus-within:ring-2 focus-within:ring-secondary/20 transition-all border border-transparent focus-within:border-secondary/30">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask me anything about Regal..."
                            className="flex-1 bg-transparent border-none focus:ring-0 text-sm px-2 text-slate-800 placeholder:text-slate-400 outline-none"
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-900 transition-colors shadow-lg"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                    <p className="text-[10px] text-center text-slate-400 mt-2 font-medium">
                        Powered by REGAL AI • DeepSeek-R1
                    </p>
                </form>
            </div>
        </div>
    );
}
