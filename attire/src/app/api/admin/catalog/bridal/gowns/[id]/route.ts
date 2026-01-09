/**
 * Admin Bridal Catalog API (Single Gown)
 * 
 * PATCH /api/admin/catalog/bridal/gowns/[id] - Update bridal gown
 * DELETE /api/admin/catalog/bridal/gowns/[id] - Delete bridal gown
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
            .from('bridal_gowns')
            .update(body)
            .eq('id', id)
            .select()
            .single();

        if (dbError) throw dbError;
        return NextResponse.json({ gown: data });
    } catch (error) {
        console.error('Error updating bridal gown:', error);
        return NextResponse.json({ error: 'Failed to update gown' }, { status: 500 });
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
    } catch (error) {
        console.error('Error deleting bridal gown:', error);
        return NextResponse.json({ error: 'Failed to delete gown' }, { status: 500 });
    }
}
