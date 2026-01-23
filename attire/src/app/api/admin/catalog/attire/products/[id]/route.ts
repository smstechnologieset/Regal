export const runtime = "nodejs";

/**
 * Admin Attire Catalog API (Single Product)
 * 
 * PATCH /api/admin/catalog/attire/products/[id] - Update product
 * DELETE /api/admin/catalog/attire/products/[id] - Delete product
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, forbiddenResponse, unauthorizedResponse } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Handle stock arrival for pre-orders with FIFO reservation
 * Requirements: 4.1, 4.2, 5.1, 5.2, 5.3, 5.4, 7.1, 7.2, 7.3, 7.4
 */
async function handleStockArrival(productId: string, productName: string, previousStock: number, newStock: number) {
    // Only trigger if stock changed from 0 to positive
    if (previousStock > 0 || newStock <= 0) {
        return { notifiedCount: 0, insufficientStock: false, fulfilledCount: 0, unfulfilledCount: 0 };
    }

    const supabase = createAdminClient();

    // Find all pending pre-orders for this product, ordered by created_at (FIFO)
    const { data: preorderItems, error: preorderError } = await supabase
        .from('order_items')
        .select(`
            id,
            order_id,
            quantity,
            created_at,
            orders!inner (
                id,
                user_id,
                users!inner (
                    id,
                    email,
                    full_name
                )
            )
        `)
        .eq('product_id', productId)
        .eq('is_preorder', true)
        .eq('preorder_status', 'pending')
        .order('created_at', { ascending: true }); // FIFO queue

    if (preorderError) {
        console.error('Error fetching pre-orders:', preorderError);
        return { notifiedCount: 0, insufficientStock: false, fulfilledCount: 0, unfulfilledCount: 0 };
    }

    if (!preorderItems || preorderItems.length === 0) {
        return { notifiedCount: 0, insufficientStock: false, fulfilledCount: 0, unfulfilledCount: 0 };
    }

    // Calculate total pre-order demand
    const totalDemand = preorderItems.reduce((sum, item) => sum + item.quantity, 0);
    const availableStock = newStock;
    const insufficientStock = totalDemand > availableStock;

    // Reserve stock in FIFO order
    let remainingStock = availableStock;
    const fulfilledItems: string[] = [];
    const partiallyFulfilledItems: string[] = [];
    const unfulfilledItems: string[] = [];
    const notificationData: Array<{
        userId: string;
        orderId: string;
        status: 'ready' | 'insufficient';
        requestedQty: number;
        availableQty: number;
    }> = [];

    for (const item of preorderItems) {
        const order = item.orders as any;
        
        if (remainingStock >= item.quantity) {
            // Full fulfillment
            fulfilledItems.push(item.id);
            remainingStock -= item.quantity;
            
            if (order?.user_id) {
                notificationData.push({
                    userId: order.user_id,
                    orderId: order.id,
                    status: 'ready',
                    requestedQty: item.quantity,
                    availableQty: item.quantity,
                });
            }
        } else if (remainingStock > 0) {
            // Partial fulfillment (not implemented - treat as unfulfilled)
            unfulfilledItems.push(item.id);
            
            if (order?.user_id) {
                notificationData.push({
                    userId: order.user_id,
                    orderId: order.id,
                    status: 'insufficient',
                    requestedQty: item.quantity,
                    availableQty: remainingStock,
                });
            }
            
            remainingStock = 0;
        } else {
            // No stock remaining
            unfulfilledItems.push(item.id);
            
            if (order?.user_id) {
                notificationData.push({
                    userId: order.user_id,
                    orderId: order.id,
                    status: 'insufficient',
                    requestedQty: item.quantity,
                    availableQty: 0,
                });
            }
        }
    }

    // Update fulfilled pre-orders to 'ready'
    if (fulfilledItems.length > 0) {
        const { error: updateError } = await supabase
            .from('order_items')
            .update({ preorder_status: 'ready' })
            .in('id', fulfilledItems);

        if (updateError) {
            console.error('Error updating pre-order status:', updateError);
        }

        // Update order status to 'processing' for orders with ready pre-orders
        const fulfilledOrderIds = [...new Set(
            preorderItems
                .filter(item => fulfilledItems.includes(item.id))
                .map(item => item.order_id)
        )];
        
        const { error: orderUpdateError } = await supabase
            .from('orders')
            .update({ status: 'processing' })
            .in('id', fulfilledOrderIds)
            .eq('status', 'pending');

        if (orderUpdateError) {
            console.error('Error updating order status:', orderUpdateError);
        }
    }

    // Create notifications (deduplicated by user)
    const uniqueNotifications = new Map<string, typeof notificationData[0]>();
    for (const data of notificationData) {
        // Keep the first notification per user (FIFO priority)
        if (!uniqueNotifications.has(data.userId)) {
            uniqueNotifications.set(data.userId, data);
        }
    }

    const notifications = Array.from(uniqueNotifications.values()).map((data) => {
        if (data.status === 'ready') {
            return {
                user_id: data.userId,
                type: 'preorder_ready',
                title: 'Your pre-order is ready!',
                message: `${productName} is now in stock and your order is being processed.`,
                link: `/account/orders/${data.orderId}`,
                read: false,
            };
        } else {
            return {
                user_id: data.userId,
                type: 'preorder_insufficient_stock',
                title: 'Pre-order stock update',
                message: `${productName} has arrived, but there is insufficient stock to fulfill your pre-order at this time. You requested ${data.requestedQty} but only ${data.availableQty} are available. We will notify you when more stock arrives.`,
                link: `/account/orders/${data.orderId}`,
                read: false,
            };
        }
    });

    const { error: notifError } = await supabase
        .from('notifications')
        .insert(notifications);

    if (notifError) {
        console.error('Error creating notifications:', notifError);
    }

    return { 
        notifiedCount: notifications.length,
        insufficientStock,
        fulfilledCount: fulfilledItems.length,
        unfulfilledCount: unfulfilledItems.length,
    };
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { isAdmin, userId, error } = await verifyAdmin();
    if (!userId) return unauthorizedResponse(error);
    if (!isAdmin) return forbiddenResponse(error);

    try {
        const { id } = await params;
        const body = await request.json();
        const supabase = createAdminClient();

        // Get current product state before update
        const { data: currentProduct } = await supabase
            .from('products')
            .select('stock_count, name')
            .eq('id', id)
            .single();

        // Update product
        const { data, error: dbError } = await supabase
            .from('products')
            .update(body)
            .eq('id', id)
            .select()
            .single();

        if (dbError) throw dbError;

        // Check if stock arrival occurred
        let stockArrivalResult = { 
            notifiedCount: 0, 
            insufficientStock: false, 
            fulfilledCount: 0, 
            unfulfilledCount: 0 
        };
        if (currentProduct && body.stock_count !== undefined) {
            const previousStock = currentProduct.stock_count || 0;
            const newStock = body.stock_count || 0;
            
            stockArrivalResult = await handleStockArrival(
                id,
                currentProduct.name,
                previousStock,
                newStock
            );
        }

        let preorderMessage = undefined;
        if (stockArrivalResult.notifiedCount > 0) {
            if (stockArrivalResult.insufficientStock) {
                preorderMessage = `Stock arrival processed: ${stockArrivalResult.fulfilledCount} pre-order(s) fulfilled, ${stockArrivalResult.unfulfilledCount} awaiting more stock. ${stockArrivalResult.notifiedCount} customer(s) notified.`;
            } else {
                preorderMessage = `${stockArrivalResult.fulfilledCount} pre-order(s) fulfilled. ${stockArrivalResult.notifiedCount} customer(s) notified about stock arrival.`;
            }
        }

        return NextResponse.json({ 
            product: data,
            preorderNotifications: preorderMessage
        });
    } catch (error) {
        console.error('Error updating attire product:', error);
        return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { isAdmin, userId, error } = await verifyAdmin();
    if (!userId) return unauthorizedResponse(error);
    if (!isAdmin) return forbiddenResponse(error);

    try {
        const { id } = await params;
        const supabase = createAdminClient();

        const { error: dbError } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (dbError) throw dbError;
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting attire product:', error);
        return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
    }
}
