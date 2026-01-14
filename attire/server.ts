/**
 * Custom Next.js Server with Socket.io
 * 
 * Integrates Socket.io for real-time chat functionality.
 * Run with: npx ts-node --project tsconfig.server.json server.ts
 */

import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

// Initialize Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Initialize Supabase admin client for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
});

interface SocketUser {
    userId: string;
    isAdmin: boolean;
}

interface TypingUser {
    conversationId: string;
    userId: string;
    userName: string;
}

// Track connected users and their rooms
const connectedUsers = new Map<string, SocketUser>();
const typingUsers = new Map<string, TypingUser[]>();

app.prepare().then(() => {
    const httpServer = createServer((req, res) => {
        const parsedUrl = parse(req.url!, true);
        handle(req, res, parsedUrl);
    });

    // Initialize Socket.io
    const io = new SocketIOServer(httpServer, {
        cors: {
            origin: dev ? 'http://localhost:3000' : process.env.NEXT_PUBLIC_APP_URL,
            methods: ['GET', 'POST'],
            credentials: true,
        },
        path: '/socket.io',
    });

    // Authentication middleware
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            
            if (!token) {
                console.log('Socket connection denied: No token provided');
                return next(new Error('Authentication required'));
            }

            // Verify the token with Supabase
            console.log('Verifying socket token...');
            const { data, error } = await supabaseAdmin.auth.getUser(token);
            const user = data?.user;
            
            if (error || !user) {
                console.error('Socket authentication error (Supabase):', error?.message || 'User not found');
                return next(new Error('Invalid token'));
            }

            // Get user profile to check role
            console.log(`Fetching profile for user: ${user.id}`);
            const { data: profile, error: profileError } = await supabaseAdmin
                .from('profiles')
                .select('role, full_name')
                .eq('id', user.id)
                .single();

            if (profileError) {
                console.warn(`Profile fetch error for user ${user.id}:`, profileError.message);
            }

            // Attach user info to socket
            socket.data.user = {
                id: user.id,
                email: user.email || '',
                fullName: profile?.full_name || 'User',
                isAdmin: profile?.role === 'admin',
            };

            console.log(`Socket authentication successful: ${user.email} (${socket.data.user.isAdmin ? 'Admin' : 'User'})`);
            next();
        } catch (error) {
            console.error('Socket authentication exception:', error);
            next(new Error('Authentication failed'));
        }
    });

    io.on('connection', (socket: Socket) => {
        const user = socket.data.user;
        console.log(`User connected: ${user.id} (${user.isAdmin ? 'admin' : 'user'})`);

        // Track connected user
        connectedUsers.set(socket.id, {
            userId: user.id,
            isAdmin: user.isAdmin,
        });

        // Join conversation room
        socket.on('join_conversation', async (conversationId: string) => {
            try {
                // Verify user has access to this conversation
                const { data: conversation } = await supabaseAdmin
                    .from('conversations')
                    .select('user_id')
                    .eq('id', conversationId)
                    .single();

                if (!conversation) {
                    socket.emit('error', { message: 'Conversation not found' });
                    return;
                }

                // Check access: admin can access any, user can only access their own
                if (!user.isAdmin && conversation.user_id !== user.id) {
                    socket.emit('error', { message: 'Access denied' });
                    return;
                }

                socket.join(conversationId);
                socket.emit('joined_conversation', { conversationId });
                console.log(`User ${user.id} joined conversation ${conversationId}`);
            } catch (error) {
                console.error('Error joining conversation:', error);
                socket.emit('error', { message: 'Failed to join conversation' });
            }
        });

        // Leave conversation room
        socket.on('leave_conversation', (conversationId: string) => {
            socket.leave(conversationId);
            
            // Remove from typing users
            const currentTyping = typingUsers.get(conversationId) || [];
            typingUsers.set(
                conversationId,
                currentTyping.filter(t => t.userId !== user.id)
            );
            
            // Notify others that user stopped typing
            socket.to(conversationId).emit('user_typing', {
                conversationId,
                users: typingUsers.get(conversationId) || [],
            });
            
            console.log(`User ${user.id} left conversation ${conversationId}`);
        });

        // Send message
        socket.on('send_message', async (data: { conversationId: string; content: string }) => {
            try {
                const { conversationId, content } = data;

                if (!content.trim()) {
                    socket.emit('error', { message: 'Message cannot be empty' });
                    return;
                }

                // Insert message into database
                const { data: message, error } = await supabaseAdmin
                    .from('messages')
                    .insert({
                        conversation_id: conversationId,
                        sender_id: user.id,
                        content: content.trim(),
                        read: false,
                    })
                    .select()
                    .single();

                if (error) {
                    throw error;
                }

                // Update conversation last_message_at
                await supabaseAdmin
                    .from('conversations')
                    .update({ last_message_at: new Date().toISOString() })
                    .eq('id', conversationId);

                // Broadcast to all users in the conversation room
                io.to(conversationId).emit('new_message', {
                    ...message,
                    sender: {
                        id: user.id,
                        fullName: user.fullName,
                        isAdmin: user.isAdmin,
                    },
                });

                // Remove sender from typing list
                const currentTyping = typingUsers.get(conversationId) || [];
                typingUsers.set(
                    conversationId,
                    currentTyping.filter(t => t.userId !== user.id)
                );

                console.log(`Message sent in conversation ${conversationId} by ${user.id}`);
            } catch (error) {
                console.error('Error sending message:', error);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        // Typing indicators
        socket.on('typing_start', (conversationId: string) => {
            const currentTyping = typingUsers.get(conversationId) || [];
            
            // Add user if not already typing
            if (!currentTyping.find(t => t.userId === user.id)) {
                currentTyping.push({
                    conversationId,
                    userId: user.id,
                    userName: user.fullName,
                });
                typingUsers.set(conversationId, currentTyping);
            }

            // Broadcast to others in the room
            socket.to(conversationId).emit('user_typing', {
                conversationId,
                users: currentTyping.filter(t => t.userId !== user.id),
            });
        });

        socket.on('typing_stop', (conversationId: string) => {
            const currentTyping = typingUsers.get(conversationId) || [];
            typingUsers.set(
                conversationId,
                currentTyping.filter(t => t.userId !== user.id)
            );

            // Broadcast to others in the room
            socket.to(conversationId).emit('user_typing', {
                conversationId,
                users: typingUsers.get(conversationId) || [],
            });
        });

        // Mark messages as read
        socket.on('mark_read', async (data: { conversationId: string; messageIds?: string[] }) => {
            try {
                const { conversationId, messageIds } = data;

                if (messageIds && messageIds.length > 0) {
                    // Mark specific messages as read
                    await supabaseAdmin
                        .from('messages')
                        .update({ read: true })
                        .in('id', messageIds);
                } else {
                    // Mark all unread messages in conversation as read (except own)
                    await supabaseAdmin
                        .from('messages')
                        .update({ read: true })
                        .eq('conversation_id', conversationId)
                        .neq('sender_id', user.id);
                }

                // Broadcast read status update
                io.to(conversationId).emit('messages_read', {
                    conversationId,
                    readBy: user.id,
                    messageIds,
                });

                console.log(`Messages marked as read in ${conversationId} by ${user.id}`);
            } catch (error) {
                console.error('Error marking messages as read:', error);
            }
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            console.log(`User disconnected: ${user.id}`);
            connectedUsers.delete(socket.id);

            // Remove from all typing lists
            typingUsers.forEach((users, conversationId) => {
                const filtered = users.filter(t => t.userId !== user.id);
                if (filtered.length !== users.length) {
                    typingUsers.set(conversationId, filtered);
                    socket.to(conversationId).emit('user_typing', {
                        conversationId,
                        users: filtered,
                    });
                }
            });
        });
    });

    httpServer.listen(port, () => {
        console.log(`> Ready on http://${hostname}:${port}`);
        console.log(`> Socket.io server running`);
    });
});
