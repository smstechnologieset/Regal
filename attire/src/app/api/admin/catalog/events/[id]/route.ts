/**
 * Admin Events Catalog API (Single Package)
 * 
 * PATCH /api/admin/catalog/events/[id] - Update event package
 * DELETE /api/admin/catalog/events/[id] - Delete event package
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
            .from('event_packages')
            .update(body)
            .eq('id', id)
            .select()
            .single();

        if (dbError) throw dbError;
        return NextResponse.json({ package: data });
    } catch (error) {
        console.error('Error updating event package:', error);
        return NextResponse.json({ error: 'Failed to update package' }, { status: 500 });
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
            .from('event_packages')
            .delete()
            .eq('id', id);

        if (dbError) throw dbError;
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting event package:', error);
        return NextResponse.json({ error: 'Failed to delete package' }, { status: 500 });
    }
}
