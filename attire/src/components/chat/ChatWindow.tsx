'use client';

/**
 * Chat Window Component
 * 
 * Reusable real-time chat interface for both user and admin views.
 * Uses Socket.io via SocketContext for real-time messaging, typing indicators, and read receipts.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2 } from 'lucide-react';
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

interface TypingUser {
    userId: string;
    userName: string;
}

interface ChatWindowProps {
    conversationId: string;
    isAdmin?: boolean;
}

export default function ChatWindow({ conversationId, isAdmin = false }: ChatWindowProps) {
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
        isConnected
    } = useSocket();

    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Initial fetch of messages via API
    useEffect(() => {
        async function fetchMessages() {
            try {
                const endpoint = isAdmin 
                    ? `/api/admin/conversations/${conversationId}` 
                    : `/api/conversations/${conversationId}`; // Need to ensure user-side API exists too
                
                const response = await fetch(endpoint);
                if (response.ok) {
                    const data = await response.json();
                    setMessages(data.messages || []);
                }
            } catch (error) {
                console.error('Error fetching messages:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchMessages();
    }, [conversationId, isAdmin]);

    // Socket listeners setup
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
                setTypingUsers(data.users);
            }
        });

        const removeMessagesRead = onMessagesRead((data) => {
            if (data.conversationId === conversationId) {
                setMessages((prev) => prev.map(m => ({ ...m, read: true })));
            }
        });

        return () => {
            leaveConversation(conversationId);
            removeNewMessage();
            removeTypingUpdate();
            removeMessagesRead();
        };
    }, [conversationId, isConnected, joinConversation, leaveConversation, onNewMessage, onTypingUpdate, onMessagesRead]);

    // Scroll on new messages
    useEffect(() => {
        scrollToBottom();
    }, [messages, typingUsers]);

    // Mark messages as read when window is open and new messages arrive
    useEffect(() => {
        if (messages.length > 0) {
            const hasUnread = messages.some(m => !m.read && m.sender_id !== user?.id);
            if (hasUnread) {
                markAsRead(conversationId);
            }
        }
    }, [messages, conversationId, user?.id, markAsRead]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user) return;

        sendMessage(conversationId, newMessage.trim());
        setNewMessage('');
        stopTyping(conversationId);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewMessage(e.target.value);
        if (e.target.value.trim()) {
            startTyping(conversationId);
        } else {
            stopTyping(conversationId);
        }
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
        <div className="flex flex-col h-[600px] bg-slate-50 rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Connection Status */}
            {!isConnected && (
                <div className="bg-amber-50 text-amber-700 text-xs py-1 px-4 text-center border-b border-amber-100 italic">
                    Connecting to real-time service...
                </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
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
                            <div className="text-center mb-6">
                                <span className="px-3 py-1 bg-white text-xs text-slate-500 rounded-full border border-slate-100 shadow-sm">
                                    {date}
                                </span>
                            </div>
                            <div className="space-y-4">
                                {msgs.map((msg) => {
                                    const isOwn = msg.sender_id === user?.id;
                                    return (
                                        <div
                                            key={msg.id}
                                            className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[80%]`}>
                                                <div
                                                    className={`px-4 py-2.5 rounded-2xl shadow-sm ${isOwn
                                                        ? 'bg-rose-600 text-white rounded-br-none'
                                                        : 'bg-white text-slate-900 border border-slate-100 rounded-bl-none'
                                                        }`}
                                                >
                                                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                                </div>
                                                <div className="flex items-center gap-1.5 mt-1 px-1">
                                                    <p className="text-[10px] text-slate-400 font-medium">
                                                        {formatTime(msg.created_at)}
                                                    </p>
                                                    {isOwn && (
                                                        <span className={`text-[10px] font-bold ${msg.read ? 'text-blue-500' : 'text-slate-300'}`}>
                                                            {msg.read ? 'Read' : 'Sent'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                )}

                {/* Typing Indicator */}
                {typingUsers.length > 0 && (
                    <div className="flex justify-start">
                        <div className="bg-slate-200/50 px-3 py-1.5 rounded-full flex items-center gap-2">
                             <div className="flex gap-1">
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                             </div>
                             <span className="text-[10px] text-slate-500 font-medium">
                                {typingUsers.length === 1 
                                    ? `${typingUsers[0].userName} is typing...` 
                                    : 'Several people are typing...'}
                             </span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-200">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={handleInputChange}
                        placeholder="Type your message..."
                        className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-full focus:ring-2 focus:ring-rose-500 focus:bg-white focus:border-transparent outline-none transition-all text-sm"
                        autoComplete="off"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="w-10 h-10 bg-rose-600 text-white rounded-full flex items-center justify-center hover:bg-rose-700 disabled:opacity-40 disabled:scale-95 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </form>
        </div>
    );
}
