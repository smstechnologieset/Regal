-- Migration: Create Telegram Auth System
-- This script sets up the table for temporary Telegram login attempts.

-- 1. Create the telegram_auth_attempts table
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

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.telegram_auth_attempts ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
-- Only the service role (backend) should be able to manage this table.
-- We'll allow public to read a record if they know the session_id and code, 
-- but it's safer to keep it restricted to service_role entirely for backend-to-backend verification.

CREATE POLICY "Allow service role full access" 
ON public.telegram_auth_attempts 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- 4. Create an index on session_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_telegram_auth_session_id ON public.telegram_auth_attempts (session_id);

-- 5. Helper function to clean up expired attempts
CREATE OR REPLACE FUNCTION public.cleanup_expired_telegram_attempts()
RETURNS void AS $$
BEGIN
    DELETE FROM public.telegram_auth_attempts WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- Note: You should set up a cron job or call this cleanup periodically.
