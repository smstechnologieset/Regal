export const runtime = "nodejs";

/**
 * Admin Conversations API
 * 
 * GET /api/admin/conversations - List all conversations
 * PATCH /api/admin/conversations - Update conversation status
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, forbiddenResponse, unauthorizedResponse } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
    // Verify admin access
    const { isAdmin, userId, error } = await verifyAdmin();
    
    if (!userId) {
        return unauthorizedResponse(error);
    }
    
    if (!isAdmin) {
        return forbiddenResponse(error);
    }

    try {
        const supabase = createAdminClient();
        const searchParams = request.nextUrl.searchParams;
        
        // Optional filters
        const status = searchParams.get('status');
        const serviceType = searchParams.get('service_type');

        let query = supabase
            .from('conversations')
            .select('id, user_id, admin_id, service_type, order_id, subject, status, last_message_at, created_at, profiles!conversations_user_id_fkey(full_name)')
            .order('last_message_at', { ascending: false });

        if (status && status !== 'all') {
            query = query.eq('status', status);
        }

        if (serviceType && serviceType !== 'all') {
            query = query.eq('service_type', serviceType);
        }

        const { data: conversations, error: conversationsError } = await query;

        if (conversationsError) {
            throw conversationsError;
        }

        return NextResponse.json({ conversations: conversations || [] });
    } catch (error: any) {
        console.error('Error fetching conversations:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch conversations' },
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
        const { conversationId, status, admin_id } = body;

        if (!conversationId) {
            return NextResponse.json(
                { error: 'Missing required field: conversationId' },
                { status: 400 }
            );
        }

        const validStatuses = ['open', 'closed'];
        if (status && !validStatuses.includes(status)) {
            return NextResponse.json(
                { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
                { status: 400 }
            );
        }

        const supabase = createAdminClient();

        const updates: { status?: string; admin_id?: string } = {};
        if (status) updates.status = status;
        if (admin_id) updates.admin_id = admin_id;

        const { data, error: updateError } = await supabase
            .from('conversations')
            .update(updates)
            .eq('id', conversationId)
            .select('*, profiles(full_name)')
            .single();

        if (updateError) {
            throw updateError;
        }

        return NextResponse.json({ conversation: data });
    } catch (error: any) {
        console.error('Error updating conversation:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update conversation' },
            { status: 500 }
        );
    }
}
