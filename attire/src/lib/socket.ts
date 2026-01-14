/**
 * Socket.io Client Singleton
 * 
 * Manages Socket.io connection for real-time chat.
 */

import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

interface SocketOptions {
    token: string;
}

/**
 * Initialize the Socket.io connection
 */
export function initSocket({ token }: SocketOptions): Socket {
    if (socket) {
        return socket;
    }

    socket = io({
        path: '/socket.io',
        auth: { token },
        transports: ['websocket'], // Force websocket only to save HTTP connection slots
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
        console.log('Socket connected:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message);
    });

    return socket;
}

/**
 * Get the current socket instance
 */
export function getSocket(): Socket | null {
    return socket;
}

/**
 * Disconnect and clean up the socket
 */
export function disconnectSocket(): void {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}

/**
 * Check if socket is connected
 */
export function isSocketConnected(): boolean {
    return socket?.connected ?? false;
}
