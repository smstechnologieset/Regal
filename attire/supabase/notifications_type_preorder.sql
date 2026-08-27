-- =====================================================
-- WIDEN NOTIFICATION TYPE CONSTRAINT FOR PRE-ORDERS
-- =====================================================
-- The application inserts pre-order notification types that were missing from
-- the CHECK constraint, causing those inserts to fail silently. This adds them.
-- Run in the Supabase SQL Editor.
-- =====================================================

ALTER TABLE public.notifications
DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
ADD CONSTRAINT notifications_type_check
CHECK (type IN (
    'message',
    'order',
    'general',
    'preorder_ready',
    'preorder_insufficient_stock',
    'preorder_update'
));

-- Verify
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'public.notifications'::regclass
AND conname = 'notifications_type_check';
