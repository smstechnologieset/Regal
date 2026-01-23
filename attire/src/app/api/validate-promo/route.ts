import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
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

    const subtotal = parseFloat(subtotalStr || '0');
    const supabase = await createClient();
    
    const { data: promo, error } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (error || !promo) {
      return NextResponse.json(
        { success: false, error: 'Promo code does not exist' },
        { status: 404 }
      );
    }

    if (!promo.is_active) {
      return NextResponse.json(
        { success: false, error: 'This promo code is no longer active' },
        { status: 400 }
      );
    }

    // Check if promo has started
    if (promo.start_date && new Date(promo.start_date) > new Date()) {
      return NextResponse.json(
        { success: false, error: 'This promo code is not yet active' },
        { status: 400 }
      );
    }

    // Check if promo has expired
    if (promo.end_date && new Date(promo.end_date) < new Date()) {
      return NextResponse.json(
        { success: false, error: 'This promo code has expired' },
        { status: 400 }
      );
    }

    // Check usage limit
    if (promo.usage_limit && promo.usage_count >= promo.usage_limit) {
      return NextResponse.json(
        { success: false, error: 'This promo code has exceeded its usage limit' },
        { status: 400 }
      );
    }

    // Check minimum purchase amount
    if (promo.min_purchase && subtotal < promo.min_purchase) {
      return NextResponse.json(
        {
          success: false,
          error: `This promo code requires a minimum purchase of $${promo.min_purchase.toFixed(2)}. Your current subtotal is $${subtotal.toFixed(2)}.`
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
