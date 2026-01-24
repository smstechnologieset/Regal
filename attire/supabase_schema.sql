-- =====================================================
-- REGAL PLATFORM DATABASE SCHEMA
-- =====================================================
-- Run this SQL in Supabase SQL Editor to create all tables
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PROFILES TABLE
-- =====================================================
-- Extends auth.users with additional profile information

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Function to check if user is admin (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = auth.uid();
  
  RETURN user_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Policies for profiles
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can view their own profile') THEN
        CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can update their own profile') THEN
        CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Admins can view all profiles') THEN
        CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.is_admin());
    END IF;
END $$;

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
        CREATE TRIGGER on_auth_user_created
          AFTER INSERT ON auth.users
          FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    END IF;
END $$;

-- =====================================================
-- CLEANUP BLOCK: Fix wrong ID types if they exist
-- =====================================================
DO $$ 
BEGIN 
    -- If categories.id is UUID, we need to drop and recreate the service tables
    -- as we use TEXT (slug-based) IDs for the Regal platform.
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'categories' 
        AND column_name = 'id' 
        AND data_type = 'uuid'
    ) THEN
        DROP TABLE IF EXISTS public.menu_items CASCADE;
        DROP TABLE IF EXISTS public.catering_packages CASCADE;
        DROP TABLE IF EXISTS public.bridal_services CASCADE;
        DROP TABLE IF EXISTS public.bridal_gowns CASCADE;
        DROP TABLE IF EXISTS public.event_packages CASCADE;
        DROP TABLE IF EXISTS public.products CASCADE;
        DROP TABLE IF EXISTS public.categories CASCADE;
    END IF;
END $$;

-- Categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  image TEXT,
  subcategories JSONB DEFAULT '[]'
);

-- Ensure all required columns exist in categories (in case table was created by an older script)
DO $$ 
BEGIN 
    -- Add slug if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='categories' AND column_name='slug') THEN
        ALTER TABLE public.categories ADD COLUMN slug TEXT;
        UPDATE public.categories SET slug = id WHERE slug IS NULL;
        ALTER TABLE public.categories ALTER COLUMN slug SET NOT NULL;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'categories_slug_key') THEN
            ALTER TABLE public.categories ADD CONSTRAINT categories_slug_key UNIQUE (slug);
        END IF;
    END IF;

    -- Add image if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='categories' AND column_name='image') THEN
        ALTER TABLE public.categories ADD COLUMN image TEXT;
    END IF;

    -- Add subcategories if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='categories' AND column_name='subcategories') THEN
        ALTER TABLE public.categories ADD COLUMN subcategories JSONB DEFAULT '[]';
    END IF;
END $$;

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Allow public read-only access to categories') THEN
        CREATE POLICY "Allow public read-only access to categories" ON public.categories FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Admins can manage categories') THEN
        CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL USING (public.is_admin());
    END IF;
END $$;

-- Products table
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Ensure all required columns exist in products
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='description') THEN ALTER TABLE public.products ADD COLUMN description TEXT; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='original_price') THEN ALTER TABLE public.products ADD COLUMN original_price DECIMAL(10, 2); END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='category') THEN ALTER TABLE public.products ADD COLUMN category TEXT REFERENCES public.categories(id); END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='subcategory') THEN ALTER TABLE public.products ADD COLUMN subcategory TEXT; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='sizes') THEN ALTER TABLE public.products ADD COLUMN sizes TEXT[] DEFAULT '{}'; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='colors') THEN ALTER TABLE public.products ADD COLUMN colors JSONB DEFAULT '[]'; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='images') THEN ALTER TABLE public.products ADD COLUMN images TEXT[] DEFAULT '{}'; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='badges') THEN ALTER TABLE public.products ADD COLUMN badges TEXT[] DEFAULT '{}'; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='rating') THEN ALTER TABLE public.products ADD COLUMN rating DECIMAL(2, 1) DEFAULT 0; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='review_count') THEN ALTER TABLE public.products ADD COLUMN review_count INTEGER DEFAULT 0; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='popularity') THEN ALTER TABLE public.products ADD COLUMN popularity INTEGER DEFAULT 0; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='in_stock') THEN ALTER TABLE public.products ADD COLUMN in_stock BOOLEAN DEFAULT TRUE; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='stock_count') THEN ALTER TABLE public.products ADD COLUMN stock_count INTEGER DEFAULT 0; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='created_at') THEN ALTER TABLE public.products ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW(); END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Allow public read-only access to products') THEN
        CREATE POLICY "Allow public read-only access to products" ON public.products FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Admins can manage products') THEN
        CREATE POLICY "Admins can manage products" ON public.products FOR ALL USING (public.is_admin());
    END IF;
