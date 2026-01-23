-- Fix RLS policy for promo_codes table
-- This allows public read access to validate promo codes

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow public read-only access to promo_codes" ON public.promo_codes;

-- Create policy for public read access
CREATE POLICY "Allow public read-only access to promo_codes" 
ON public.promo_codes 
FOR SELECT 
USING (true);

-- Verify RLS is enabled
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
