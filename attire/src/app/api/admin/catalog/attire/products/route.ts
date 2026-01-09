/**
 * Admin Attire Catalog API (Products)
 * 
 * GET /api/admin/catalog/attire/products - List all products
 * POST /api/admin/catalog/attire/products - Create new product
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
        const { data, error: dbError } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

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
        const supabase = createAdminClient();

        const { data, error: dbError } = await supabase
            .from('products')
            .insert(body)
            .select()
            .single();

        if (dbError) throw dbError;
        return NextResponse.json({ product: data });
    } catch (error) {
        console.error('Error creating attire product:', error);
        return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
    }
}
