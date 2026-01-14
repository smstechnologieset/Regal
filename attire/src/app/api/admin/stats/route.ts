/**
 * Admin Dashboard Stats API
 * 
 * Returns statistics for the admin dashboard.
 * GET /api/admin/stats
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, forbiddenResponse, unauthorizedResponse } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

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

        // Fetch all orders for stats calculation
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('id, total, created_at, status, service_type');

        if (ordersError) {
            throw ordersError;
        }

        // Fetch users count
        const { count: usersCount, error: usersError } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });

        if (usersError) {
            throw usersError;
        }

        // Fetch unread messages count
        const { count: unreadCount, error: messagesError } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('read', false);

        if (messagesError) {
            throw messagesError;
        }

        // Fetch recent orders with user info
        const { data: recentOrders, error: recentError } = await supabase
            .from('orders')
            .select('id, total, status, service_type, created_at, profiles!orders_user_id_fkey(full_name)')
            .order('created_at', { ascending: false })
            .limit(5);

        if (recentError) {
            throw recentError;
        }

        // Calculate stats
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        const totalRevenue = orders?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;
        const monthlyRevenue = orders
            ?.filter(o => new Date(o.created_at) >= monthStart)
            .reduce((sum, o) => sum + (o.total || 0), 0) || 0;

        const activeOrders = orders?.filter(o =>
            ['pending', 'confirmed', 'in_progress'].includes(o.status)
        ).length || 0;

        const ordersByService = {
            attire: orders?.filter(o => o.service_type === 'attire').length || 0,
            events: orders?.filter(o => o.service_type === 'events').length || 0,
            bridal: orders?.filter(o => o.service_type === 'bridal').length || 0,
            catering: orders?.filter(o => o.service_type === 'catering').length || 0,
        };

        const ordersByStatus = {
            pending: orders?.filter(o => o.status === 'pending').length || 0,
            confirmed: orders?.filter(o => o.status === 'confirmed').length || 0,
            in_progress: orders?.filter(o => o.status === 'in_progress').length || 0,
            completed: orders?.filter(o => o.status === 'completed').length || 0,
            cancelled: orders?.filter(o => o.status === 'cancelled').length || 0,
        };

        return NextResponse.json({
            totalRevenue,
            monthlyRevenue,
            totalUsers: usersCount || 0,
            activeOrders,
            unreadMessages: unreadCount || 0,
            ordersByService,
            ordersByStatus,
            recentOrders: recentOrders || [],
        });
    } catch (error: any) {
        console.error('Error fetching admin stats:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch stats' },
            { status: 500 }
        );
    }
}
