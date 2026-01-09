/**
 * Admin Attire Catalog API (Single Product)
 * 
 * PATCH /api/admin/catalog/attire/products/[id] - Update product
 * DELETE /api/admin/catalog/attire/products/[id] - Delete product
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, forbiddenResponse, unauthorizedResponse } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';

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

        const { data, error: dbError } = await supabase
            .from('products')
            .update(body)
            .eq('id', id)
            .select()
            .single();

        if (dbError) throw dbError;
        return NextResponse.json({ product: data });
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
