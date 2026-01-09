/**
 * Admin Catering Catalog API (Menu Items)
 * 
 * GET /api/admin/catalog/catering/items - List menu items
 * POST /api/admin/catalog/catering/items - Create menu item
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
            .from('menu_items')
            .select('*')
            .order('name', { ascending: true });

        if (dbError) throw dbError;
        return NextResponse.json({ items: data || [] });
    } catch (error) {
        console.error('Error fetching menu items:', error);
        return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
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
            .from('menu_items')
            .insert(body)
            .select()
            .single();

        if (dbError) throw dbError;
        return NextResponse.json({ item: data });
    } catch (error) {
        console.error('Error creating menu item:', error);
        return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
    }
}
