export const runtime = "nodejs";

/**
 * Admin Single Order API
 * 
 * GET /api/admin/orders/[id] - Get single order with details
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

        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*, profiles!orders_user_id_fkey(id, full_name, phone, avatar_url)')
            .eq('id', id)
            .single();

        if (orderError) {
            if (orderError.code === 'PGRST116') {
                return NextResponse.json(
                    { error: 'Order not found' },
                    { status: 404 }
                );
            }
            throw orderError;
        }

        return NextResponse.json({ order });
    } catch (error) {
        console.error('Error fetching order:', error);
        return NextResponse.json(
            { error: 'Failed to fetch order' },
            { status: 500 }
        );
    }
}
