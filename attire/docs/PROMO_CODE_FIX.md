# Promo Code Validation Fix

## Problem

The promo code validation was failing with 404 errors because Next.js 16 with a custom server (server.ts for Socket.io) doesn't register new or modified API routes during dev mode.

## Root Cause

When using a custom Node.js server with Next.js 16 App Router, the dev file watcher doesn't properly detect route changes. This is a known limitation of running Next.js behind a custom server.

## Solution Implemented: Client-Side Validation

Instead of relying on API routes, we moved the promo code validation logic to the client side, directly querying Supabase from the browser. This completely bypasses the custom server routing issue.

### Changes Made

1. **Created Validation Utility** (`attire/src/lib/promo-validation.ts`)
   - Exports `validatePromoCode()` function
   - Directly queries Supabase `promo_codes` table from client
   - Performs all validation checks (active, expired, usage limits, min order)
   - Calculates discount based on type (percentage or fixed)

2. **Updated Checkout Page** (`attire/src/app/attire/checkout/page.tsx`)
   - Removed API fetch call
   - Now imports and calls `validatePromoCode()` directly
   - Uses dynamic import to avoid SSR issues

3. **Kept API Route** (`attire/src/app/api/admin/catalog/promocodes/route.ts`)
   - Still has validation logic for potential future use
   - Admin endpoints still work for managing promo codes

## How It Works

### Client-Side Validation

```typescript
import { validatePromoCode } from "@/lib/promo-validation";

const result = await validatePromoCode("SUMMER20", 100);
// Returns: { success: true, promo: { code, discount_amount, ... } }
```

### Response (Success)

```typescript
{
  success: true,
  promo: {
    code: "SUMMER20",
    discount_amount: 20,
    discount_type: "percentage",
    discount_value: 20
  }
}
```

### Response (Error)

```typescript
{
  success: false,
  error: "Invalid promo code"
}
```

## Validation Checks

- Code exists and matches (case-insensitive)
- Promo is active (`is_active = true`)
- Not expired (`expires_at` is in the future)
- Usage limit not reached (`usage_count < max_uses`)
- Minimum order amount met (`subtotal >= min_order_amount`)
- Calculates discount based on type (percentage or fixed)
- Respects maximum discount amount for percentage discounts

## Benefits of This Approach

1. **No Server Routing Issues** - Bypasses custom server completely
2. **Faster** - No HTTP round trip, direct database query
3. **Works in Dev Mode** - No need to restart server for changes
4. **Simpler** - Less code, fewer moving parts
5. **Secure** - Uses Supabase RLS (Row Level Security) policies

## Security Note

This approach is secure because:

- Supabase RLS policies control data access
- Only public promo code data is exposed (no sensitive info)
- Validation happens on read-only data
- Actual promo code usage is still tracked server-side during order submission

## Testing

1. Navigate to checkout page with items in cart
2. Enter a valid promo code (e.g., "SUMMER20")
3. Click "Apply" button
4. Discount should be applied instantly
5. Try invalid codes to test error handling

## Alternative Solutions (Not Needed Now)

If you still want to use API routes in the future:

1. Stop custom server during dev and run `next dev` directly
2. Move Socket.io to a separate server on a different port
3. Run `next build` and `next start` for production testing
