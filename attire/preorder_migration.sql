-- Pre-Order System Migration
-- Adds fields to support pre-ordering out-of-stock products

-- ============================================
-- 1. Extend products table
-- ============================================

-- Add pre-order related fields to products
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS estimated_restock_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS allow_preorder BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS preorder_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS estimated_delivery_days INTEGER DEFAULT 14;

-- Add comment for documentation
COMMENT ON COLUMN public.products.estimated_restock_date IS 'Expected date when out-of-stock product will be restocked';
COMMENT ON COLUMN public.products.allow_preorder IS 'Whether customers can pre-order this product when out of stock';
COMMENT ON COLUMN public.products.preorder_count IS 'Cached count of pending pre-orders for this product';
COMMENT ON COLUMN public.products.estimated_delivery_days IS 'Estimated days until delivery for pre-orders (set by admin)';

-- ============================================
-- 2. Create order_items table
-- ============================================
-- Currently orders store items in JSONB details field
-- We need a proper table for pre-order tracking

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id TEXT REFERENCES public.products(id) NOT NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  selected_size TEXT,
  selected_color JSONB,
  is_preorder BOOLEAN DEFAULT false,
  preorder_status TEXT,
  estimated_delivery_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add constraint for preorder_status values
ALTER TABLE public.order_items 
ADD CONSTRAINT order_items_preorder_status_check 
CHECK (preorder_status IN ('pending', 'ready', 'fulfilled', 'cancelled') OR preorder_status IS NULL);

-- Add comments
COMMENT ON COLUMN public.order_items.is_preorder IS 'Whether this item was a pre-order at time of purchase';
COMMENT ON COLUMN public.order_items.preorder_status IS 'Current status of the pre-order: pending, ready, fulfilled, or cancelled';
COMMENT ON COLUMN public.order_items.estimated_delivery_date IS 'Snapshot of estimated delivery date at time of order';

-- Enable RLS
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Policies for order_items (match parent order policies)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can view their own order items') THEN
        CREATE POLICY "Users can view their own order items" ON public.order_items FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM public.orders
                WHERE id = order_id AND user_id = auth.uid()
            )
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can create their own order items') THEN
        CREATE POLICY "Users can create their own order items" ON public.order_items FOR INSERT WITH CHECK (
            EXISTS (
                SELECT 1 FROM public.orders
                WHERE id = order_id AND user_id = auth.uid()
            )
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Admins can view all order items') THEN
        CREATE POLICY "Admins can view all order items" ON public.order_items FOR SELECT USING (public.is_admin());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Admins can update all order items') THEN
        CREATE POLICY "Admins can update all order items" ON public.order_items FOR UPDATE USING (public.is_admin());
    END IF;
END $$;

-- ============================================
-- 3. Extend orders table
-- ============================================

-- Add pre-order summary fields to orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS has_preorders BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS preorder_status TEXT DEFAULT 'none';

-- Add constraint for preorder_status values
ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS orders_preorder_status_check;

ALTER TABLE public.orders 
ADD CONSTRAINT orders_preorder_status_check 
CHECK (preorder_status IN ('none', 'partial', 'all'));

-- Add comments
COMMENT ON COLUMN public.orders.has_preorders IS 'Quick flag indicating if order contains any pre-order items';
COMMENT ON COLUMN public.orders.preorder_status IS 'Pre-order composition: none (no pre-orders), partial (mixed), all (all items are pre-orders)';

-- ============================================
-- 4. Create indexes for performance
-- ============================================

-- Index for finding products with pending pre-orders
CREATE INDEX IF NOT EXISTS idx_products_preorder_count 
ON public.products(preorder_count) 
WHERE preorder_count > 0;

-- Index for finding products with restock dates
CREATE INDEX IF NOT EXISTS idx_products_restock_date 
ON public.products(estimated_restock_date) 
WHERE estimated_restock_date IS NOT NULL;

-- Index for order_items queries
CREATE INDEX IF NOT EXISTS idx_order_items_order_id 
ON public.order_items(order_id);

CREATE INDEX IF NOT EXISTS idx_order_items_product_id 
ON public.order_items(product_id);

-- Index for finding pending pre-orders
CREATE INDEX IF NOT EXISTS idx_order_items_preorder_status 
ON public.order_items(preorder_status, product_id) 
WHERE is_preorder = true;

-- Index for finding orders with pre-orders
CREATE INDEX IF NOT EXISTS idx_orders_has_preorders 
ON public.orders(has_preorders, preorder_status) 
WHERE has_preorders = true;

-- ============================================
-- 5. Create helper function to update order preorder status
-- ============================================

CREATE OR REPLACE FUNCTION public.update_order_preorder_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the parent order's preorder status based on its items
  UPDATE public.orders
  SET 
    has_preorders = EXISTS (
      SELECT 1 FROM public.order_items 
      WHERE order_id = NEW.order_id AND is_preorder = true
    ),
    preorder_status = CASE
      WHEN NOT EXISTS (
        SELECT 1 FROM public.order_items 
        WHERE order_id = NEW.order_id AND is_preorder = true
      ) THEN 'none'
      WHEN EXISTS (
        SELECT 1 FROM public.order_items 
        WHERE order_id = NEW.order_id AND is_preorder = false
      ) THEN 'partial'
      ELSE 'all'
    END
  WHERE id = NEW.order_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically update order preorder status
DROP TRIGGER IF EXISTS trigger_update_order_preorder_status ON public.order_items;

CREATE TRIGGER trigger_update_order_preorder_status
AFTER INSERT OR UPDATE OF is_preorder, preorder_status ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.update_order_preorder_status();

-- ============================================
-- 6. Create helper function to update product preorder count
-- ============================================

CREATE OR REPLACE FUNCTION public.update_product_preorder_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the product's preorder count
  IF TG_OP = 'INSERT' AND NEW.is_preorder = true AND NEW.preorder_status = 'pending' THEN
    UPDATE public.products
    SET preorder_count = preorder_count + NEW.quantity
    WHERE id = NEW.product_id;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle status changes
    IF OLD.preorder_status = 'pending' AND NEW.preorder_status != 'pending' THEN
      UPDATE public.products
      SET preorder_count = GREATEST(0, preorder_count - OLD.quantity)
      WHERE id = OLD.product_id;
    ELSIF OLD.preorder_status != 'pending' AND NEW.preorder_status = 'pending' THEN
      UPDATE public.products
      SET preorder_count = preorder_count + NEW.quantity
      WHERE id = NEW.product_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.is_preorder = true AND OLD.preorder_status = 'pending' THEN
    UPDATE public.products
    SET preorder_count = GREATEST(0, preorder_count - OLD.quantity)
    WHERE id = OLD.product_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically update product preorder count
DROP TRIGGER IF EXISTS trigger_update_product_preorder_count ON public.order_items;

CREATE TRIGGER trigger_update_product_preorder_count
AFTER INSERT OR UPDATE OF preorder_status OR DELETE ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.update_product_preorder_count();

-- ============================================
-- Migration complete
-- ============================================

-- Verify the changes
SELECT 
  'products' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'products'
  AND column_name IN ('estimated_restock_date', 'allow_preorder', 'preorder_count', 'estimated_delivery_days')
ORDER BY ordinal_position;

SELECT 
  'order_items' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'order_items'
  AND column_name IN ('is_preorder', 'preorder_status', 'estimated_delivery_date')
ORDER BY ordinal_position;

SELECT 
  'orders' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'orders'
  AND column_name IN ('has_preorders', 'preorder_status')
ORDER BY ordinal_position;
