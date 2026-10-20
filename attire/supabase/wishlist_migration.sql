-- Idempotent Migration: Fix Wishlist Table & PostgREST Permissions
-- Run this in the Supabase SQL Editor: https://supabase.com/dashboard/project/jxivigzylwevroztsffl/sql

-- 1. Ensure table exists
CREATE TABLE IF NOT EXISTS public.wishlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- 2. Enable Row Level Security
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;

-- 3. Safely drop existing policies so re-running never fails with ERROR 42710
DROP POLICY IF EXISTS "Users can view their own wishlist" ON public.wishlist;
DROP POLICY IF EXISTS "Users can insert into their own wishlist" ON public.wishlist;
DROP POLICY IF EXISTS "Users can delete from their own wishlist" ON public.wishlist;
DROP POLICY IF EXISTS "Users can manage their own wishlist" ON public.wishlist;

-- 4. Re-create clean RLS policies
CREATE POLICY "Users can view their own wishlist"
    ON public.wishlist FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert into their own wishlist"
    ON public.wishlist FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete from their own wishlist"
    ON public.wishlist FOR DELETE
    USING (auth.uid() = user_id);

-- 5. Create index for performance
CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON public.wishlist(user_id);

-- 6. Grant API permissions so PostgREST exposes the endpoint (Fixes the 404 Not Found)
GRANT ALL ON TABLE public.wishlist TO authenticated;
GRANT ALL ON TABLE public.wishlist TO anon;
GRANT ALL ON TABLE public.wishlist TO service_role;

-- 7. Reload PostgREST schema cache immediately
NOTIFY pgrst, 'reload schema';
