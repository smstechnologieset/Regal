'use client';

/**
 * Chat Window Component
 * 
 * Reusable real-time chat interface for both user and admin views.
 * Uses Supabase Realtime for message sync.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getSupabaseClient } from '@/lib/supabase/client';

interface Message {
    id: string;
    sender_id: string;
    content: string;
    created_at: string;
    read: boolean;
}

interface ChatWindowProps {
    conversationId: string;
    isAdmin?: boolean;
}

export default function ChatWindow({ conversationId, isAdmin = false }: ChatWindowProps) {
    const { user, profile } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const supabase = getSupabaseClient();

    // Scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Fetch messages
    useEffect(() => {
        async function fetchMessages() {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true });

            if (!error && data) {
                setMessages(data);
            }
            setLoading(false);
        }

        fetchMessages();
    }, [conversationId, supabase]);

    // Subscribe to real-time updates
    useEffect(() => {
        const channel = supabase
            .channel(`messages:${conversationId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${conversationId}`,
                },
                (payload: any) => {
                    setMessages((prev) => [...prev, payload.new as Message]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [conversationId, supabase]);

    // Scroll on new messages
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Mark messages as read
    useEffect(() => {
        if (isAdmin && messages.length > 0) {
            const unreadIds = messages
                .filter(m => !m.read && m.sender_id !== user?.id)
                .map(m => m.id);

            if (unreadIds.length > 0) {
                supabase
                    .from('messages')
                    .update({ read: true })
                    .in('id', unreadIds)
                    .then();
            }
        }
    }, [messages, isAdmin, user, supabase]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user) return;

        setSending(true);

        const { error } = await supabase.from('messages').insert({
            conversation_id: conversationId,
            sender_id: user.id,
            content: newMessage.trim(),
            read: false,
        });

        if (!error) {
            setNewMessage('');
        }

        setSending(false);
    };

    const formatTime = (date: string) => {
        return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (date: string) => {
        const d = new Date(date);
        const today = new Date();
        if (d.toDateString() === today.toDateString()) return 'Today';
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
        return d.toLocaleDateString();
    };

    // Group messages by date
    const groupedMessages: { [date: string]: Message[] } = {};
    messages.forEach((msg) => {
        const date = formatDate(msg.created_at);
        if (!groupedMessages[date]) groupedMessages[date] = [];
        groupedMessages[date].push(msg);
    });

    return (
        <div className="flex flex-col h-[500px] bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="animate-spin text-slate-400" size={24} />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-slate-500">
                        No messages yet. Start the conversation!
                    </div>
                ) : (
                    Object.entries(groupedMessages).map(([date, msgs]) => (
                        <div key={date}>
                            <div className="text-center mb-4">
                                <span className="px-3 py-1 bg-white text-xs text-slate-500 rounded-full border border-slate-200">
                                    {date}
                                </span>
                            </div>
                            <div className="space-y-3">
                                {msgs.map((msg) => {
                                    const isOwn = msg.sender_id === user?.id;
                                    return (
                                        <div
                                            key={msg.id}
                                            className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-[75%] px-4 py-2 rounded-2xl ${isOwn
                                                    ? 'bg-rose-600 text-white rounded-br-sm'
                                                    : 'bg-white text-slate-900 border border-slate-200 rounded-bl-sm'
                                                    }`}
                                            >
                                                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                                <p
                                                    className={`text-xs mt-1 ${isOwn ? 'text-rose-200' : 'text-slate-400'
                                                        }`}
                                                >
                                                    {formatTime(msg.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-200">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 px-4 py-2 border border-slate-200 rounded-full focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                        disabled={sending}
                    />
                    <button
                        type="submit"
                        disabled={sending || !newMessage.trim()}
                        className="w-10 h-10 bg-rose-600 text-white rounded-full flex items-center justify-center hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {sending ? (
                            <Loader2 className="animate-spin" size={18} />
                        ) : (
                            <Send size={18} />
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
