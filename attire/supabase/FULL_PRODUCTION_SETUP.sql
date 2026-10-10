-- ============================================================================
-- REGAL PLATFORM - COMPLETE PRODUCTION DATABASE SETUP
-- ============================================================================
-- Run this entire script in the Supabase Dashboard -> SQL Editor
-- This initializes:
--  1. Extensions & Helper Functions
--  2. All Tables with correct constraints & columns
--  3. Row Level Security (RLS) & non-recursive policies
--  4. Database Triggers
--  5. Full Seed Catalog Data (Products, Packages, Menus, Gowns, Accessories)
--  6. Admin Role assignment for eliasdegafe3633@gmail.com
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 2. CORE HELPER FUNCTIONS & PROFILES TABLE
-- ============================================================================

-- PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Non-recursive is_admin() function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'user'
  )
  ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Policies for profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" 
  ON public.profiles FOR SELECT 
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" 
  ON public.profiles FOR UPDATE 
  USING (public.is_admin());

-- Generic updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- 3. E-COMMERCE & ATTIRE TABLES
-- ============================================================================

-- CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  image TEXT,
  subcategories JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read-only access to categories" ON public.categories;
CREATE POLICY "Allow public read-only access to categories" ON public.categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL USING (public.is_admin());

-- PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  original_price DECIMAL(10, 2),
  category TEXT REFERENCES public.categories(id),
  subcategory TEXT,
  sizes TEXT[] DEFAULT '{}',
  colors JSONB DEFAULT '[]',
  images TEXT[] DEFAULT '{}',
  badges TEXT[] DEFAULT '{}',
  rating DECIMAL(2, 1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  popularity INTEGER DEFAULT 0,
  in_stock BOOLEAN DEFAULT TRUE,
  stock_count INTEGER DEFAULT 0,
  estimated_restock_date TIMESTAMPTZ,
  allow_preorder BOOLEAN DEFAULT TRUE,
  preorder_count INTEGER DEFAULT 0,
  estimated_delivery_days INTEGER DEFAULT 14,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read-only access to products" ON public.products;
CREATE POLICY "Allow public read-only access to products" ON public.products FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
CREATE POLICY "Admins can manage products" ON public.products FOR ALL USING (public.is_admin());

-- PROMO CODES TABLE
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10, 2) NOT NULL,
  min_purchase DECIMAL(10, 2) DEFAULT 0,
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read-only access to promo_codes" ON public.promo_codes;
CREATE POLICY "Allow public read-only access to promo_codes" ON public.promo_codes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage promo_codes" ON public.promo_codes;
CREATE POLICY "Admins can manage promo_codes" ON public.promo_codes FOR ALL USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.increment_promo_usage(p_code TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.promo_codes
  SET usage_count = usage_count + 1
  WHERE code = p_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  service_type TEXT NOT NULL CHECK (service_type IN ('attire', 'events', 'bridal', 'catering', 'gifts')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  details JSONB DEFAULT '{}',
  total DECIMAL(10, 2) DEFAULT 0,
  notes TEXT,
  shipping_address JSONB DEFAULT '{}',
  promo_code TEXT,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  has_preorders BOOLEAN DEFAULT FALSE,
  preorder_status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
CREATE POLICY "Users can view their own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create their own orders" ON public.orders;
CREATE POLICY "Users can create their own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
CREATE POLICY "Admins can view all orders" ON public.orders FOR SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "Admins can update all orders" ON public.orders;
CREATE POLICY "Admins can update all orders" ON public.orders FOR UPDATE USING (public.is_admin());

CREATE INDEX IF NOT EXISTS orders_user_id_idx ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS orders_status_idx ON public.orders(status);
CREATE INDEX IF NOT EXISTS orders_service_type_idx ON public.orders(service_type);

-- ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id TEXT REFERENCES public.products(id) NOT NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  selected_size TEXT,
  selected_color JSONB,
  is_preorder BOOLEAN DEFAULT false,
  preorder_status TEXT CHECK (preorder_status IN ('pending', 'ready', 'fulfilled', 'cancelled') OR preorder_status IS NULL),
  estimated_delivery_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own order items" ON public.order_items;
CREATE POLICY "Users can view their own order items" ON public.order_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = auth.uid()
  )
);
DROP POLICY IF EXISTS "Users can create order items for their own orders" ON public.order_items;
CREATE POLICY "Users can create order items for their own orders" ON public.order_items FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = auth.uid()
  )
);
DROP POLICY IF EXISTS "Admins can view all order items" ON public.order_items;
CREATE POLICY "Admins can view all order items" ON public.order_items FOR SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "Admins can manage order items" ON public.order_items;
CREATE POLICY "Admins can manage order items" ON public.order_items FOR ALL USING (public.is_admin());

