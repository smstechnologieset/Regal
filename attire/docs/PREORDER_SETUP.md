# Pre-Order System Setup Guide

## Database Migration

### Step 1: Run the Migration

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy and paste the contents of `attire/preorder_migration.sql`
6. Click **Run** (or press Ctrl+Enter)

### Step 2: Verify the Migration

The migration script includes verification queries at the end. You should see output confirming:

- `products` table has new columns: `estimated_restock_date`, `allow_preorder`, `preorder_count`, `estimated_delivery_days`
- `order_items` table was created with columns: `is_preorder`, `preorder_status`, `estimated_delivery_date`
- `orders` table has new columns: `has_preorders`, `preorder_status`

### What the Migration Does

1. **Extends Product Table**
   - Adds fields to track restock dates and pre-order settings
   - Caches pre-order count for performance
   - Stores admin-set estimated delivery days

2. **Creates Order Items Table**
   - New table to properly track individual order items (previously stored in JSONB)
   - Tracks which items are pre-orders
   - Monitors pre-order status (pending → ready → fulfilled)
   - Stores estimated delivery date snapshot

3. **Extends Orders Table**
   - Flags orders containing pre-orders
   - Tracks pre-order composition (none/partial/all)

4. **Creates Indexes**
   - Optimizes queries for pre-order management
   - Improves admin dashboard performance

5. **Adds Triggers**
   - Automatically updates order pre-order status when items change
   - Automatically maintains product pre-order counts
   - Ensures data consistency

## Features Enabled

After running this migration, the system will support:

- ✅ Pre-ordering out-of-stock products
- ✅ Setting estimated restock dates
- ✅ Admin setting estimated delivery days per product
- ✅ Tracking pre-order status through fulfillment
- ✅ Automatic customer notifications when stock arrives
- ✅ Admin dashboard for pre-order management
- ✅ Pre-order analytics and reporting

## Next Steps

After running the migration:

1. **Test the Schema**: Verify all columns and constraints are in place
2. **Update TypeScript Types**: Extend interfaces to match new schema
3. **Implement UI Components**: Build pre-order buttons, badges, and admin tools
4. **Update Order Creation**: Modify checkout to use new order_items table
5. **Test End-to-End**: Place a pre-order and fulfill it

## Important Notes

- The `order_items` table is newly created. Existing orders store items in the `details` JSONB field.
- You'll need to update the order creation logic to insert into `order_items` table.
- The migration is safe to run multiple times (uses `IF NOT EXISTS` and `ADD COLUMN IF NOT EXISTS`).

## Rollback (if needed)

If you need to rollback the migration:

```sql
-- Remove triggers
DROP TRIGGER IF EXISTS trigger_update_order_preorder_status ON public.order_items;
DROP TRIGGER IF EXISTS trigger_update_product_preorder_count ON public.order_items;

-- Remove functions
DROP FUNCTION IF EXISTS public.update_order_preorder_status();
DROP FUNCTION IF EXISTS public.update_product_preorder_count();

-- Remove indexes
DROP INDEX IF EXISTS idx_products_preorder_count;
DROP INDEX IF EXISTS idx_products_restock_date;
DROP INDEX IF EXISTS idx_order_items_order_id;
DROP INDEX IF EXISTS idx_order_items_product_id;
DROP INDEX IF EXISTS idx_order_items_preorder_status;
DROP INDEX IF EXISTS idx_orders_has_preorders;

-- Remove columns from orders
ALTER TABLE public.orders
DROP COLUMN IF EXISTS has_preorders,
DROP COLUMN IF EXISTS preorder_status;

-- Drop order_items table
DROP TABLE IF EXISTS public.order_items CASCADE;

-- Remove columns from products
ALTER TABLE public.products
DROP COLUMN IF EXISTS estimated_restock_date,
DROP COLUMN IF EXISTS allow_preorder,
DROP COLUMN IF EXISTS preorder_count,
DROP COLUMN IF EXISTS estimated_delivery_days;
```

## Support

If you encounter any issues:

1. Check the Supabase logs for error messages
2. Verify table names match your schema (should be `products`, `orders`, `order_items`)
3. Ensure you have proper permissions to alter tables
4. Contact support if problems persist
