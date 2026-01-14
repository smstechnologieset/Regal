export const runtime = "nodejs";

/**
 * Admin Bridal Catalog API (Single Service)
 * 
 * PATCH /api/admin/catalog/bridal/services/[id] - Update bridal service
 * DELETE /api/admin/catalog/bridal/services/[id] - Delete bridal service
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
            .from('bridal_services')
            .update(body)
            .eq('id', id)
            .select()
            .single();

        if (dbError) {
            if (dbError.code === '23505') {
                return NextResponse.json({ error: 'Service ID already exists' }, { status: 400 });
            }
            throw dbError;
        }
        return NextResponse.json({ service: data });
    } catch (error: any) {
        console.error('Error updating bridal service:', error);
        return NextResponse.json({ error: error.message || 'Failed to update service' }, { status: 500 });
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
            .from('bridal_services')
            .delete()
            .eq('id', id);

        if (dbError) throw dbError;
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting bridal service:', error);
        return NextResponse.json({ error: error.message || 'Failed to delete service' }, { status: 500 });
    }
}
