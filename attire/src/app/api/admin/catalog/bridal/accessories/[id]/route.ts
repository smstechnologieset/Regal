export const runtime = "nodejs";

/**
 * Admin Bridal Catalog API (Single Accessory)
 * 
 * PATCH /api/admin/catalog/bridal/accessories/[id] - Update bridal accessory
 * DELETE /api/admin/catalog/bridal/accessories/[id] - Delete bridal accessory
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
            .from('bridal_accessories')
            .update(body)
            .eq('id', id)
            .select()
            .single();

        if (dbError) {
            if (dbError.code === '23505') {
                return NextResponse.json({ error: 'Slug already exists on another accessory' }, { status: 400 });
            }
            throw dbError;
        }
        return NextResponse.json({ accessory: data });
    } catch (error: any) {
        console.error('Error updating bridal accessory:', error);
        return NextResponse.json({ error: error.message || 'Failed to update accessory' }, { status: 500 });
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
            .from('bridal_accessories')
            .delete()
            .eq('id', id);

        if (dbError) throw dbError;
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting bridal accessory:', error);
        return NextResponse.json({ error: error.message || 'Failed to delete accessory' }, { status: 500 });
    }
}
