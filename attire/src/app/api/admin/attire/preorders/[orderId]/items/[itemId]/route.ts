export const runtime = "nodejs";

/**
 * Admin Pre-Order Item Update API
 * 
 * PATCH /api/admin/attire/preorders/:orderId/items/:itemId - Update pre-order status
 * Requirements: 8.1, 8.2, 8.3
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, forbiddenResponse, unauthorizedResponse } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ orderId: string; itemId: string }> }
) {
    const { isAdmin, userId, error } = await verifyAdmin();
    if (!userId) return unauthorizedResponse(error);
    if (!isAdmin) return forbiddenResponse(error);

    try {
        const { orderId, itemId } = await params;
        const body = await request.json();
        const { preorder_status } = body;

        if (!preorder_status) {
            return NextResponse.json(
                { error: 'preorder_status is required' },
                { status: 400 }
            );
        }

        // Validate status
        const validStatuses = ['pending', 'ready', 'fulfilled', 'cancelled'];
        if (!validStatuses.includes(preorder_status)) {
            return NextResponse.json(
                { error: 'Invalid preorder_status. Must be one of: pending, ready, fulfilled, cancelled' },
                { status: 400 }
            );
        }

        const supabase = createAdminClient();

        // Update the order item
        const { data: updatedItem, error: updateError } = await supabase
            .from('order_items')
            .update({ preorder_status })
            .eq('id', itemId)
            .eq('order_id', orderId)
            .eq('is_preorder', true)
            .select()
            .single();

        if (updateError || !updatedItem) {
            console.error('Error updating pre-order item:', updateError);
            return NextResponse.json(
                { error: 'Failed to update pre-order item' },
                { status: 500 }
            );
        }

        // If status is 'fulfilled', we might want to update order status
        // Get all items for this order to check if we should update order status
        const { data: allItems } = await supabase
            .from('order_items')
            .select('id, is_preorder, preorder_status')
            .eq('order_id', orderId);

        if (allItems) {
            const preorderItems = allItems.filter(item => item.is_preorder);
            const allFulfilled = preorderItems.every(item => item.preorder_status === 'fulfilled');
            const allReady = preorderItems.every(item => 
                item.preorder_status === 'ready' || item.preorder_status === 'fulfilled'
            );

            // Update order status if appropriate
            if (allFulfilled) {
                await supabase
                    .from('orders')
                    .update({ status: 'completed' })
                    .eq('id', orderId);
            } else if (allReady && preorder_status === 'ready') {
                await supabase
                    .from('orders')
                    .update({ status: 'processing' })
                    .eq('id', orderId);
            }
        }

        return NextResponse.json({
            success: true,
            item: updatedItem,
            message: `Pre-order status updated to ${preorder_status}`,
        });

    } catch (error) {
        console.error('Error in preorder item update endpoint:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
