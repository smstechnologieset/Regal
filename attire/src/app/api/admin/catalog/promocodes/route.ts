export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, forbiddenResponse, unauthorizedResponse } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { pick, ALLOWED_FIELDS } from '@/lib/sanitize';

// NOTE: Public promo validation lives at GET /api/validate-promo. This route is
// admin-only (list + create). The previous inline `?action=validate` branch was
// removed — it referenced columns that don't exist in the schema.

export async function GET() {
    const { isAdmin, userId, error: authError } = await verifyAdmin();
    if (!userId) return unauthorizedResponse(authError);
    if (!isAdmin) return forbiddenResponse(authError);

    try {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('promo_codes')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ promoCodes: data });
    } catch (error) {
        console.error('Error fetching promo codes:', error);
        return NextResponse.json({ error: 'Failed to fetch promo codes' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const { isAdmin, userId, error: authError } = await verifyAdmin();
    if (!userId) return unauthorizedResponse(authError);
    if (!isAdmin) return forbiddenResponse(authError);

    try {
        const supabase = createAdminClient();
        const body = await req.json();
        const payload = pick(body, ALLOWED_FIELDS.promoCode);

        if (payload.code) {
            payload.code = String(payload.code).toUpperCase();
        }

        const { data, error } = await supabase
            .from('promo_codes')
            .insert([payload])
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                return NextResponse.json({ error: 'A promo code with that code already exists' }, { status: 409 });
            }
            throw error;
        }

        return NextResponse.json({ promoCode: data });
    } catch (error) {
        console.error('Error creating promo code:', error);
        return NextResponse.json({ error: 'Failed to create promo code' }, { status: 500 });
    }
}
