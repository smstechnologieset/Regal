/**
 * Admin Single Conversation API
 * 
 * GET /api/admin/conversations/[id] - Get conversation with messages
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, forbiddenResponse, unauthorizedResponse } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    // Verify admin access
    const { isAdmin, userId, error } = await verifyAdmin();
    
    if (!userId) {
        return unauthorizedResponse(error);
    }
    
    if (!isAdmin) {
        return forbiddenResponse(error);
    }

    try {
        const { id } = await params;
        const supabase = createAdminClient();

        // Get conversation details
        const { data: conversation, error: conversationError } = await supabase
            .from('conversations')
            .select('*, profiles!conversations_user_id_fkey(id, full_name, phone, avatar_url)')
            .eq('id', id)
            .single();

        if (conversationError) {
            if (conversationError.code === 'PGRST116') {
                return NextResponse.json(
                    { error: 'Conversation not found' },
                    { status: 404 }
                );
            }
            throw conversationError;
        }

        // Get messages for this conversation
        const { data: messages, error: messagesError } = await supabase
            .from('messages')
            .select('id, sender_id, content, read, created_at')
            .eq('conversation_id', id)
            .order('created_at', { ascending: true });

        if (messagesError) {
            throw messagesError;
        }

        return NextResponse.json({
            conversation,
            messages: messages || [],
        });
    } catch (error) {
        console.error('Error fetching conversation:', error);
        return NextResponse.json(
            { error: 'Failed to fetch conversation' },
            { status: 500 }
        );
    }
}