-- Atomic attire order creation function
CREATE OR REPLACE FUNCTION public.create_attire_order(
  p_user_id uuid,
  p_total numeric,
  p_details jsonb,
  p_shipping_address jsonb,
  p_promo_code text,
  p_discount numeric,
  p_has_preorders boolean,
  p_preorder_status text,
  p_items jsonb
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_order_id uuid;
  v_item jsonb;
BEGIN
  INSERT INTO public.orders (
    user_id, total, status, details, shipping_address, service_type,
    promo_code, discount_amount, has_preorders, preorder_status
  )
  VALUES (
    p_user_id, p_total, 'pending', p_details, p_shipping_address, 'attire',
    p_promo_code, COALESCE(p_discount, 0), p_has_preorders, p_preorder_status
  )
  RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO public.order_items (
      order_id, product_id, quantity, price, selected_size, selected_color,
      is_preorder, estimated_delivery_date, preorder_status
    )
    VALUES (
      v_order_id,
      (v_item->>'product_id'),
      (v_item->>'quantity')::int,
      (v_item->>'price')::numeric,
      (v_item->>'selected_size'),
      (v_item->'selected_color'),
      COALESCE((v_item->>'is_preorder')::boolean, false),
      NULLIF(v_item->>'estimated_delivery_date', '')::timestamptz,
      NULLIF(v_item->>'preorder_status', '')
    );
  END LOOP;

  RETURN v_order_id;
END;
$$;

-- ============================================================================
-- 4. SERVICES & PACKAGES TABLES
-- ============================================================================

-- EVENT PACKAGES TABLE
CREATE TABLE IF NOT EXISTS public.event_packages (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('wedding', 'birthday', 'corporate', 'graduation', 'social')),
  price_start DECIMAL(10, 2) NOT NULL,
  features TEXT[] DEFAULT '{}',
  image TEXT,
  capacity TEXT,
  popular BOOLEAN DEFAULT FALSE
);

ALTER TABLE public.event_packages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read-only access to event_packages" ON public.event_packages;
CREATE POLICY "Allow public read-only access to event_packages" ON public.event_packages FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage event_packages" ON public.event_packages;
CREATE POLICY "Admins can manage event_packages" ON public.event_packages FOR ALL USING (public.is_admin());

-- BRIDAL GOWNS TABLE
CREATE TABLE IF NOT EXISTS public.bridal_gowns (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  designer TEXT,
  style TEXT,
  silhouette TEXT,
  price_rent DECIMAL(10, 2),
  price_buy DECIMAL(10, 2),
  sizes TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  description TEXT,
  is_new BOOLEAN DEFAULT FALSE
);

ALTER TABLE public.bridal_gowns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read-only access to bridal_gowns" ON public.bridal_gowns;
CREATE POLICY "Allow public read-only access to bridal_gowns" ON public.bridal_gowns FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage bridal_gowns" ON public.bridal_gowns;
CREATE POLICY "Admins can manage bridal_gowns" ON public.bridal_gowns FOR ALL USING (public.is_admin());

-- BRIDAL SERVICES TABLE
CREATE TABLE IF NOT EXISTS public.bridal_services (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  price_start DECIMAL(10, 2),
  duration TEXT,
  type TEXT CHECK (type IN ('makeup', 'hair', 'full-styling', 'fitting')),
  image TEXT
);

ALTER TABLE public.bridal_services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read-only access to bridal_services" ON public.bridal_services;
CREATE POLICY "Allow public read-only access to bridal_services" ON public.bridal_services FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage bridal_services" ON public.bridal_services;
CREATE POLICY "Admins can manage bridal_services" ON public.bridal_services FOR ALL USING (public.is_admin());

-- BRIDAL ACCESSORIES TABLE
CREATE TABLE IF NOT EXISTS public.bridal_accessories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('veil', 'jewelry', 'headpiece', 'shoes', 'clutch')),
  price_rent DECIMAL(10, 2),
  price_buy DECIMAL(10, 2),
  images TEXT[] DEFAULT '{}',
  description TEXT,
  is_new BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.bridal_accessories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read-only access to bridal_accessories" ON public.bridal_accessories;
CREATE POLICY "Allow public read-only access to bridal_accessories" ON public.bridal_accessories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage bridal_accessories" ON public.bridal_accessories;
CREATE POLICY "Admins can manage bridal_accessories" ON public.bridal_accessories FOR ALL USING (public.is_admin());

-- CATERING PACKAGES TABLE
CREATE TABLE IF NOT EXISTS public.catering_packages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price_per_guest DECIMAL(10, 2) NOT NULL,
  min_guests INTEGER DEFAULT 10,
  includes TEXT[] DEFAULT '{}',
  image TEXT
);

ALTER TABLE public.catering_packages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read-only access to catering_packages" ON public.catering_packages;
CREATE POLICY "Allow public read-only access to catering_packages" ON public.catering_packages FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage catering_packages" ON public.catering_packages;
CREATE POLICY "Admins can manage catering_packages" ON public.catering_packages FOR ALL USING (public.is_admin());

-- MENU ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.menu_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) DEFAULT 0,
  category TEXT CHECK (category IN ('appetizer', 'main', 'dessert', 'drink', 'station')),
  dietary TEXT[] DEFAULT '{}',
  image TEXT
);

ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read-only access to menu_items" ON public.menu_items;
CREATE POLICY "Allow public read-only access to menu_items" ON public.menu_items FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage menu_items" ON public.menu_items;
CREATE POLICY "Admins can manage menu_items" ON public.menu_items FOR ALL USING (public.is_admin());

-- GIFT PACKAGES TABLE
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

ALTER TABLE public.gift_packages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read-only access to gift_packages" ON public.gift_packages;
CREATE POLICY "Allow public read-only access to gift_packages" ON public.gift_packages FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage gift_packages" ON public.gift_packages;
CREATE POLICY "Admins can manage gift_packages" ON public.gift_packages FOR ALL USING (public.is_admin());

-- ============================================================================
-- 5. CONVERSATIONS & MESSAGING
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  service_type TEXT DEFAULT 'general' CHECK (service_type IN ('attire', 'events', 'bridal', 'catering', 'general', 'gifts')),
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  subject TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.conversations;
CREATE POLICY "Users can view their own conversations" ON public.conversations FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create their own conversations" ON public.conversations;
CREATE POLICY "Users can create their own conversations" ON public.conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can view all conversations" ON public.conversations;
CREATE POLICY "Admins can view all conversations" ON public.conversations FOR SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "Admins can update all conversations" ON public.conversations;
CREATE POLICY "Admins can update all conversations" ON public.conversations FOR UPDATE USING (public.is_admin());

