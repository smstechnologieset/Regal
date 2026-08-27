-- =====================================================
-- NEWSLETTER SUBSCRIBERS
-- =====================================================
-- Stores newsletter sign-ups from the footer form.
-- Writes go through the admin (service-role) API route, so no public RLS
-- policy is required. Run in the Supabase SQL Editor.
-- =====================================================

CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
-- No public policies: only the service-role API route can read/write.
