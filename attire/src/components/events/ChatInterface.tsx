'use client';

/**
 * Event Request Chat
 *
 * Real-time chat for an event-request conversation. Backed by Socket.io via
 * SocketContext and the conversations API — the same mechanism as the attire
 * ChatWindow. Admin replies arrive live over the socket (no more mock replies).
 */

import React, { useState, useRef, useEffect } from 'react';
import { Send, ShieldCheck, Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';

interface Message {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    read: boolean;
    created_at: string;
}

interface ChatInterfaceProps {
    /** The conversation id backing this event request chat. */
    conversationId: string;
}

export default function ChatInterface({ conversationId }: ChatInterfaceProps) {
    const { user } = useAuth();
    const {
        joinConversation,
        leaveConversation,
        sendMessage,
        startTyping,
        stopTyping,
        markAsRead,
        onNewMessage,
        onTypingUpdate,
        onMessagesRead,
        isConnected,
    } = useSocket();

    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [isTyping, setIsTyping] = useState(false);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
    };

    // Load message history for the conversation.
    useEffect(() => {
        let active = true;
        async function fetchMessages() {
            try {
                const res = await fetch(`/api/conversations/${conversationId}`);
                if (res.ok) {
                    const data = await res.json();
                    if (active) setMessages(data.messages || []);
                }
            } catch (error) {
                console.error('Error fetching event chat messages:', error);
            } finally {
                if (active) setLoading(false);
            }
        }
        fetchMessages();
        return () => {
            active = false;
        };
    }, [conversationId]);

    // Wire up realtime listeners.
    useEffect(() => {
        if (!isConnected) return;

        joinConversation(conversationId);

        const removeNewMessage = onNewMessage((msg) => {
            if (msg.conversation_id === conversationId) {
                setMessages((prev) => [...prev, msg]);
            }
        });

        const removeTypingUpdate = onTypingUpdate((data) => {
            if (data.conversationId === conversationId) {
                setIsTyping(data.users.length > 0);
            }
        });

        const removeMessagesRead = onMessagesRead((data) => {
            if (data.conversationId === conversationId) {
                setMessages((prev) => prev.map((m) => ({ ...m, read: true })));
            }
        });

        return () => {
            leaveConversation(conversationId);
            removeNewMessage();
            removeTypingUpdate();
            removeMessagesRead();
        };
    }, [conversationId, isConnected, joinConversation, leaveConversation, onNewMessage, onTypingUpdate, onMessagesRead]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    // Mark incoming messages as read.
    useEffect(() => {
        if (messages.some((m) => !m.read && m.sender_id !== user?.id)) {
            markAsRead(conversationId);
        }
    }, [messages, conversationId, user?.id, markAsRead]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user) return;
        sendMessage(conversationId, newMessage.trim());
        setNewMessage('');
        stopTyping(conversationId);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewMessage(e.target.value);
        if (e.target.value.trim()) startTyping(conversationId);
        else stopTyping(conversationId);
    };

    const formatTime = (date: string) =>
        new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[600px]">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-secondary">
                        <ShieldCheck size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-primary">Event Planner</h3>
                        <p className="text-xs text-slate-500">Regal Concierge</p>
                    </div>
                </div>
                {!isConnected && (
                    <span className="text-xs text-amber-600 italic">Connecting…</span>
                )}
            </div>

            {/* Messages */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="animate-spin text-slate-400" size={24} />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-sm">
                        No messages yet. Start the conversation!
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isOwn = msg.sender_id === user?.id;
                        return (
                            <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                <div
                                    className={`max-w-[80%] rounded-2xl p-4 ${isOwn
                                        ? 'bg-secondary text-white rounded-br-none'
                                        : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'
                                        }`}
                                >
                                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                    <span
                                        className={`text-[10px] mt-1 block ${isOwn ? 'text-rose-200' : 'text-slate-400'}`}
                                    >
                                        {formatTime(msg.created_at)}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}

                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-slate-200/50 px-3 py-1.5 rounded-full flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-slate-200">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={handleInputChange}
                        placeholder="Type a message..."
                        autoComplete="off"
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
