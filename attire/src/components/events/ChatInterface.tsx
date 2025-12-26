'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, User, ShieldCheck } from 'lucide-react';
import Button from '@/components/ui/Button';

interface Message {
    id: string;
    sender: 'user' | 'admin';
    text: string;
    timestamp: Date;
}

interface ChatInterfaceProps {
    requestId: string;
    initialMessages?: Message[];
}

export default function ChatInterface({ requestId, initialMessages = [] }: ChatInterfaceProps) {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            sender: 'user',
            text: newMessage,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMsg]);
        setNewMessage('');

        // Simulate admin reply
        setTimeout(() => {
            const adminMsg: Message = {
                id: (Date.now() + 1).toString(),
                sender: 'admin',
                text: "Thanks for your message! I'm reviewing your request and will update the proposal shortly.",
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, adminMsg]);
        }, 2000);
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[600px]">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                        <ShieldCheck size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900">Event Planner</h3>
                        <p className="text-xs text-slate-500">Regal Concierge</p>
                    </div>
                </div>
                <div className="text-xs text-slate-400">
                    Request ID: {requestId}
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                {messages.length === 0 && (
                    <div className="text-center py-10 text-slate-400 text-sm">
                        No messages yet. Start the conversation!
                    </div>
                )}

                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[80%] rounded-2xl p-4 ${msg.sender === 'user'
                                    ? 'bg-rose-600 text-white rounded-br-none'
                                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'
                                }`}
                        >
                            <p className="text-sm">{msg.text}</p>
                            <span
                                className={`text-[10px] mt-1 block ${msg.sender === 'user' ? 'text-rose-200' : 'text-slate-400'
                                    }`}
                            >
                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-slate-200">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2 bg-slate-100 border-transparent rounded-full focus:bg-white focus:border-rose-300 focus:ring-0 transition-all outline-none"
                    />
                    <Button
                        type="submit"
                        size="sm"
                        variant="primary"
                        disabled={!newMessage.trim()}
                        className="rounded-full w-10 h-10 p-0 flex items-center justify-center"
                    >
                        <Send size={18} />
                    </Button>
                </form>
            </div>
        </div>
    );
}