END $$;

-- =====================================================
-- EVENT PLANNING
-- =====================================================

-- Event packages table
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
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Allow public read-only access to event_packages') THEN
        CREATE POLICY "Allow public read-only access to event_packages" ON public.event_packages FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Admins can manage event_packages') THEN
        CREATE POLICY "Admins can manage event_packages" ON public.event_packages FOR ALL USING (public.is_admin());
    END IF;
END $$;

-- =====================================================
-- BRIDAL SERVICES
-- =====================================================

-- Bridal gowns table
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
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Allow public read-only access to bridal_gowns') THEN
        CREATE POLICY "Allow public read-only access to bridal_gowns" ON public.bridal_gowns FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Admins can manage bridal_gowns') THEN
        CREATE POLICY "Admins can manage bridal_gowns" ON public.bridal_gowns FOR ALL USING (public.is_admin());
    END IF;
END $$;

-- Bridal services table
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
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Allow public read-only access to bridal_services') THEN
        CREATE POLICY "Allow public read-only access to bridal_services" ON public.bridal_services FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Admins can manage bridal_services') THEN
        CREATE POLICY "Admins can manage bridal_services" ON public.bridal_services FOR ALL USING (public.is_admin());
    END IF;
END $$;

-- =====================================================
-- CATERING SERVICES
-- =====================================================

-- Catering packages table
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
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Allow public read-only access to catering_packages') THEN
        CREATE POLICY "Allow public read-only access to catering_packages" ON public.catering_packages FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Admins can manage catering_packages') THEN
        CREATE POLICY "Admins can manage catering_packages" ON public.catering_packages FOR ALL USING (public.is_admin());
    END IF;
END $$;

-- Menu items table
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
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Allow public read-only access to menu_items') THEN
        CREATE POLICY "Allow public read-only access to menu_items" ON public.menu_items FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Admins can manage menu_items') THEN
        CREATE POLICY "Admins can manage menu_items" ON public.menu_items FOR ALL USING (public.is_admin());
    END IF;
END $$;

-- =====================================================
-- ORDERS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  service_type TEXT NOT NULL CHECK (service_type IN ('attire', 'events', 'bridal', 'catering')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  details JSONB DEFAULT '{}',
  total DECIMAL(10, 2) DEFAULT 0,
  notes TEXT,
  shipping_address JSONB DEFAULT '{}',
  promo_code TEXT,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Promo Codes Table
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10, 2) NOT NULL,
  min_purchase DECIMAL(10, 2) DEFAULT 0,
  usage_limit INTEGER, -- NULL for unlimited
  usage_count INTEGER DEFAULT 0,
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for promo_codes
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- Policies for promo_codes
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Allow public read-only access to promo_codes') THEN
        CREATE POLICY "Allow public read-only access to promo_codes" ON public.promo_codes FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Admins can manage promo_codes') THEN
        CREATE POLICY "Admins can manage promo_codes" ON public.promo_codes FOR ALL USING (public.is_admin());
    END IF;
END $$;

