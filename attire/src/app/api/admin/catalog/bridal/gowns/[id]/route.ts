export const runtime = "nodejs";

/**
 * Admin Bridal Catalog API (Single Gown)
 * 
 * PATCH /api/admin/catalog/bridal/gallery/[id] - Update bridal gown
 * DELETE /api/admin/catalog/bridal/gallery/[id] - Delete bridal gown
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
            .from('bridal_gowns')
            .update(pick(body, ALLOWED_FIELDS.bridalGown))
            .eq('id', id)
            .select()
            .single();

        if (dbError) {
            if (dbError.code === '23505') {
                return NextResponse.json({ error: 'Slug already exists on another gown' }, { status: 400 });
            }
            throw dbError;
        }
        return NextResponse.json({ gown: data });
    } catch (error: any) {
        console.error('Error updating bridal gown:', error);
        return NextResponse.json({ error: error.message || 'Failed to update gown' }, { status: 500 });
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
            .from('bridal_gowns')
            .delete()
            .eq('id', id);

        if (dbError) throw dbError;
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting bridal gown:', error);
        return NextResponse.json({ error: error.message || 'Failed to delete gown' }, { status: 500 });
    }
}
