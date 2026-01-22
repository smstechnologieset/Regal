import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, forbiddenResponse, unauthorizedResponse } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';

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
    } catch (error: any) {
        console.error('Error fetching promo codes:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const { isAdmin, userId, error: authError } = await verifyAdmin();
    if (!userId) return unauthorizedResponse(authError);
    if (!isAdmin) return forbiddenResponse(authError);

    try {
        const supabase = createAdminClient();
        const body = await req.json();

        const { data, error } = await supabase
            .from('promo_codes')
            .insert([body])
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ promoCode: data });
    } catch (error: any) {
        console.error('Error creating promo code:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
