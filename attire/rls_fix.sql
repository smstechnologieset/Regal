-- =====================================================
-- FIX: RECURSIVE RLS POLICIES
-- =====================================================
-- This script fixes the 500 Internal Server Error caused by
-- infinite recursion in the profiles table RLS policies.
-- =====================================================

-- 1. Create a helper function to check admin status without recursion
-- SECURITY DEFINER bypasses RLS, so it can check the profiles table safely.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop existing problematic policies on profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- 3. Re-create the admin view policy using the helper function
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

-- 4. Update other tables to use the more efficient helper function
-- This isn't strictly necessary for non-recursive tables, but it's cleaner.

-- Orders policies
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update all orders" ON public.orders;
CREATE POLICY "Admins can view all orders" ON public.orders FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can update all orders" ON public.orders FOR UPDATE USING (public.is_admin());

-- Conversations policies
DROP POLICY IF EXISTS "Admins can view all conversations" ON public.conversations;
DROP POLICY IF EXISTS "Admins can update all conversations" ON public.conversations;
CREATE POLICY "Admins can view all conversations" ON public.conversations FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can update all conversations" ON public.conversations FOR UPDATE USING (public.is_admin());

-- Messages policies
DROP POLICY IF EXISTS "Admins can view all messages" ON public.messages;
DROP POLICY IF EXISTS "Admins can send messages" ON public.messages;
DROP POLICY IF EXISTS "Admins can update messages (mark read)" ON public.messages;
CREATE POLICY "Admins can view all messages" ON public.messages FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can send messages" ON public.messages FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update messages (mark read)" ON public.messages FOR UPDATE USING (public.is_admin());

-- =====================================================
-- VERIFICATION:
-- Now, SELECT * FROM profiles WHERE id = 'your-id' 
-- should work without triggering infinite recursion.
-- =====================================================
