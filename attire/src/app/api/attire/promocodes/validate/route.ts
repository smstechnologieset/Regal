import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { code, subtotal } = await req.json();

        if (!code) {
            return NextResponse.json({ error: 'Promo code is required' }, { status: 400 });
        }

        // Fetch promo code
        const { data: promo, error } = await supabase
            .from('promo_codes')
            .select('*')
            .eq('code', code.toUpperCase())
            .single();

        if (error || !promo) {
            return NextResponse.json({ error: 'Invalid promo code' }, { status: 404 });
        }

        // Validity Checks
        if (!promo.is_active) {
            return NextResponse.json({ error: 'This promo code is no longer active' }, { status: 400 });
        }

        const now = new Date();
        const startDate = new Date(promo.start_date);
        if (now < startDate) {
            return NextResponse.json({ error: 'This promo code is not yet active' }, { status: 400 });
        }

        if (promo.end_date) {
            const endDate = new Date(promo.end_date);
            if (now > endDate) {
                return NextResponse.json({ error: 'This promo code has expired' }, { status: 400 });
            }
        }

        // Usage Limit Check
        if (promo.usage_limit && promo.usage_count >= promo.usage_limit) {
            return NextResponse.json({ error: 'This promo code has reached its usage limit' }, { status: 400 });
        }

        // Min Purchase Check
        if (subtotal < promo.min_purchase) {
            return NextResponse.json({
                error: `Minimum purchase of $${promo.min_purchase} required for this code`
            }, { status: 400 });
        }

        // Calculate discount
        let discountAmount = 0;
        if (promo.discount_type === 'percentage') {
            discountAmount = (subtotal * promo.discount_value) / 100;
        } else {
            discountAmount = promo.discount_value;
        }

        // Ensure discount doesn't exceed subtotal
        discountAmount = Math.min(discountAmount, subtotal);

        return NextResponse.json({
            success: true,
            promo: {
                id: promo.id,
                code: promo.code,
                discount_type: promo.discount_type,
                discount_value: promo.discount_value,
                discount_amount: parseFloat(discountAmount.toFixed(2))
            }
        });

    } catch (error: any) {
        console.error('Error validating promo code:', error);
        return NextResponse.json({ error: 'Failed to validate promo code' }, { status: 500 });
    }
}
