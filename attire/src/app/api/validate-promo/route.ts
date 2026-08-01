export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { enforceRateLimit } from '@/lib/rate-limit';

// Uniform response for any code that can't be applied, so this endpoint can't
// be used to enumerate which codes exist or their exact state.
const INVALID = { success: false, error: 'This promo code is invalid or has expired' };

function formatEtb(amount: number): string {
  return `ETB ${amount.toFixed(2)}`;
}

export async function GET(request: NextRequest) {
  // Rate limit to prevent brute-force enumeration of promo codes.
  const limited = enforceRateLimit(request, 'validate-promo', 20, 60_000);
  if (limited) return limited;

  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const subtotalStr = searchParams.get('subtotal');

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Promo code is required' },
        { status: 400 }
      );
    }

    const parsed = parseFloat(subtotalStr || '0');
    const subtotal = Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
    const supabase = await createClient();

    const { data: promo, error } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    // Non-existent, inactive, not-yet-active, expired, and used-up codes all
    // return the same message (and 400) so existence can't be inferred.
    if (error || !promo) {
      return NextResponse.json(INVALID, { status: 400 });
    }
    if (!promo.is_active) {
      return NextResponse.json(INVALID, { status: 400 });
    }
    if (promo.start_date && new Date(promo.start_date) > new Date()) {
      return NextResponse.json(INVALID, { status: 400 });
    }
    if (promo.end_date && new Date(promo.end_date) < new Date()) {
      return NextResponse.json(INVALID, { status: 400 });
    }
    if (promo.usage_limit && promo.usage_count >= promo.usage_limit) {
      return NextResponse.json(INVALID, { status: 400 });
    }

    // Minimum purchase is a genuine "valid code, add more to cart" nudge, so we
    // keep a helpful message here.
    if (promo.min_purchase && subtotal < promo.min_purchase) {
      return NextResponse.json(
        {
          success: false,
          error: `This promo code requires a minimum purchase of ${formatEtb(promo.min_purchase)}. Your current subtotal is ${formatEtb(subtotal)}.`,
        },
        { status: 400 }
      );
    }

    // Calculate discount
    let discountAmount = 0;
    if (promo.discount_type === 'percentage') {
      discountAmount = (subtotal * promo.discount_value) / 100;
    } else if (promo.discount_type === 'fixed') {
      discountAmount = promo.discount_value;
    }

    // Ensure discount doesn't exceed subtotal
    discountAmount = Math.min(discountAmount, subtotal);

    return NextResponse.json({
      success: true,
      promo: {
        code: promo.code,
        discount_amount: discountAmount,
        discount_type: promo.discount_type,
        discount_value: promo.discount_value,
      },
    });
  } catch (error) {
    console.error('Error validating promo code:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to validate promo code' },
      { status: 500 }
    );
  }
}