CREATE INDEX IF NOT EXISTS conversations_user_id_idx ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS conversations_status_idx ON public.conversations(status);

-- MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
CREATE POLICY "Users can view messages in their conversations" ON public.messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE id = conversation_id AND user_id = auth.uid()
  )
);
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON public.messages;
CREATE POLICY "Users can send messages in their conversations" ON public.messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE id = conversation_id AND user_id = auth.uid()
  )
);
DROP POLICY IF EXISTS "Admins can view all messages" ON public.messages;
CREATE POLICY "Admins can view all messages" ON public.messages FOR SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "Admins can send messages" ON public.messages;
CREATE POLICY "Admins can send messages" ON public.messages FOR INSERT WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Admins can update messages (mark read)" ON public.messages;
CREATE POLICY "Admins can update messages (mark read)" ON public.messages FOR UPDATE USING (public.is_admin());

CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON public.messages(created_at);

-- Trigger to update conversation last_message_at
CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET last_message_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_message_created ON public.messages;
CREATE TRIGGER on_message_created
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.update_conversation_last_message();

-- ============================================================================
-- 6. NOTIFICATIONS, NEWSLETTER & TELEGRAM
-- ============================================================================

-- NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'message',
    'order',
    'general',
    'preorder_ready',
    'preorder_insufficient_stock',
    'preorder_update'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_read_idx ON public.notifications(read);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_user_read_idx ON public.notifications(user_id, read);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
CREATE POLICY "Users can delete their own notifications" ON public.notifications FOR DELETE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can view all notifications" ON public.notifications;
CREATE POLICY "Admins can view all notifications" ON public.notifications FOR SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);

-- NEWSLETTER TABLE
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- TELEGRAM AUTH SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.telegram_auth_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,
  code TEXT NOT NULL,
  phone_number TEXT,
  telegram_id TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '10 minutes'),
  verified BOOLEAN DEFAULT false
);

ALTER TABLE public.telegram_auth_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow service role full access" ON public.telegram_auth_attempts;
CREATE POLICY "Allow service role full access" ON public.telegram_auth_attempts FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_telegram_auth_session_id ON public.telegram_auth_attempts (session_id);

CREATE OR REPLACE FUNCTION public.cleanup_expired_telegram_attempts()
RETURNS void AS $$
BEGIN
  DELETE FROM public.telegram_auth_attempts WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. INITIAL CATALOG SEED DATA
-- ============================================================================

