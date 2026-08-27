-- =====================================================
-- NOTIFICATIONS SYSTEM MIGRATION
-- =====================================================
-- Run this SQL in Supabase SQL Editor to create notifications system
-- =====================================================

-- =====================================================
-- NOTIFICATIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('message', 'order', 'general')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_read_idx ON public.notifications(read);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_user_read_idx ON public.notifications(user_id, read);

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" 
ON public.notifications FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" 
ON public.notifications FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
CREATE POLICY "Users can delete their own notifications" 
ON public.notifications FOR DELETE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all notifications" ON public.notifications;
CREATE POLICY "Admins can view all notifications" 
ON public.notifications FOR SELECT 
USING (public.is_admin());

DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "System can insert notifications" 
ON public.notifications FOR INSERT 
WITH CHECK (true);

-- =====================================================
-- TRIGGER: New Message Notification
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_message_notification()
RETURNS TRIGGER AS $$
DECLARE
  recipient_id UUID;
  sender_name TEXT;
  sender_role TEXT;
  conv_subject TEXT;
BEGIN
  -- Get conversation details
  SELECT user_id, subject INTO recipient_id, conv_subject
  FROM public.conversations
  WHERE id = NEW.conversation_id;
  
  -- Get sender details
  SELECT full_name, role INTO sender_name, sender_role
  FROM public.profiles
  WHERE id = NEW.sender_id;
  
  -- Only create notification if sender is admin and recipient is not the sender
  IF sender_role = 'admin' AND recipient_id != NEW.sender_id THEN
    INSERT INTO public.notifications (user_id, type, title, message, link, metadata)
    VALUES (
      recipient_id,
      'message',
      'New message from ' || COALESCE(sender_name, 'Support'),
      LEFT(NEW.content, 100) || CASE WHEN LENGTH(NEW.content) > 100 THEN '...' ELSE '' END,
      '/account/messages/' || NEW.conversation_id,
      jsonb_build_object(
        'conversation_id', NEW.conversation_id, 
        'message_id', NEW.id,
        'sender_id', NEW.sender_id
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_new_message_notification ON public.messages;
CREATE TRIGGER on_new_message_notification
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.create_message_notification();

-- =====================================================
-- TRIGGER: Order Status Change Notification
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_order_status_notification()
RETURNS TRIGGER AS $$
DECLARE
  status_message TEXT;
  status_title TEXT;
BEGIN
  -- Only create notification if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Create appropriate message based on status
    CASE NEW.status
      WHEN 'confirmed' THEN
        status_title := 'Order Confirmed';
        status_message := 'Your order has been confirmed and is being processed.';
      WHEN 'in_progress' THEN
        status_title := 'Order In Progress';
        status_message := 'Your order is now in progress.';
      WHEN 'completed' THEN
        status_title := 'Order Completed';
        status_message := 'Your order has been completed! Thank you for your business.';
      WHEN 'cancelled' THEN
        status_title := 'Order Cancelled';
        status_message := 'Your order has been cancelled.';
      ELSE
        status_title := 'Order Status Update';
        status_message := 'Your order status has been updated to ' || NEW.status || '.';
    END CASE;
    
    INSERT INTO public.notifications (user_id, type, title, message, link, metadata)
    VALUES (
      NEW.user_id,
      'order',
      status_title,
      status_message,
      '/account/orders/' || NEW.id,
      jsonb_build_object(
        'order_id', NEW.id, 
        'old_status', OLD.status, 
        'new_status', NEW.status,
        'service_type', NEW.service_type
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_order_status_change_notification ON public.orders;
CREATE TRIGGER on_order_status_change_notification
  AFTER UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.create_order_status_notification();

-- =====================================================
-- FUNCTION: Cleanup Old Notifications (Optional)
-- =====================================================
-- This function can be called manually or scheduled to delete old notifications

CREATE OR REPLACE FUNCTION public.cleanup_old_notifications(days_old INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.notifications
  WHERE created_at < NOW() - (days_old || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TESTING QUERIES (Optional - for verification)
-- =====================================================

-- To test the notification system after setup:

-- 1. Check if notifications table exists and is empty
-- SELECT COUNT(*) FROM public.notifications;

-- 2. Test message notification trigger:
-- (As admin, send a message to a user conversation)
-- INSERT INTO public.messages (conversation_id, sender_id, content)
-- VALUES ('conversation-uuid', 'admin-user-uuid', 'Test message');

-- 3. Test order status notification trigger:
-- UPDATE public.orders 
-- SET status = 'confirmed' 
-- WHERE id = 'order-uuid';

-- 4. View all notifications for a user:
-- SELECT * FROM public.notifications 
-- WHERE user_id = 'user-uuid' 
-- ORDER BY created_at DESC;

-- 5. Cleanup old notifications (older than 30 days):
-- SELECT public.cleanup_old_notifications(30);

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
