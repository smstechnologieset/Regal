/**
 * Admin Orders API
 * 
 * GET /api/admin/orders - List all orders
 * PATCH /api/admin/orders - Update order status
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
        const service = searchParams.get('service');
        const status = searchParams.get('status');
        const limit = parseInt(searchParams.get('limit') || '100');

        let query = supabase
            .from('orders')
            .select('id, user_id, service_type, status, total, notes, created_at, updated_at, profiles!orders_user_id_fkey(full_name)')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (service && service !== 'all') {
            query = query.eq('service_type', service);
        }

        if (status && status !== 'all') {
            query = query.eq('status', status);
        }

        const { data: orders, error: ordersError } = await query;

        if (ordersError) {
            throw ordersError;
        }

        return NextResponse.json({ orders: orders || [] });
    } catch (error) {
        console.error('Error fetching orders:', error);
        return NextResponse.json(
            { error: 'Failed to fetch orders' },
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
        const { orderId, status, notes } = body;

        if (!orderId) {
            return NextResponse.json(
                { error: 'Missing required field: orderId' },
                { status: 400 }
            );
        }

        const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];
        if (status && !validStatuses.includes(status)) {
            return NextResponse.json(
                { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
                { status: 400 }
            );
        }

        const supabase = createAdminClient();

        const updates: { status?: string; notes?: string } = {};
        if (status) updates.status = status;
        if (notes !== undefined) updates.notes = notes;

        const { data, error: updateError } = await supabase
            .from('orders')
            .update(updates)
            .eq('id', orderId)
            .select('*, profiles!orders_user_id_fkey(full_name)')
            .single();

        if (updateError) {
            throw updateError;
        }

        return NextResponse.json({ order: data });
    } catch (error) {
        console.error('Error updating order:', error);
        return NextResponse.json(
            { error: 'Failed to update order' },
            { status: 500 }
        );
    }
}
