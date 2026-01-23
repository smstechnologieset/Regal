import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, forbiddenResponse, unauthorizedResponse } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    // Check if this is a validation request (public endpoint)
    const searchParams = request.nextUrl.searchParams;
    const isValidation = searchParams.get('action') === 'validate';
    
    if (isValidation) {
        // Public validation endpoint - no auth required
        try {
            const code = searchParams.get('code');
            const subtotal = parseFloat(searchParams.get('subtotal') || '0');

            if (!code) {
                return NextResponse.json(
                    { success: false, error: 'Promo code is required' },
                    { status: 400 }
                );
            }

            const supabase = await createClient();
            const { data: promo, error } = await supabase
                .from('promo_codes')
                .select('*')
                .eq('code', code.toUpperCase())
                .single();

            if (error || !promo) {
                return NextResponse.json(
                    { success: false, error: 'Invalid promo code' },
                    { status: 404 }
                );
            }

            if (!promo.is_active) {
                return NextResponse.json(
                    { success: false, error: 'This promo code is no longer active' },
                    { status: 400 }
                );
            }

            if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
                return NextResponse.json(
                    { success: false, error: 'This promo code has expired' },
                    { status: 400 }
                );
            }

            if (promo.max_uses && promo.usage_count >= promo.max_uses) {
                return NextResponse.json(
                    { success: false, error: 'This promo code has reached its usage limit' },
                    { status: 400 }
                );
            }

            if (promo.min_order_amount && subtotal < promo.min_order_amount) {
                return NextResponse.json(
                    {
                        success: false,
                        error: `Minimum order amount of ${promo.min_order_amount} required`
                    },
                    { status: 400 }
                );
            }

            let discountAmount = 0;
            if (promo.discount_type === 'percentage') {
                discountAmount = (subtotal * promo.discount_value) / 100;
                if (promo.max_discount_amount && discountAmount > promo.max_discount_amount) {
                    discountAmount = promo.max_discount_amount;
                }
            } else if (promo.discount_type === 'fixed') {
                discountAmount = promo.discount_value;
            }

            discountAmount = Math.min(discountAmount, subtotal);

            return NextResponse.json({
                success: true,
                promo: {
                    code: promo.code,
                    discount_amount: discountAmount,
                    discount_type: promo.discount_type,
                    discount_value: promo.discount_value
                }
            });
        } catch (error) {
            console.error('Error validating promo code:', error);
            return NextResponse.json(
                { success: false, error: 'Failed to validate promo code' },
                { status: 500 }
            );
        }
    }

    // Admin endpoint - requires authentication
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
