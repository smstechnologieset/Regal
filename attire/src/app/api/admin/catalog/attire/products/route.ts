export const runtime = "nodejs";

/**
 * Admin Attire Catalog API (Products)
 * 
 * GET /api/admin/catalog/attire/products - List all products
 * POST /api/admin/catalog/attire/products - Create new product
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, forbiddenResponse, unauthorizedResponse } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { pick, ALLOWED_FIELDS } from '@/lib/sanitize';

export async function GET(request: NextRequest) {
    const { isAdmin, userId, error } = await verifyAdmin();
    if (!userId) return unauthorizedResponse(error);
    if (!isAdmin) return forbiddenResponse(error);

    try {
        const supabase = createAdminClient();
        const serviceParam = request.nextUrl.searchParams.get('service') || request.nextUrl.searchParams.get('category');

        let query = supabase.from('products').select('*');
        if (serviceParam && ['skincare', 'toys', 'journals'].includes(serviceParam)) {
            query = query.eq('category', serviceParam);
        } else {
            // For attire, exclude products belonging to other standalone services
            query = query.not('category', 'in', '("skincare","toys","journals")');
        }

        const { data, error: dbError } = await query.order('created_at', { ascending: false });

        if (dbError) throw dbError;
        return NextResponse.json({ products: data || [] });
    } catch (error) {
        console.error('Error fetching attire products:', error);
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const { isAdmin, userId, error } = await verifyAdmin();
    if (!userId) return unauthorizedResponse(error);
    if (!isAdmin) return forbiddenResponse(error);

    try {
        const body = await request.json();
        const payload = pick(body, ALLOWED_FIELDS.product);
        const supabase = createAdminClient();

        // Enforce inventory consistency
        if (payload.stock_count !== undefined) {
            const stock = Number(payload.stock_count) || 0;
            if (stock > 0) {
                payload.in_stock = payload.in_stock !== undefined ? Boolean(payload.in_stock) : true;
            } else {
                payload.in_stock = false;
            }
        }

        const { data, error: dbError } = await supabase
            .from('products')
            .insert(payload)
            .select()
            .single();

        if (dbError) throw dbError;
        return NextResponse.json({ product: data });
    } catch (error) {
        console.error('Error creating attire product:', error);
        return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
    }
}
