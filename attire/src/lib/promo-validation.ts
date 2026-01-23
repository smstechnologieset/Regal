/**
 * Client-side promo code validation
 * 
 * This bypasses the API route issue with custom server by directly
 * querying Supabase from the client.
 */

import { createClient } from '@/lib/supabase/client';

export interface PromoValidationResult {
  success: boolean;
  error?: string;
  promo?: {
    code: string;
    discount_amount: number;
    discount_type: string;
    discount_value: number;
  };
}

export async function validatePromoCode(
  code: string,
  subtotal: number
): Promise<PromoValidationResult> {
  try {
    if (!code.trim()) {
      return {
        success: false,
        error: 'Promo code is required',
      };
    }

    const supabase = createClient();
    const { data: promo, error } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (error || !promo) {
      return {
        success: false,
        error: 'Invalid promo code',
      };
    }

    if (!promo.is_active) {
      return {
        success: false,
        error: 'This promo code is no longer active',
      };
    }

    // Check if promo has started
    if (promo.start_date && new Date(promo.start_date) > new Date()) {
      return {
        success: false,
        error: 'This promo code is not yet active',
      };
    }

    // Check if promo has expired
    if (promo.end_date && new Date(promo.end_date) < new Date()) {
      return {
        success: false,
        error: 'This promo code has expired',
      };
    }

    // Check usage limit
    if (promo.usage_limit && promo.usage_count >= promo.usage_limit) {
      return {
        success: false,
        error: 'This promo code has reached its usage limit',
      };
    }

    // Check minimum purchase amount
    if (promo.min_purchase && subtotal < promo.min_purchase) {
      return {
        success: false,
        error: `Minimum order amount of $${promo.min_purchase} required`,
      };
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

    return {
      success: true,
      promo: {
        code: promo.code,
        discount_amount: discountAmount,
        discount_type: promo.discount_type,
        discount_value: promo.discount_value,
      },
    };
  } catch (error) {
    console.error('Error validating promo code:', error);
    return {
      success: false,
      error: 'Failed to validate promo code',
    };
  }
}
