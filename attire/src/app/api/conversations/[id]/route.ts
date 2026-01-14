export const runtime = "nodejs";

/**
 * User Conversations API
 * 
 * GET /api/conversations/[id] - Get user's own conversation with messages
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll() {
                    // Read-only
                },
            },
        }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await params;

        // Get conversation details (RLS will ensure it's the user's conversation)
        const { data: conversation, error: conversationError } = await supabase
            .from('conversations')
            .select('*')
            .eq('id', id)
            .single();

        if (conversationError) {
            if (conversationError.code === 'PGRST116') {
                return NextResponse.json(
                    { error: 'Conversation not found or access denied' },
                    { status: 404 }
                );
            }
            throw conversationError;
        }

        // Get messages for this conversation
        const { data: messages, error: messagesError } = await supabase
            .from('messages')
            .select('*')
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
