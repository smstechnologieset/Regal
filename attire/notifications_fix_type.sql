-- =====================================================
-- FIX NOTIFICATION TYPE CONSTRAINT
-- =====================================================
-- Run this SQL in Supabase SQL Editor to fix the type constraint
-- This changes 'order_status' to 'order' in the check constraint
-- =====================================================

-- Drop the old constraint
ALTER TABLE public.notifications 
DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add the new constraint with 'order' instead of 'order_status'
ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_type_check 
CHECK (type IN ('message', 'order', 'general'));

-- Verify the constraint was updated
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'public.notifications'::regclass 
AND conname = 'notifications_type_check';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
