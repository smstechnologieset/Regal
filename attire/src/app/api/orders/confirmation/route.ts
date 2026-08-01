export const runtime = 'nodejs';

/**
 * POST /api/orders/confirmation
 *
 * Sends an order-confirmation email for an order the caller owns. Best-effort:
 * returns { sent: false } (not an error) when email isn't configured, so the
 * checkout flow never breaks on email failures.
 *
 * Body: { orderId: string, email?: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail, renderOrderConfirmation, OrderConfirmationItem } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { orderId, email } = await request.json();
    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    // Require an authenticated user who owns the order.
    const authClient = await createServerClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: order, error: orderError } = await admin
      .from('orders')
      .select('id, user_id, total, discount_amount, details, shipping_address')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    if (order.user_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Resolve recipient + name. Prefer explicit body email, then shipping
    // address, then the account email.
    const shipping = (order.shipping_address as Record<string, any>) || {};
    const recipient = email || shipping.email || user.email;
    const customerName = shipping.fullName || undefined;

    // Reconstruct line items from the order details snapshot.
    const rawItems = Array.isArray(order.details) ? order.details : [];
    const items: OrderConfirmationItem[] = rawItems.map((it: any) => ({
      name: it.productName || it.product?.name || it.name || 'Item',
      quantity: it.quantity || 1,
      price: it.price || 0,
      isPreorder: !!it.isPreorder,
    }));

    const subtotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
    const discount = order.discount_amount || 0;
    const total = order.total || 0;
    const shippingCost = Math.max(0, total - subtotal + discount);

    const { subject, html } = renderOrderConfirmation({
      orderId: order.id,
      customerName,
      items,
      subtotal,
      shipping: shippingCost,
      discount,
      total,
    });

    const sent = await sendEmail({ to: recipient, subject, html });
    return NextResponse.json({ sent });
  } catch (error) {
    console.error('Error sending order confirmation:', error);
    // Never surface as a hard failure to the checkout flow.
    return NextResponse.json({ sent: false }, { status: 200 });
  }
}