-- CATEGORIES
INSERT INTO public.categories (id, name, slug, image, subcategories) VALUES
('women', 'Women', 'women', 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&h=300&fit=crop', '[{"id": "women-dresses", "name": "Dresses", "slug": "dresses"}, {"id": "women-tops", "name": "Tops & Blouses", "slug": "tops"}, {"id": "women-pants", "name": "Pants", "slug": "pants"}, {"id": "women-skirts", "name": "Skirts", "slug": "skirts"}, {"id": "women-outerwear", "name": "Outerwear", "slug": "outerwear"}]'),
('men', 'Men', 'men', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop', '[{"id": "men-shirts", "name": "Shirts", "slug": "shirts"}, {"id": "men-tshirts", "name": "T-Shirts", "slug": "tshirts"}, {"id": "men-pants", "name": "Pants", "slug": "pants"}, {"id": "men-suits", "name": "Suits", "slug": "suits"}, {"id": "men-outerwear", "name": "Outerwear", "slug": "outerwear"}]'),
('kids', 'Kids', 'kids', 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=400&h=300&fit=crop', '[{"id": "kids-girls", "name": "Girls", "slug": "girls"}, {"id": "kids-boys", "name": "Boys", "slug": "boys"}, {"id": "kids-baby", "name": "Baby", "slug": "baby"}]'),
('accessories', 'Accessories', 'accessories', 'https://images.unsplash.com/photo-1492707892479-7bc8d5a4ee93?w=400&h=300&fit=crop', '[{"id": "acc-bags", "name": "Bags", "slug": "bags"}, {"id": "acc-jewelry", "name": "Jewelry", "slug": "jewelry"}, {"id": "acc-watches", "name": "Watches", "slug": "watches"}, {"id": "acc-scarves", "name": "Scarves", "slug": "scarves"}]'),
('sale', 'Sale', 'sale', 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&h=300&fit=crop', '[]')
ON CONFLICT (id) DO NOTHING;

-- PRODUCTS
INSERT INTO public.products (id, name, description, price, original_price, category, subcategory, sizes, colors, images, badges, rating, review_count, popularity, in_stock, stock_count, created_at) VALUES
('prod-001', 'Elegant Floral Maxi Dress', 'A stunning floral maxi dress perfect for summer occasions. Features a flattering A-line silhouette with a cinched waist and flowing skirt. Made from lightweight, breathable fabric.', 79.99, 129.99, 'women', 'dresses', ARRAY['XS', 'S', 'M', 'L', 'XL'], '[{"name": "Pink", "hex": "#EC4899"}, {"name": "Beige", "hex": "#D4B896"}, {"name": "Black", "hex": "#000000"}]', ARRAY['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=400&h=600&fit=crop'], ARRAY['sale', 'bestseller'], 4.8, 324, 95, true, 45, '2024-12-20T10:00:00Z'),
('prod-002', 'Classic White Button-Down Shirt', 'A timeless white button-down shirt crafted from premium cotton. Perfect for both professional and casual settings. Features a relaxed fit and mother-of-pearl buttons.', 59.99, NULL, 'women', 'tops', ARRAY['XS', 'S', 'M', 'L', 'XL', 'XXL'], '[{"name": "White", "hex": "#FFFFFF"}, {"name": "Navy", "hex": "#1e3a5f"}, {"name": "Pink", "hex": "#EC4899"}]', ARRAY['https://images.unsplash.com/photo-1485968579169-a6d3f4b25f5c?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&h=600&fit=crop'], ARRAY['new'], 4.6, 156, 88, true, 78, '2024-12-24T10:00:00Z'),
('prod-003', 'Slim Fit Chino Pants', 'Modern slim-fit chinos in a versatile color. Made from stretch cotton for all-day comfort. Features a classic five-pocket design.', 69.99, 89.99, 'men', 'pants', ARRAY['S', 'M', 'L', 'XL', 'XXL'], '[{"name": "Beige", "hex": "#D4B896"}, {"name": "Navy", "hex": "#1e3a5f"}, {"name": "Black", "hex": "#000000"}, {"name": "Gray", "hex": "#6B7280"}]', ARRAY['https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400&h=600&fit=crop'], ARRAY['sale'], 4.5, 289, 82, true, 120, '2024-12-15T10:00:00Z'),
('prod-004', 'Oversized Wool Blend Coat', 'A luxurious oversized coat crafted from a premium wool blend. Features a double-breasted design with horn buttons and deep pockets. Perfect for cold weather styling.', 199.99, NULL, 'women', 'outerwear', ARRAY['XS', 'S', 'M', 'L'], '[{"name": "Black", "hex": "#000000"}, {"name": "Beige", "hex": "#D4B896"}, {"name": "Gray", "hex": "#6B7280"}]', ARRAY['https://images.unsplash.com/photo-1551232864-3f0890e580d9?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=400&h=600&fit=crop'], ARRAY['new'], 4.9, 87, 91, true, 23, '2024-12-22T10:00:00Z'),
('prod-005', 'Premium Cotton T-Shirt', 'Essential crew neck t-shirt made from 100% organic cotton. Features a relaxed fit and reinforced seams for durability. Available in multiple colors.', 29.99, NULL, 'men', 'tshirts', ARRAY['S', 'M', 'L', 'XL', 'XXL'], '[{"name": "Black", "hex": "#000000"}, {"name": "White", "hex": "#FFFFFF"}, {"name": "Navy", "hex": "#1e3a5f"}, {"name": "Gray", "hex": "#6B7280"}, {"name": "Green", "hex": "#059669"}]', ARRAY['https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&h=600&fit=crop'], ARRAY['bestseller'], 4.7, 512, 98, true, 250, '2024-11-01T10:00:00Z'),
('prod-006', 'Pleated Midi Skirt', 'Elegant pleated midi skirt in a flattering A-line shape. Made from flowing fabric that moves beautifully. Features an elastic waistband for comfort.', 54.99, 74.99, 'women', 'skirts', ARRAY['XS', 'S', 'M', 'L'], '[{"name": "Black", "hex": "#000000"}, {"name": "Pink", "hex": "#EC4899"}, {"name": "Green", "hex": "#059669"}]', ARRAY['https://images.unsplash.com/photo-1495385794356-15371f348c31?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=600&fit=crop'], ARRAY['sale'], 4.4, 198, 76, true, 56, '2024-12-10T10:00:00Z'),
('prod-007', 'Italian Leather Belt', 'Handcrafted leather belt made in Italy. Features a polished silver buckle and comes in a premium gift box. Width: 3.5cm.', 89.99, NULL, 'accessories', 'bags', ARRAY['S', 'M', 'L', 'XL'], '[{"name": "Black", "hex": "#000000"}, {"name": "Brown", "hex": "#78350F"}]', ARRAY['https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=400&h=600&fit=crop'], ARRAY['new'], 4.8, 145, 85, true, 67, '2024-12-23T10:00:00Z'),
('prod-008', 'Tailored Blazer', 'Sophisticated single-breasted blazer with a modern slim fit. Features functional buttons and interior pockets. Perfect for business or smart casual occasions.', 159.99, NULL, 'men', 'suits', ARRAY['S', 'M', 'L', 'XL'], '[{"name": "Navy", "hex": "#1e3a5f"}, {"name": "Black", "hex": "#000000"}, {"name": "Gray", "hex": "#6B7280"}]', ARRAY['https://images.unsplash.com/photo-1475180098004-ca77a66827be?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&h=600&fit=crop'], ARRAY[]::TEXT[], 4.6, 203, 79, true, 34, '2024-12-05T10:00:00Z'),
('prod-009', 'Cozy Knit Sweater', 'Soft and cozy cable-knit sweater perfect for layering. Made from a blend of wool and cashmere for ultimate comfort. Features ribbed cuffs and hem.', 89.99, 119.99, 'women', 'tops', ARRAY['XS', 'S', 'M', 'L', 'XL'], '[{"name": "White", "hex": "#FFFFFF"}, {"name": "Beige", "hex": "#D4B896"}, {"name": "Pink", "hex": "#EC4899"}, {"name": "Green", "hex": "#059669"}]', ARRAY['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop'], ARRAY['sale', 'bestseller'], 4.7, 276, 89, true, 89, '2024-12-01T10:00:00Z'),
('prod-010', 'Kids Rainbow Hoodie', 'Fun and colorful hoodie for kids featuring a rainbow design. Made from soft fleece for maximum comfort. Machine washable.', 34.99, NULL, 'kids', 'girls', ARRAY['XS', 'S', 'M', 'L'], '[{"name": "Pink", "hex": "#EC4899"}, {"name": "Blue", "hex": "#2563EB"}]', ARRAY['https://images.unsplash.com/photo-1524502397800-2eeaad7c3fe5?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1471286174890-9c112ffca5b4?w=400&h=600&fit=crop'], ARRAY['new'], 4.9, 89, 72, true, 156, '2024-12-25T10:00:00Z'),
('prod-011', 'Silk Scarf Collection', 'Luxurious silk scarf with an exclusive print. Versatile accessory that can be worn multiple ways. Size: 90cm x 90cm.', 129.99, 169.99, 'accessories', 'scarves', ARRAY['One Size'], '[{"name": "Red", "hex": "#DC2626"}, {"name": "Blue", "hex": "#2563EB"}, {"name": "Green", "hex": "#059669"}]', ARRAY['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=400&h=600&fit=crop'], ARRAY['sale', 'limited'], 4.8, 67, 83, true, 12, '2024-12-18T10:00:00Z'),
('prod-012', 'Oxford Dress Shirt', 'Classic Oxford dress shirt with a button-down collar. Made from premium cotton with a slight texture. Ideal for professional settings.', 74.99, NULL, 'men', 'shirts', ARRAY['S', 'M', 'L', 'XL', 'XXL'], '[{"name": "White", "hex": "#FFFFFF"}, {"name": "Blue", "hex": "#2563EB"}, {"name": "Pink", "hex": "#EC4899"}]', ARRAY['https://images.unsplash.com/photo-1485968579169-a6d3f4b25f5c?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&h=600&fit=crop'], ARRAY[]::TEXT[], 4.5, 334, 86, true, 145, '2024-11-20T10:00:00Z'),
('prod-013', 'High-Waist Wide Leg Pants', 'Sophisticated high-waist wide leg pants that elongate your silhouette. Made from flowing crepe fabric. Features side pockets and a hidden zipper.', 79.99, NULL, 'women', 'pants', ARRAY['XS', 'S', 'M', 'L'], '[{"name": "Black", "hex": "#000000"}, {"name": "White", "hex": "#FFFFFF"}, {"name": "Beige", "hex": "#D4B896"}]', ARRAY['https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400&h=600&fit=crop'], ARRAY['new'], 4.6, 178, 81, true, 67, '2024-12-23T10:00:00Z'),
('prod-014', 'Quilted Puffer Jacket', 'Warm and stylish quilted puffer jacket with a modern fit. Water-resistant outer shell with synthetic down fill. Features a detachable hood.', 149.99, 199.99, 'men', 'outerwear', ARRAY['S', 'M', 'L', 'XL', 'XXL'], '[{"name": "Black", "hex": "#000000"}, {"name": "Navy", "hex": "#1e3a5f"}, {"name": "Green", "hex": "#059669"}]', ARRAY['https://images.unsplash.com/photo-1551232864-3f0890e580d9?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=400&h=600&fit=crop'], ARRAY['sale'], 4.7, 256, 90, true, 78, '2024-12-12T10:00:00Z'),
('prod-015', 'Statement Earrings', 'Eye-catching statement earrings with geometric design. Gold-plated with hypoallergenic posts. Perfect for special occasions.', 45.99, NULL, 'accessories', 'jewelry', ARRAY['One Size'], '[{"name": "Gold", "hex": "#D4AF37"}, {"name": "Silver", "hex": "#C0C0C0"}]', ARRAY['https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&h=600&fit=crop'], ARRAY['new'], 4.4, 92, 74, true, 89, '2024-12-24T10:00:00Z'),
('prod-016', 'Boys Graphic Tee', 'Cool graphic t-shirt for boys with fun dinosaur print. Made from soft cotton jersey. Machine washable and durable.', 24.99, NULL, 'kids', 'boys', ARRAY['XS', 'S', 'M', 'L'], '[{"name": "Navy", "hex": "#1e3a5f"}, {"name": "Green", "hex": "#059669"}, {"name": "Gray", "hex": "#6B7280"}]', ARRAY['https://images.unsplash.com/photo-1495385794356-15371f348c31?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=600&fit=crop'], ARRAY[]::TEXT[], 4.6, 134, 68, true, 234, '2024-12-08T10:00:00Z'),
('prod-017', 'Cashmere V-Neck Sweater', 'Luxurious 100% cashmere V-neck sweater. Incredibly soft with a lightweight feel. Perfect for layering or wearing alone.', 249.99, NULL, 'women', 'tops', ARRAY['XS', 'S', 'M', 'L', 'XL'], '[{"name": "Black", "hex": "#000000"}, {"name": "Beige", "hex": "#D4B896"}, {"name": "Gray", "hex": "#6B7280"}, {"name": "Red", "hex": "#DC2626"}]', ARRAY['https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=400&h=600&fit=crop'], ARRAY['limited'], 4.9, 56, 78, true, 18, '2024-12-20T10:00:00Z'),
('prod-018', 'Leather Crossbody Bag', 'Compact leather crossbody bag with adjustable strap. Features multiple compartments and card slots. Perfect for everyday use.', 119.99, 159.99, 'accessories', 'bags', ARRAY['One Size'], '[{"name": "Black", "hex": "#000000"}, {"name": "Brown", "hex": "#78350F"}, {"name": "Beige", "hex": "#D4B896"}]', ARRAY['https://images.unsplash.com/photo-1475180098004-ca77a66827be?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&h=600&fit=crop'], ARRAY['sale', 'bestseller'], 4.7, 312, 93, true, 45, '2024-12-05T10:00:00Z'),
('prod-019', 'Baby Onesie Set (3-Pack)', 'Adorable 3-pack of baby onesies in soft organic cotton. Features snap closures for easy diaper changes. Available in pastel colors.', 39.99, NULL, 'kids', 'baby', ARRAY['0-3M', '3-6M', '6-12M', '12-18M'], '[{"name": "White", "hex": "#FFFFFF"}, {"name": "Pink", "hex": "#EC4899"}, {"name": "Blue", "hex": "#2563EB"}]', ARRAY['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop'], ARRAY['new'], 4.8, 178, 85, true, 123, '2024-12-22T10:00:00Z'),
('prod-020', 'Vintage Wrap Dress', 'Timeless wrap dress with a vintage-inspired print. Features a flattering tie waist and flowing skirt. Perfect for any occasion.', 89.99, NULL, 'women', 'dresses', ARRAY['XS', 'S', 'M', 'L', 'XL'], '[{"name": "Red", "hex": "#DC2626"}, {"name": "Green", "hex": "#059669"}, {"name": "Beige", "hex": "#D4B896"}]', ARRAY['https://images.unsplash.com/photo-1524502397800-2eeaad7c3fe5?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1471286174890-9c112ffca5b4?w=400&h=600&fit=crop'], ARRAY[]::TEXT[], 4.5, 167, 77, true, 56, '2024-12-15T10:00:00Z'),
('prod-021', 'Linen Blend Shorts', 'Lightweight linen blend shorts perfect for warm weather. Features a drawstring waist and side pockets. Relaxed fit for comfort.', 44.99, NULL, 'men', 'pants', ARRAY['S', 'M', 'L', 'XL'], '[{"name": "Beige", "hex": "#D4B896"}, {"name": "White", "hex": "#FFFFFF"}, {"name": "Navy", "hex": "#1e3a5f"}]', ARRAY['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=400&h=600&fit=crop'], ARRAY['new'], 4.3, 89, 65, true, 178, '2024-12-25T10:00:00Z'),
('prod-022', 'Minimalist Watch', 'Sleek minimalist watch with a leather strap. Japanese quartz movement with water resistance up to 30m. Case diameter: 40mm.', 159.99, NULL, 'accessories', 'watches', ARRAY['One Size'], '[{"name": "Rose Gold", "hex": "#B76E79"}, {"name": "Silver", "hex": "#C0C0C0"}, {"name": "Gold", "hex": "#D4AF37"}]', ARRAY['https://images.unsplash.com/photo-1485968579169-a6d3f4b25f5c?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&h=600&fit=crop'], ARRAY['bestseller'], 4.6, 234, 88, true, 56, '2024-11-15T10:00:00Z'),
('prod-023', 'Satin Slip Dress', 'Elegant satin slip dress with delicate lace trim. Features adjustable spaghetti straps and a cowl neckline. Perfect for evenings out.', 99.99, 139.99, 'women', 'dresses', ARRAY['XS', 'S', 'M', 'L'], '[{"name": "Black", "hex": "#000000"}, {"name": "Red", "hex": "#DC2626"}, {"name": "Green", "hex": "#059669"}]', ARRAY['https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400&h=600&fit=crop'], ARRAY['sale'], 4.7, 145, 84, true, 34, '2024-12-10T10:00:00Z'),
('prod-024', 'Performance Polo Shirt', 'Moisture-wicking polo shirt designed for active lifestyles. Features UV protection and quick-dry technology. Perfect for golf or casual wear.', 54.99, NULL, 'men', 'shirts', ARRAY['S', 'M', 'L', 'XL', 'XXL'], '[{"name": "White", "hex": "#FFFFFF"}, {"name": "Navy", "hex": "#1e3a5f"}, {"name": "Black", "hex": "#000000"}, {"name": "Green", "hex": "#059669"}]', ARRAY['https://images.unsplash.com/photo-1551232864-3f0890e580d9?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=400&h=600&fit=crop'], ARRAY[]::TEXT[], 4.4, 198, 71, true, 167, '2024-12-01T10:00:00Z'),
('prod-025', 'Denim Jacket - Out of Stock', 'Classic denim jacket with a modern fit. Features distressed details and brass buttons. A wardrobe essential.', 89.99, NULL, 'women', 'outerwear', ARRAY['XS', 'S', 'M', 'L'], '[{"name": "Blue", "hex": "#2563EB"}]', ARRAY['https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&h=600&fit=crop'], ARRAY[]::TEXT[], 4.8, 423, 96, false, 0, '2024-10-15T10:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- EVENT PACKAGES
INSERT INTO public.event_packages (id, title, description, type, price_start, features, image, capacity, popular) VALUES
('wedding-classic', 'Classic Wedding', 'A beautiful and timeless wedding package perfect for intimate gatherings.', 'wedding', 5000, ARRAY['Venue Decoration', 'Basic Catering', 'Photography (4 hours)', 'Sound System'], 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=600&fit=crop', 'Up to 50 guests', false),
('wedding-premium', 'Royal Wedding', 'An extravagant celebration with premium services for your special day.', 'wedding', 15000, ARRAY['Luxury Venue Decor', 'Premium Catering (3-course)', 'Full Day Photography & Videography', 'Live Band', 'Bridal Suite'], 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&h=600&fit=crop', '100-200 guests', true),
('birthday-kids', 'Magical Kids Party', 'Fun-filled celebration with games, entertainment, and kid-friendly treats.', 'birthday', 800, ARRAY['Themed Decor', 'Magician/Clown', 'Face Painting', 'Snacks & Cake', 'Goodie Bags'], 'https://images.unsplash.com/photo-1530103862676-de3c9a59af57?w=800&h=600&fit=crop', 'Up to 30 kids', false),
('birthday-milestone', 'Milestone Celebration', 'Elegant party for 18th, 21st, 50th or any milestone birthday.', 'birthday', 2000, ARRAY['Venue Setup', 'DJ/Music', 'Buffet Catering', 'Photography', 'Custom Cake'], 'https://images.unsplash.com/photo-1533294160622-d5fece760826?w=800&h=600&fit=crop', '50-100 guests', true),
('corp-conference', 'Business Conference', 'Professional setup for successful meetings and conferences.', 'corporate', 3000, ARRAY['AV Equipment', 'Seating Arrangement', 'Coffee Breaks & Lunch', 'Stationery'], 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&h=600&fit=crop', '50-200 attendees', false),
('corp-party', 'Company Gala', 'Annual dinner or appreciation party for employees and partners.', 'corporate', 8000, ARRAY['Ballroom Venue', 'Gourmet Dinner', 'Entertainment', 'Awards Ceremony Setup'], 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&h=600&fit=crop', '100+ attendees', false),
('grad-party', 'Graduation Bash', 'Celebrate your academic achievement in style with family and friends.', 'graduation', 1500, ARRAY['Photo Booth', 'DJ', 'Finger Foods', 'Decorations'], 'https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?w=800&h=600&fit=crop', '50 guests', false)
ON CONFLICT (id) DO NOTHING;

-- BRIDAL GOWNS
INSERT INTO public.bridal_gowns (id, name, designer, style, silhouette, price_rent, price_buy, sizes, images, description, is_new) VALUES
('gown-1', 'Seraphina', 'Elie Saab', 'Romantic', 'A-Line', 1200, 4500, ARRAY['US 4', 'US 6', 'US 8', 'US 10'], ARRAY['https://images.unsplash.com/photo-1594552072238-b8a33785b261?w=800&h=1000&fit=crop'], 'Ethereal A-line gown with floral appliqué and long tulle sleeves.', true),
('gown-2', 'Arabella', 'Vera Wang', 'Modern', 'Mermaid', 1500, 6000, ARRAY['US 2', 'US 4', 'US 6'], ARRAY['https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=800&h=1000&fit=crop'], 'Sleek mermaid silhouette with dramatic ruffled train.', false),
('gown-3', 'Isolde', 'Monique Lhuillier', 'Classic', 'Ballgown', 1800, 7500, ARRAY['US 6', 'US 8', 'US 12'], ARRAY['https://images.unsplash.com/photo-1549416876-b9b9a67484df?w=800&h=1000&fit=crop'], 'Timeless satin ballgown with off-shoulder neckline and crystal embellishments.', false),
('gown-4', 'Genevieve', 'Oscar de la Renta', 'Boho', 'Sheath', 900, 3200, ARRAY['US 4', 'US 6', 'US 8', 'US 10'], ARRAY['https://images.unsplash.com/photo-1596483550605-d972f113840e?w=800&h=1000&fit=crop'], 'Delicate lace sheath gown with open back and cap sleeves.', false)
ON CONFLICT (id) DO NOTHING;

-- BRIDAL SERVICES
INSERT INTO public.bridal_services (id, title, description, price_start, duration, type, image) VALUES
('makeup-bridal', 'Bridal Makeup', 'HD makeup application, lash application, and touch-up kit.', 250, '2 hours', 'makeup', 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800&h=600&fit=crop'),
('hair-bridal', 'Bridal Hair Styling', 'Intricate updo or styling, veil placement, and accessories.', 200, '1.5 hours', 'hair', 'https://images.unsplash.com/photo-1522337360705-8b13d52b03cc?w=800&h=600&fit=crop'),
('fitting', 'Gown Fitting', 'Personal consultation with our stylist to find your perfect dress.', 50, '1 hour', 'fitting', 'https://images.unsplash.com/photo-1585416294489-4796395c378e?w=800&h=600&fit=crop')
ON CONFLICT (id) DO NOTHING;

-- BRIDAL ACCESSORIES
INSERT INTO public.bridal_accessories (id, name, category, price_rent, price_buy, images, description, is_new) VALUES
('acc-veil-1', 'Cathedral Length Veil', 'veil', 150, 450, ARRAY['https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=600&fit=crop'], 'Elegant cathedral length veil with delicate lace trim. Perfect for a dramatic entrance.', true),
('acc-veil-2', 'Birdcage Veil', 'veil', 80, 200, ARRAY['https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&h=600&fit=crop'], 'Vintage-inspired birdcage veil for a classic, sophisticated look.', false),
('acc-veil-3', 'Fingertip Veil', 'veil', 100, 300, ARRAY['https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=600&fit=crop'], 'Classic fingertip length veil with subtle beading along the edge.', false),
('acc-jewelry-1', 'Pearl Necklace Set', 'jewelry', 120, 500, ARRAY['https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&h=600&fit=crop'], 'Timeless pearl necklace and earring set. Freshwater pearls with sterling silver.', true),
('acc-jewelry-2', 'Crystal Drop Earrings', 'jewelry', 80, 250, ARRAY['https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&h=600&fit=crop'], 'Sparkling crystal drop earrings that catch the light beautifully.', false),
('acc-jewelry-3', 'Diamond Bracelet', 'jewelry', 200, 800, ARRAY['https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&h=600&fit=crop'], 'Elegant diamond tennis bracelet with lab-grown diamonds.', true),
('acc-headpiece-1', 'Floral Crown', 'headpiece', 100, 350, ARRAY['https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=600&fit=crop'], 'Delicate floral crown with preserved flowers and greenery.', false),
('acc-headpiece-2', 'Crystal Tiara', 'headpiece', 150, 600, ARRAY['https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&h=600&fit=crop'], 'Regal crystal tiara perfect for a princess-style wedding.', true),
('acc-headpiece-3', 'Pearl Hair Comb', 'headpiece', 60, 180, ARRAY['https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=600&fit=crop'], 'Elegant pearl hair comb for a subtle, sophisticated accent.', false),
('acc-shoes-1', 'Satin Pumps', 'shoes', 80, 250, ARRAY['https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&h=600&fit=crop'], 'Classic ivory satin pumps with 3-inch heel. Comfortable and elegant.', false),
('acc-shoes-2', 'Embellished Heels', 'shoes', 120, 400, ARRAY['https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&h=600&fit=crop'], 'Stunning heels with crystal embellishments. Make a statement with every step.', true),
('acc-shoes-3', 'Ballet Flats', 'shoes', 50, 150, ARRAY['https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&h=600&fit=crop'], 'Comfortable ballet flats with delicate lace detail. Perfect for dancing.', false),
('acc-clutch-1', 'Pearl Clutch', 'clutch', 60, 200, ARRAY['https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=800&h=600&fit=crop'], 'Elegant pearl-embellished clutch with chain strap.', false),
('acc-clutch-2', 'Satin Evening Bag', 'clutch', 40, 120, ARRAY['https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=800&h=600&fit=crop'], 'Simple and elegant satin evening bag in ivory.', false),
('acc-clutch-3', 'Crystal Minaudière', 'clutch', 100, 350, ARRAY['https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=800&h=600&fit=crop'], 'Luxurious crystal-covered minaudière for a glamorous touch.', true)
ON CONFLICT (id) DO NOTHING;

-- CATERING PACKAGES
INSERT INTO public.catering_packages (id, name, description, price_per_guest, min_guests, includes, image) VALUES
('pkg-buffet-classic', 'Classic Buffet', 'A crowd-pleasing selection of international favorites served buffet style.', 45, 30, ARRAY['2 Appetizers', '3 Main Courses', '2 Sides', 'Dessert Station', 'Soft Drinks'], 'https://images.unsplash.com/photo-1555244162-803834f70033?w=800&h=600&fit=crop'),
('pkg-plated-gold', 'Gold Plated Service', 'Elegant 3-course sit-down dinner with table service.', 85, 10, ARRAY['Plated Salad/Soup', 'Choice of Entree', 'Plated Dessert', 'Coffee & Tea Service'], 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&h=600&fit=crop'),
('pkg-stations-royal', 'Royal Live Stations', 'Interactive cooking stations offering fresh sushi, carving, and pasta.', 110, 50, ARRAY['3 Live Stations', 'Roaming Canapés', 'Dessert Bar', 'Premium Mocktails'], 'https://images.unsplash.com/photo-1547924475-650f0980489c?w=800&h=600&fit=crop')
ON CONFLICT (id) DO NOTHING;

-- MENU ITEMS
INSERT INTO public.menu_items (id, name, description, price, category, dietary, image) VALUES
('app-bruschetta', 'Heirloom Tomato Bruschetta', 'Toasted baguette with basil pesto, heirloom tomatoes, and balsamic glaze.', 0, 'appetizer', ARRAY['v', 'vg'], 'https://images.unsplash.com/photo-1572695157363-bc31c5d53163?w=600&fit=crop'),
('main-salmon', 'Pan-Seared Salmon', 'Atlantic salmon with lemon butter sauce and asparagus.', 0, 'main', ARRAY['gf', 'df'], 'https://images.unsplash.com/photo-1467003909585-2f8a7270028d?w=600&fit=crop'),
('main-steak', 'Filet Mignon', 'Tenderloin steak with rosemary reduction.', 0, 'main', ARRAY['gf'], 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=600&fit=crop'),
('dessert-tiramisu', 'Classic Tiramisu', 'Espresso-soaked ladyfingers with mascarpone cream.', 0, 'dessert', ARRAY['v'], 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&fit=crop')
ON CONFLICT (id) DO NOTHING;

-- GIFT PACKAGES
INSERT INTO public.gift_packages (id, name, description, price, category, contents, image) VALUES 
('graduation-premium', 'Premium Graduation Box', 'A luxurious gift package for the new graduate including a personalized stole, premium notebook, and commemorative plaque.', 150.00, 'graduation', ARRAY['Personalized Stole', 'Premium Notebook', 'Commemorative Plaque', 'Signature Pen'], 'https://images.unsplash.com/photo-1523240715630-67bb23d6f0b4?auto=format&fit=crop&q=80&w=800'),
('birthday-sparkle', 'Birthday Sparkle Package', 'Make their day special with this curated set of luxury candles, artisanal chocolates, and a personalized greeting card.', 85.00, 'birthday', ARRAY['Luxury Candle Set', 'Artisanal Chocolates', 'Silk Ribbon', 'Handwritten Card'], 'https://images.unsplash.com/photo-1549465220-1a18274d8122?auto=format&fit=crop&q=80&w=800'),
('partner-romance', 'Romantic Partner Getaway', 'The ultimate surprise for your partner featuring a collection of premium spa products and a bottle of non-alcoholic sparkling cider.', 120.00, 'partner', ARRAY['Organic Spa Set', 'Plush Robe', 'Sparkling Cider', 'Rose Petal Potpourri'], 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&q=80&w=800')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 8. SYNC EXISTING USERS & GRANT ADMIN ACCESS
-- ============================================================================

-- Backfill profiles for any users created in auth.users
INSERT INTO public.profiles (id, full_name, role)
SELECT 
  id, 
  COALESCE(raw_user_meta_data->>'full_name', 'Admin User'), 
  'user'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Promote the client's email to admin
UPDATE public.profiles
SET role = 'admin',
    full_name = 'Elias Degafe'
WHERE id = (SELECT id FROM auth.users WHERE email = 'eliasdegafe3633@gmail.com');

-- Ensure email is confirmed for eliasdegafe3633@gmail.com
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email = 'eliasdegafe3633@gmail.com';
