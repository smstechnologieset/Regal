-- =====================================================
-- GIFT PACKAGES SERVICE MIGRATION
-- =====================================================

-- 1. Create gift_packages table
CREATE TABLE IF NOT EXISTS public.gift_packages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category TEXT NOT NULL,
  contents TEXT[] DEFAULT '{}',
  image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Update orders table service_type constraint
-- We need to drop the existing check and add the new one
DO $$ 
BEGIN 
    -- Find and drop the existing check constraint on orders.service_type
    -- Note: We check for common names like 'orders_service_type_check'
    EXECUTE (
        SELECT 'ALTER TABLE public.orders DROP CONSTRAINT ' || quote_ident(conname)
        FROM pg_constraint 
        WHERE conrelid = 'public.orders'::regclass 
        AND conname LIKE 'orders_service_type_check%'
    );
EXCEPTION WHEN OTHERS THEN 
    RAISE NOTICE 'Constraint not found or already dropped';
END $$;

ALTER TABLE public.orders ADD CONSTRAINT orders_service_type_check 
CHECK (service_type IN ('attire', 'events', 'bridal', 'catering', 'gifts'));

-- 3. Update conversations table service_type constraint
DO $$ 
BEGIN 
    -- Find and drop the existing check constraint on conversations.service_type
    EXECUTE (
        SELECT 'ALTER TABLE public.conversations DROP CONSTRAINT ' || quote_ident(conname)
        FROM pg_constraint 
        WHERE conrelid = 'public.conversations'::regclass 
        AND conname LIKE 'conversations_service_type_check%'
    );
EXCEPTION WHEN OTHERS THEN 
    RAISE NOTICE 'Constraint not found or already dropped';
END $$;

ALTER TABLE public.conversations ADD CONSTRAINT conversations_service_type_check 
CHECK (service_type IN ('attire', 'events', 'bridal', 'catering', 'general', 'gifts'));

-- 4. Enable RLS
ALTER TABLE public.gift_packages ENABLE ROW LEVEL SECURITY;

-- 5. Create Policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Allow public read-only access to gift_packages') THEN
        CREATE POLICY "Allow public read-only access to gift_packages" ON public.gift_packages FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Admins can manage gift_packages') THEN
        CREATE POLICY "Admins can manage gift_packages" ON public.gift_packages FOR ALL USING (public.is_admin());
    END IF;
END $$;

-- 6. Add modern updated_at trigger
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_gift_packages_updated_at') THEN
        CREATE TRIGGER update_gift_packages_updated_at
          BEFORE UPDATE ON public.gift_packages
          FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
    END IF;
END $$;

-- 7. Seed initial data
INSERT INTO public.gift_packages (id, name, description, price, category, contents, image)
VALUES 
('graduation-premium', 'Premium Graduation Box', 'A luxurious gift package for the new graduate including a personalized stole, premium notebook, and commemorative plaque.', 150.00, 'graduation', ARRAY['Personalized Stole', 'Premium Notebook', 'Commemorative Plaque', 'Signature Pen'], 'https://images.unsplash.com/photo-1523240715630-67bb23d6f0b4?auto=format&fit=crop&q=80&w=800'),
('birthday-sparkle', 'Birthday Sparkle Package', 'Make their day special with this curated set of luxury candles, artisanal chocolates, and a personalized greeting card.', 85.00, 'birthday', ARRAY['Luxury Candle Set', 'Artisanal Chocolates', 'Silk Ribbon', 'Handwritten Card'], 'https://images.unsplash.com/photo-1549465220-1a18274d8122?auto=format&fit=crop&q=80&w=800'),
('partner-romance', 'Romantic Partner Getaway', 'The ultimate surprise for your partner featuring a collection of premium spa products and a bottle of non-alcoholic sparkling cider.', 120.00, 'partner', ARRAY['Organic Spa Set', 'Plush Robe', 'Sparkling Cider', 'Rose Petal Potpourri'], 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&q=80&w=800')
ON CONFLICT (id) DO NOTHING;
