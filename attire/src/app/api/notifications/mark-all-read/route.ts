export const runtime = "nodejs";

/**
 * Mark All Notifications as Read API
 * 
 * POST /api/notifications/mark-all-read - Mark all user notifications as read
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        
        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Mark all unread notifications as read
        const { data, error: dbError } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('user_id', user.id)
            .eq('read', false)
            .select();

        if (dbError) {
            console.error('Error marking all notifications as read:', dbError);
            return NextResponse.json({ error: 'Failed to mark notifications as read' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            count: data?.length || 0,
        });
    } catch (error: any) {
        console.error('Unexpected error in mark-all-read API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
