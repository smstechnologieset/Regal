-- =====================================================
-- SERVICES TOGGLE & STOREFRONTS MIGRATION
-- =====================================================
-- Run this in Supabase SQL Editor to support dynamic service toggles
-- and orders/messages for Skincare, Toys, and Journals.
-- =====================================================

-- 1. Create site_settings table for service toggles
CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Allow public read-only access to site_settings') THEN
        CREATE POLICY "Allow public read-only access to site_settings" ON public.site_settings FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Admins can manage site_settings') THEN
        CREATE POLICY "Admins can manage site_settings" ON public.site_settings FOR ALL USING (public.is_admin());
    END IF;
END $$;

-- Insert default service toggle configuration (Bridal & Events default OFF)
INSERT INTO public.site_settings (key, value)
VALUES (
  'services_status',
  '{"attire": true, "skincare": true, "toys": true, "journals": true, "catering": true, "gifts": true, "bridal": false, "events": false}'::jsonb
)
ON CONFLICT (key) DO NOTHING;

-- 2. Update orders table service_type constraint
DO $$ 
BEGIN 
    EXECUTE (
        SELECT 'ALTER TABLE public.orders DROP CONSTRAINT ' || quote_ident(conname)
        FROM pg_constraint 
        WHERE conrelid = 'public.orders'::regclass 
        AND conname LIKE 'orders_service_type_check%'
    );
EXCEPTION WHEN OTHERS THEN 
    RAISE NOTICE 'orders constraint not found or already dropped';
END $$;

ALTER TABLE public.orders ADD CONSTRAINT orders_service_type_check 
CHECK (service_type IN ('attire', 'skincare', 'toys', 'journals', 'events', 'bridal', 'catering', 'gifts'));

-- 3. Update conversations table service_type constraint
DO $$ 
BEGIN 
    EXECUTE (
        SELECT 'ALTER TABLE public.conversations DROP CONSTRAINT ' || quote_ident(conname)
        FROM pg_constraint 
        WHERE conrelid = 'public.conversations'::regclass 
        AND conname LIKE 'conversations_service_type_check%'
    );
EXCEPTION WHEN OTHERS THEN 
    RAISE NOTICE 'conversations constraint not found or already dropped';
END $$;

ALTER TABLE public.conversations ADD CONSTRAINT conversations_service_type_check 
CHECK (service_type IN ('attire', 'skincare', 'toys', 'journals', 'events', 'bridal', 'catering', 'general', 'gifts'));
