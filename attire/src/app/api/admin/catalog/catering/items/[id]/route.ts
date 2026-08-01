export const runtime = "nodejs";

/**
 * Admin Catering Catalog API (Single Menu Item)
 * 
 * PATCH /api/admin/catalog/catering/items/[id] - Update menu item
 * DELETE /api/admin/catalog/catering/items/[id] - Delete menu item
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, forbiddenResponse, unauthorizedResponse } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { pick, ALLOWED_FIELDS } from '@/lib/sanitize';

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
            .from('menu_items')
            .update(pick(body, ALLOWED_FIELDS.menuItem))
            .eq('id', id)
            .select()
            .single();

        if (dbError) {
            if (dbError.code === '23505') {
                return NextResponse.json({ error: 'Slug already exists on another item' }, { status: 400 });
            }
            throw dbError;
        }
        return NextResponse.json({ item: data });
    } catch (error: any) {
        console.error('Error updating menu item:', error);
        return NextResponse.json({ error: error.message || 'Failed to update item' }, { status: 500 });
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
            .from('menu_items')
            .delete()
            .eq('id', id);

        if (dbError) throw dbError;
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting menu item:', error);
        return NextResponse.json({ error: error.message || 'Failed to delete item' }, { status: 500 });
    }
}
