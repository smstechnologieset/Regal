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

CREATE TABLE public.profiles (
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
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

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
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- CATEGORIES & PRODUCTS (Attire Shop)
-- =====================================================

-- Categories table
CREATE TABLE public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  image TEXT,
  subcategories JSONB DEFAULT '[]'
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-only access to categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL USING (public.is_admin());

-- Products table
CREATE TABLE public.products (
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
CREATE POLICY "Allow public read-only access to products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Admins can manage products" ON public.products FOR ALL USING (public.is_admin());

-- =====================================================
-- EVENT PLANNING
-- =====================================================

-- Event packages table
CREATE TABLE public.event_packages (
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
CREATE POLICY "Allow public read-only access to event_packages" ON public.event_packages FOR SELECT USING (true);
CREATE POLICY "Admins can manage event_packages" ON public.event_packages FOR ALL USING (public.is_admin());

-- =====================================================
-- BRIDAL SERVICES
-- =====================================================

-- Bridal gowns table
CREATE TABLE public.bridal_gowns (
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
CREATE POLICY "Allow public read-only access to bridal_gowns" ON public.bridal_gowns FOR SELECT USING (true);
CREATE POLICY "Admins can manage bridal_gowns" ON public.bridal_gowns FOR ALL USING (public.is_admin());

-- Bridal services table
CREATE TABLE public.bridal_services (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  price_start DECIMAL(10, 2),
  duration TEXT,
  type TEXT CHECK (type IN ('makeup', 'hair', 'full-styling', 'fitting')),
  image TEXT
);

ALTER TABLE public.bridal_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-only access to bridal_services" ON public.bridal_services FOR SELECT USING (true);
CREATE POLICY "Admins can manage bridal_services" ON public.bridal_services FOR ALL USING (public.is_admin());

-- =====================================================
-- CATERING SERVICES
-- =====================================================

-- Catering packages table
CREATE TABLE public.catering_packages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price_per_guest DECIMAL(10, 2) NOT NULL,
  min_guests INTEGER DEFAULT 10,
  includes TEXT[] DEFAULT '{}',
  image TEXT
);

ALTER TABLE public.catering_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-only access to catering_packages" ON public.catering_packages FOR SELECT USING (true);
CREATE POLICY "Admins can manage catering_packages" ON public.catering_packages FOR ALL USING (public.is_admin());

-- Menu items table
CREATE TABLE public.menu_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) DEFAULT 0,
  category TEXT CHECK (category IN ('appetizer', 'main', 'dessert', 'drink', 'station')),
  dietary TEXT[] DEFAULT '{}',
  image TEXT
);

ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-only access to menu_items" ON public.menu_items FOR SELECT USING (true);
CREATE POLICY "Admins can manage menu_items" ON public.menu_items FOR ALL USING (public.is_admin());

-- =====================================================
-- ORDERS TABLE
-- =====================================================

CREATE TABLE public.orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  service_type TEXT NOT NULL CHECK (service_type IN ('attire', 'events', 'bridal', 'catering')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  details JSONB DEFAULT '{}',
  total DECIMAL(10, 2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Policies for orders
CREATE POLICY "Users can view their own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders"
  ON public.orders FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can update all orders"
  ON public.orders FOR UPDATE
  USING (public.is_admin());

-- Index for faster queries
CREATE INDEX orders_user_id_idx ON public.orders(user_id);
CREATE INDEX orders_status_idx ON public.orders(status);
CREATE INDEX orders_service_type_idx ON public.orders(service_type);

-- =====================================================
-- CONVERSATIONS TABLE
-- =====================================================

CREATE TABLE public.conversations (
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

-- Enable Row Level Security
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Policies for conversations
CREATE POLICY "Users can view their own conversations"
  ON public.conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all conversations"
  ON public.conversations FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can update all conversations"
  ON public.conversations FOR UPDATE
  USING (public.is_admin());

-- Index for faster queries
CREATE INDEX conversations_user_id_idx ON public.conversations(user_id);
CREATE INDEX conversations_status_idx ON public.conversations(status);

-- =====================================================
-- MESSAGES TABLE
-- =====================================================

CREATE TABLE public.messages (
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
CREATE POLICY "Users can view messages in their conversations"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE id = conversation_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages in their conversations"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE id = conversation_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all messages"
  ON public.messages FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update messages (mark read)"
  ON public.messages FOR UPDATE
  USING (public.is_admin());

-- Index for faster queries
CREATE INDEX messages_conversation_id_idx ON public.messages(conversation_id);
CREATE INDEX messages_created_at_idx ON public.messages(created_at);

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

CREATE TRIGGER on_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.update_conversation_last_message();

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

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
