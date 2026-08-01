export const runtime = "nodejs";

/**
 * Notifications API
 * 
 * GET /api/notifications - Fetch user notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        
        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get query parameters (clamped to safe ranges)
        const searchParams = request.nextUrl.searchParams;
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50') || 50));
        const offset = Math.max(0, parseInt(searchParams.get('offset') || '0') || 0);
        const type = searchParams.get('type');
        const unreadOnly = searchParams.get('unread_only') === 'true';

        // Build query
        let query = supabase
            .from('notifications')
            .select('*', { count: 'exact' })
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        // Apply filters
        if (type) {
            query = query.eq('type', type);
        }
        if (unreadOnly) {
            query = query.eq('read', false);
        }

        const { data: notifications, error: dbError, count } = await query;

        if (dbError) {
            console.error('Error fetching notifications:', dbError);
            return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
        }

        // Calculate unread count
        const { count: unreadCount } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('read', false);

        return NextResponse.json({
            notifications: notifications || [],
            total: count || 0,
            unread_count: unreadCount || 0,
        });
    } catch (error: any) {
        console.error('Unexpected error in notifications API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
