export const runtime = "nodejs";

/**
 * Admin Pre-Orders API
 * 
 * GET /api/admin/attire/preorders - Query pre-orders with filtering
 * Requirements: 4.3, 4.4, 9.1, 9.2, 9.3, 9.4, 9.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, forbiddenResponse, unauthorizedResponse } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
    const { isAdmin, userId, error } = await verifyAdmin();
    if (!userId) return unauthorizedResponse(error);
    if (!isAdmin) return forbiddenResponse(error);

    try {
        const supabase = createAdminClient();
        const { searchParams } = new URL(request.url);

        // Parse query parameters (clamped to safe ranges)
        const status = searchParams.get('status') || 'all';
        const productId = searchParams.get('product_id');
        const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1);
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20') || 20));

        // Build query
        let query = supabase
            .from('order_items')
            .select(`
                id,
                order_id,
                product_id,
                quantity,
                price,
                selected_size,
                selected_color,
                preorder_status,
                estimated_delivery_date,
                created_at,
                orders!inner (
                    id,
                    created_at,
                    user_id
                ),
                products!inner (
                    id,
                    name,
                    images
                )
            `, { count: 'exact' })
            .eq('is_preorder', true);

        // Apply filters
        if (status !== 'all') {
            query = query.eq('preorder_status', status);
        }

        if (productId) {
            query = query.eq('product_id', productId);
        }

        // Order by creation date (newest first)
        query = query.order('created_at', { ascending: false });

        // Apply pagination
        const from = (page - 1) * limit;
        const to = from + limit - 1;
        query = query.range(from, to);

        const { data, error: queryError, count } = await query;

        if (queryError) {
            console.error('Error fetching pre-orders:', queryError);
            console.error('Query error details:', JSON.stringify(queryError, null, 2));
            throw queryError;
        }
        
        console.log('Pre-orders query successful, found:', data?.length || 0, 'items');

        // Fetch customer info for all orders. Names/phone come from `profiles`
        // (there is no public `users` table); emails live in auth and are
        // fetched best-effort per user (page size keeps this bounded).
        const userIds = [...new Set((data || []).map((item: any) => item.orders.user_id))];

        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, phone')
            .in('id', userIds);
        const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

        const emailMap = new Map<string, string>();
        await Promise.all(
            userIds.map(async (uid) => {
                try {
                    const { data: authUser } = await supabase.auth.admin.getUserById(uid as string);
                    if (authUser?.user?.email) emailMap.set(uid as string, authUser.user.email);
                } catch {
                    // best-effort; ignore lookup failures
                }
            })
        );

        // Transform data to match expected format
        const preorders = (data || []).map((item: any) => {
            const profile = profileMap.get(item.orders.user_id) as any;
            // Use first 8 characters of order_id as order number
            const orderNumber = item.order_id.substring(0, 8).toUpperCase();
            return {
                id: item.id,
                order_id: item.order_id,
                order_number: orderNumber,
                customer_name: profile?.full_name || 'Unknown',
                customer_email: emailMap.get(item.orders.user_id) || profile?.phone || 'Unknown',
                customer_phone: profile?.phone || null,
                product_id: item.product_id,
                product_name: item.products.name,
                product_image: item.products.images?.[0] || null,
                size: item.selected_size,
                color: item.selected_color,
                quantity: item.quantity,
                price: item.price,
                preorder_status: item.preorder_status,
                estimated_delivery_date: item.estimated_delivery_date,
                order_date: item.orders.created_at,
                created_at: item.created_at,
            };
        });

        return NextResponse.json({
            preorders,
            total: count || 0,
            page,
            limit,
            totalPages: Math.ceil((count || 0) / limit),
        });

    } catch (error) {
        console.error('Error in preorders endpoint:', error);
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        return NextResponse.json(
            { error: 'Failed to fetch pre-orders', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}
