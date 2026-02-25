export const runtime = "nodejs";

/**
 * Admin Gift Packages Catalog API (Single Package)
 * 
 * PATCH /api/admin/catalog/gifts/[id] - Update gift package
 * DELETE /api/admin/catalog/gifts/[id] - Delete gift package
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
            .from('gift_packages')
            .update(body)
            .eq('id', id)
            .select()
            .single();

        if (dbError) {
            if (dbError.code === '23505') {
                return NextResponse.json({ error: 'ID already exists on another package' }, { status: 400 });
            }
            throw dbError;
        }
        return NextResponse.json({ package: data });
    } catch (error: any) {
        console.error('Error updating gift package:', error);
        return NextResponse.json({ error: error.message || 'Failed to update package' }, { status: 500 });
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
            .from('gift_packages')
            .delete()
            .eq('id', id);

        if (dbError) throw dbError;
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting gift package:', error);
        return NextResponse.json({ error: error.message || 'Failed to delete package' }, { status: 500 });
    }
}
