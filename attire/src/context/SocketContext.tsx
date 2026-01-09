'use client';

/**
 * Socket Context
 * 
 * React context for Socket.io connection and chat operations.
 * Provides hooks for real-time chat functionality.
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { initSocket, disconnectSocket, getSocket } from '@/lib/socket';

interface Message {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    read: boolean;
    created_at: string;
    sender?: {
        id: string;
        fullName: string;
        isAdmin: boolean;
    };
}

interface TypingUser {
    userId: string;
    userName: string;
}

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
    joinConversation: (conversationId: string) => void;
    leaveConversation: (conversationId: string) => void;
    sendMessage: (conversationId: string, content: string) => void;
    startTyping: (conversationId: string) => void;
    stopTyping: (conversationId: string) => void;
    markAsRead: (conversationId: string, messageIds?: string[]) => void;
    onNewMessage: (callback: (message: Message) => void) => () => void;
    onTypingUpdate: (callback: (data: { conversationId: string; users: TypingUser[] }) => void) => () => void;
    onMessagesRead: (callback: (data: { conversationId: string; readBy: string }) => void) => () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: React.ReactNode }) {
    const { session } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Initialize socket connection when session is available
    useEffect(() => {
        if (!session?.access_token) {
            disconnectSocket();
            setSocket(null);
            setIsConnected(false);
            return;
        }

        const socketInstance = initSocket({ token: session.access_token });
        setSocket(socketInstance);

        const handleConnect = () => {
            setIsConnected(true);
        };

        const handleDisconnect = () => {
            setIsConnected(false);
        };

        socketInstance.on('connect', handleConnect);
        socketInstance.on('disconnect', handleDisconnect);

        // Set initial connection state
        if (socketInstance.connected) {
            setIsConnected(true);
        }

        return () => {
            socketInstance.off('connect', handleConnect);
            socketInstance.off('disconnect', handleDisconnect);
        };
    }, [session?.access_token]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            disconnectSocket();
        };
    }, []);

    const joinConversation = useCallback((conversationId: string) => {
        const sock = getSocket();
        if (sock?.connected) {
            sock.emit('join_conversation', conversationId);
        }
    }, []);

    const leaveConversation = useCallback((conversationId: string) => {
        const sock = getSocket();
        if (sock?.connected) {
            sock.emit('leave_conversation', conversationId);
        }
    }, []);

    const sendMessage = useCallback((conversationId: string, content: string) => {
        const sock = getSocket();
        if (sock?.connected) {
            sock.emit('send_message', { conversationId, content });
        }
    }, []);

    const startTyping = useCallback((conversationId: string) => {
        const sock = getSocket();
        if (sock?.connected) {
            sock.emit('typing_start', conversationId);

            // Auto-stop typing after 3 seconds of inactivity
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            typingTimeoutRef.current = setTimeout(() => {
                sock.emit('typing_stop', conversationId);
            }, 3000);
        }
    }, []);

    const stopTyping = useCallback((conversationId: string) => {
        const sock = getSocket();
        if (sock?.connected) {
            sock.emit('typing_stop', conversationId);
        }
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
    }, []);

    const markAsRead = useCallback((conversationId: string, messageIds?: string[]) => {
        const sock = getSocket();
        if (sock?.connected) {
            sock.emit('mark_read', { conversationId, messageIds });
        }
    }, []);

    const onNewMessage = useCallback((callback: (message: Message) => void) => {
        const sock = getSocket();
        if (sock) {
            sock.on('new_message', callback);
            return () => {
                sock.off('new_message', callback);
            };
        }
        return () => {};
    }, []);

    const onTypingUpdate = useCallback((callback: (data: { conversationId: string; users: TypingUser[] }) => void) => {
        const sock = getSocket();
        if (sock) {
            sock.on('user_typing', callback);
            return () => {
                sock.off('user_typing', callback);
            };
        }
        return () => {};
    }, []);

    const onMessagesRead = useCallback((callback: (data: { conversationId: string; readBy: string }) => void) => {
        const sock = getSocket();
        if (sock) {
            sock.on('messages_read', callback);
            return () => {
                sock.off('messages_read', callback);
            };
        }
        return () => {};
    }, []);

    const value: SocketContextType = {
        socket,
        isConnected,
        joinConversation,
        leaveConversation,
        sendMessage,
        startTyping,
        stopTyping,
        markAsRead,
        onNewMessage,
        onTypingUpdate,
        onMessagesRead,
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
}

export function useSocket() {
    const context = useContext(SocketContext);
    if (context === undefined) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
}
