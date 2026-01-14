-- ==========================================
-- FIX: Row Level Security (RLS) Recursion
-- ==========================================
-- This script fixes the infinite recursion in the is_admin() function
-- that causes pages to hang for authenticated users.
-- ==========================================

-- 1. Drop the existing function
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;

-- 2. Create a clean version that uses SECURITY DEFINER correctly
-- SECURITY DEFINER means this function runs with the privileges of the creator (postgres),
-- which bypasses RLS on the profiles table, preventing recursion.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Direct fetch of the role column
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = auth.uid();
  
  RETURN user_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 3. Ensure the policies are correctly using it
-- (They should already be, but let's re-confirm the logic)
-- ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
-- CREATE POLICY "Admins can manage products" ON public.products FOR ALL USING (public.is_admin());
