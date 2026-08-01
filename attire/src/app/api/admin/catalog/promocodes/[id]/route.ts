import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, forbiddenResponse, unauthorizedResponse } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { pick, ALLOWED_FIELDS } from '@/lib/sanitize';

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { isAdmin, userId, error: authError } = await verifyAdmin();
    if (!userId) return unauthorizedResponse(authError);
    if (!isAdmin) return forbiddenResponse(authError);

    try {
        const supabase = createAdminClient();
        const body = await req.json();
        const { id } = await params;

        const { data, error } = await supabase
            .from('promo_codes')
            .update(pick(body, ALLOWED_FIELDS.promoCode))
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ promoCode: data });
    } catch (error: any) {
        console.error('Error updating promo code:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { isAdmin, userId, error: authError } = await verifyAdmin();
    if (!userId) return unauthorizedResponse(authError);
    if (!isAdmin) return forbiddenResponse(authError);

    try {
        const supabase = createAdminClient();
        const { id } = await params;

        const { error } = await supabase
            .from('promo_codes')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting promo code:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
