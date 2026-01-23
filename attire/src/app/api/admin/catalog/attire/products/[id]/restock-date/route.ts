import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * PATCH /api/admin/catalog/attire/products/:id/restock-date
 * 
 * Update product restock date and notify customers with pending pre-orders
 * Requirements: 4.6, 4.8
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { estimated_restock_date, estimated_delivery_days } = body;

    if (!estimated_restock_date) {
      return NextResponse.json(
        { error: 'estimated_restock_date is required' },
        { status: 400 }
      );
    }

    // Update product
    const { data: product, error: updateError } = await supabase
      .from('products')
      .update({
        estimated_restock_date,
        estimated_delivery_days: estimated_delivery_days || null,
      })
      .eq('id', id)
      .select('id, name, estimated_restock_date, estimated_delivery_days')
      .single();

    if (updateError || !product) {
      console.error('Error updating product:', updateError);
      return NextResponse.json(
        { error: 'Failed to update product' },
        { status: 500 }
      );
    }

    // Find all customers with pending pre-orders for this product
    const { data: preorderItems, error: preorderError } = await supabase
      .from('order_items')
      .select(`
        id,
        order_id,
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
      .eq('product_id', id)
      .eq('is_preorder', true)
      .eq('preorder_status', 'pending');

    if (preorderError) {
      console.error('Error fetching pre-orders:', preorderError);
      // Don't fail the request if notification lookup fails
    }

    let notifiedCount = 0;

    // Create notifications for each customer
    if (preorderItems && preorderItems.length > 0) {
      const uniqueUsers = new Map();
      
      // Deduplicate users (a user might have multiple pre-orders for same product)
      for (const item of preorderItems) {
        const order = item.orders as any;
        if (order?.user_id) {
          uniqueUsers.set(order.user_id, {
            userId: order.user_id,
            orderId: order.id,
          });
        }
      }

      // Create notifications
      const notifications = Array.from(uniqueUsers.values()).map(({ userId, orderId }) => ({
        user_id: userId,
        type: 'preorder_update',
        title: 'Pre-Order Update',
        message: `Your pre-order for "${product.name}" has an updated restock date: ${new Date(estimated_restock_date).toLocaleDateString()}`,
        link: `/account/orders/${orderId}`,
        read: false,
      }));

      const { error: notifError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (notifError) {
        console.error('Error creating notifications:', notifError);
      } else {
        notifiedCount = notifications.length;
      }
    }

    return NextResponse.json({
      success: true,
      product,
      notifiedCustomers: notifiedCount,
      message: `Restock date updated. ${notifiedCount} customer(s) notified.`,
    });

  } catch (error) {
    console.error('Error in restock-date endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
