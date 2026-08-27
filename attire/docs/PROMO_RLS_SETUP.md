# Promo Codes RLS Setup

## Issue

The `promo_codes` table has Row Level Security (RLS) enabled but the public read policy wasn't properly created, causing 406 errors when trying to validate promo codes from the client.

## Fix

Run the SQL migration to add the public read policy:

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the file `attire/promo_codes_rls_fix.sql`
4. Copy and paste the SQL into the editor
5. Click **Run** to execute

### Option 2: Command Line

```bash
# If you have Supabase CLI installed
supabase db push --file attire/promo_codes_rls_fix.sql
```

## What This Does

- Drops any existing public read policy
- Creates a new policy allowing anyone to SELECT from `promo_codes` table
- Ensures RLS is enabled on the table

## Verification

After running the SQL, test by:

1. Go to checkout page with items in cart
2. Enter a promo code (e.g., "SALE10")
3. Click "Apply"
4. Should work without 406 errors

## Column Names Fixed

Also updated the validation code to match the actual schema:

- `min_purchase` (not `min_order_amount`)
- `end_date` (not `expires_at`)
- `start_date` (for checking if promo has started)
- `usage_limit` (not `max_uses`)
- Removed `max_discount_amount` (not in schema)