-- Function to increment promo usage
CREATE OR REPLACE FUNCTION public.increment_promo_usage(p_code TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.promo_codes
  SET usage_count = usage_count + 1
  WHERE code = p_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable Row Level Security
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Policies for orders
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can view their own orders') THEN
        CREATE POLICY "Users can view their own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can create their own orders') THEN
        CREATE POLICY "Users can create their own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Admins can view all orders') THEN
        CREATE POLICY "Admins can view all orders" ON public.orders FOR SELECT USING (public.is_admin());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Admins can update all orders') THEN
        CREATE POLICY "Admins can update all orders" ON public.orders FOR UPDATE USING (public.is_admin());
    END IF;

    -- Ensure shipping_address column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='shipping_address') THEN
        ALTER TABLE public.orders ADD COLUMN shipping_address JSONB DEFAULT '{}';
    END IF;
END $$;

-- Index for faster queries
CREATE INDEX IF NOT EXISTS orders_user_id_idx ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS orders_status_idx ON public.orders(status);
CREATE INDEX IF NOT EXISTS orders_service_type_idx ON public.orders(service_type);

-- =====================================================
-- CONVERSATIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  service_type TEXT DEFAULT 'general' CHECK (service_type IN ('attire', 'events', 'bridal', 'catering', 'general')),
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  subject TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- 
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Policies for conversations
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can view their own conversations') THEN
        CREATE POLICY "Users can view their own conversations" ON public.conversations FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can create their own conversations') THEN
        CREATE POLICY "Users can create their own conversations" ON public.conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Admins can view all conversations') THEN
        CREATE POLICY "Admins can view all conversations" ON public.conversations FOR SELECT USING (public.is_admin());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Admins can update all conversations') THEN
        CREATE POLICY "Admins can update all conversations" ON public.conversations FOR UPDATE USING (public.is_admin());
    END IF;
END $$;

-- Index for faster queries
CREATE INDEX IF NOT EXISTS conversations_user_id_idx ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS conversations_status_idx ON public.conversations(status);

-- =====================================================
-- MESSAGES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policies for messages
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can view messages in their conversations') THEN
        CREATE POLICY "Users can view messages in their conversations" ON public.messages FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM public.conversations
                WHERE id = conversation_id AND user_id = auth.uid()
            )
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can send messages in their conversations') THEN
        CREATE POLICY "Users can send messages in their conversations" ON public.messages FOR INSERT WITH CHECK (
            auth.uid() = sender_id AND
            EXISTS (
                SELECT 1 FROM public.conversations
                WHERE id = conversation_id AND user_id = auth.uid()
            )
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Admins can view all messages') THEN
        CREATE POLICY "Admins can view all messages" ON public.messages FOR SELECT USING (public.is_admin());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Admins can send messages') THEN
        CREATE POLICY "Admins can send messages" ON public.messages FOR INSERT WITH CHECK (public.is_admin());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Admins can update messages (mark read)') THEN
        CREATE POLICY "Admins can update messages (mark read)" ON public.messages FOR UPDATE USING (public.is_admin());
    END IF;
END $$;

-- Index for faster queries
CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON public.messages(created_at);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Update last_message_at on new message
CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET last_message_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_new_message') THEN
        CREATE TRIGGER on_new_message
          AFTER INSERT ON public.messages
          FOR EACH ROW EXECUTE FUNCTION public.update_conversation_last_message();
    END IF;
END $$;

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_updated_at') THEN
        CREATE TRIGGER update_profiles_updated_at
          BEFORE UPDATE ON public.profiles
          FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_orders_updated_at') THEN
        CREATE TRIGGER update_orders_updated_at
          BEFORE UPDATE ON public.orders
          FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
    END IF;
END $$;

-- =====================================================
-- CREATE YOUR FIRST ADMIN USER
-- =====================================================
-- After creating a user via the auth UI or signup,
-- run this query to make them an admin:
--
-- UPDATE public.profiles
-- SET role = 'admin'
-- WHERE id = 'YOUR_USER_UUID_HERE';
-- =====================================================
