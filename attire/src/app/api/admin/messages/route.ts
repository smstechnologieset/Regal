export const runtime = "nodejs";

/**
 * Admin Messages API
 * 
 * POST /api/admin/messages - Send a message (as admin)
 * PATCH /api/admin/messages - Mark messages as read
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, forbiddenResponse, unauthorizedResponse } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
    // Verify admin access
    const { isAdmin, userId, error } = await verifyAdmin();
    
    if (!userId) {
        return unauthorizedResponse(error);
    }
    
    if (!isAdmin) {
        return forbiddenResponse(error);
    }

    try {
        const body = await request.json();
        const { conversationId, content } = body;

        if (!conversationId || !content) {
            return NextResponse.json(
                { error: 'Missing required fields: conversationId, content' },
                { status: 400 }
            );
        }

        const supabase = createAdminClient();

        // Insert the message
        const { data: message, error: messageError } = await supabase
            .from('messages')
            .insert({
                conversation_id: conversationId,
                sender_id: userId,
                content: content.trim(),
                read: false,
            })
            .select()
            .single();

        if (messageError) {
            throw messageError;
        }

        // Update conversation's last_message_at (trigger should do this, but let's be explicit)
        await supabase
            .from('conversations')
            .update({ 
                last_message_at: new Date().toISOString(),
                admin_id: userId, // Assign admin to conversation
            })
            .eq('id', conversationId);

        return NextResponse.json({ message });
    } catch (error) {
        console.error('Error sending message:', error);
        return NextResponse.json(
            { error: 'Failed to send message' },
            { status: 500 }
        );
    }
}

export async function PATCH(request: NextRequest) {
    // Verify admin access
    const { isAdmin, userId, error } = await verifyAdmin();
    
    if (!userId) {
        return unauthorizedResponse(error);
    }
    
    if (!isAdmin) {
        return forbiddenResponse(error);
    }

    try {
        const body = await request.json();
        const { messageIds, conversationId } = body;

        if (!messageIds && !conversationId) {
            return NextResponse.json(
                { error: 'Missing required field: messageIds or conversationId' },
                { status: 400 }
            );
        }

        const supabase = createAdminClient();

        if (conversationId) {
            // Mark all messages in conversation as read (except admin's own)
            const { error: updateError } = await supabase
                .from('messages')
                .update({ read: true })
                .eq('conversation_id', conversationId)
                .neq('sender_id', userId);

            if (updateError) {
                throw updateError;
            }
        } else if (messageIds && Array.isArray(messageIds)) {
            // Mark specific messages as read
            const { error: updateError } = await supabase
                .from('messages')
                .update({ read: true })
                .in('id', messageIds);

            if (updateError) {
                throw updateError;
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error marking messages as read:', error);
        return NextResponse.json(
            { error: 'Failed to update messages' },
            { status: 500 }
        );
    }
}
