# Notifications System - Testing Guide

## Overview

The customer notifications system is now fully implemented. This guide will help you test all features.

## What's Been Implemented

### 1. Database Layer

- **Table**: `notifications` table with proper indexes and RLS policies
- **Triggers**: Automatic notification creation for:
  - New messages from admin to users
  - Order status changes (confirmed, in_progress, completed, cancelled)
- **Location**: `attire/notifications_migration.sql`

### 2. Backend API

- `GET /api/notifications` - Fetch user notifications
- `PATCH /api/notifications/[id]` - Mark notification as read
- `DELETE /api/notifications/[id]` - Delete notification
- `POST /api/notifications/mark-all-read` - Mark all as read

### 3. Frontend Components

- **NotificationContext**: Real-time state management with Supabase subscriptions
- **NotificationBell**: Header icon with badge counter (shows when user is logged in)
- **NotificationDropdown**: Quick view of recent notifications
- **Notifications Page**: Full page with filtering, pagination, and delete

### 4. Features

- Real-time notifications (no page refresh needed)
- Badge counter showing unread count (max 99+)
- Notification grouping by date (Today, Yesterday, This Week, Older)
- Filter by type (All, Messages, Orders)
- Mark individual notifications as read
- Mark all notifications as read
- Delete individual notifications
- Pagination (20 per page)
- Click notification to navigate to relevant page

## Testing Steps

### Step 1: Run Database Migration

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy contents of `attire/notifications_migration.sql`
4. Run the SQL
5. Verify no errors

### Step 2: Test Message Notifications

1. **As Admin**:
   - Log in as admin user
   - Go to Admin Dashboard → Messages
   - Find a user conversation or create one
   - Send a message to the user

2. **As User** (in different browser/incognito):
   - Log in as the user
   - You should see:
     - Notification bell icon in header (between wishlist and account)
     - Red badge with count "1"
     - Notification appears instantly (real-time)
   - Click the bell icon
   - Verify notification shows:
     - "New message from [Admin Name]"
     - Message preview
     - Time elapsed (e.g., "just now")
     - Blue dot indicating unread
   - Click the notification
   - Should navigate to `/account/messages/[conversation-id]`
   - Notification should be marked as read
   - Badge counter should decrease

### Step 3: Test Order Status Notifications

1. **As Admin**:
   - Go to Admin Dashboard → Orders
   - Find a user's order
   - Change status from "pending" to "confirmed"

2. **As User**:
   - Should see notification bell badge increase
   - Open dropdown
   - Verify notification shows:
     - "Order Confirmed"
     - "Your order has been confirmed and is being processed."
     - Package icon
   - Click notification
   - Should navigate to order details

3. **Test Other Status Changes**:
   - Change order to "in_progress" → Should get "Order In Progress" notification
   - Change order to "completed" → Should get "Order Completed" notification
   - Change order to "cancelled" → Should get "Order Cancelled" notification

### Step 4: Test Notification Actions

1. **Mark as Read**:
   - Click any unread notification
   - Blue dot should disappear
   - Badge counter should decrease
   - Notification should stay in list but appear as read

2. **Mark All as Read**:
   - Have multiple unread notifications
   - Click "Mark all as read" button in dropdown
   - All notifications should be marked as read
   - Badge should disappear

3. **Delete Notification**:
   - Go to `/account/notifications` (full page)
   - Hover over a notification
   - Click trash icon
   - Notification should be removed from list

### Step 5: Test Filtering and Pagination

1. **Filtering**:
   - Go to `/account/notifications`
   - Click "Messages" tab → Should show only message notifications
   - Click "Orders" tab → Should show only order notifications
   - Click "All" tab → Should show all notifications
   - Verify URL updates with filter parameter

2. **Pagination**:
   - Create 25+ notifications (send messages, change order statuses)
   - Go to notifications page
   - Should see 20 notifications per page
   - Click "Next" → Should show next 20
   - Click "Previous" → Should go back
   - Page number should update

### Step 6: Test Real-Time Updates

1. **Open Two Browser Windows**:
   - Window 1: User logged in, on any page
   - Window 2: Admin logged in

2. **Send Message as Admin** (Window 2):
   - Send message to user

3. **Verify Real-Time** (Window 1):
   - Notification should appear instantly
   - Badge counter should update
   - No page refresh needed

### Step 7: Test Edge Cases

1. **No Notifications**:
   - Delete all notifications
   - Verify empty state shows:
     - Bell icon with no badge
     - Dropdown shows "No notifications"
     - Full page shows "You're all caught up!"

2. **Badge Counter Limit**:
   - Create 100+ unread notifications
   - Badge should show "99+"

3. **Logout/Login**:
   - Create notifications
   - Log out
   - Log back in
   - Notifications should persist
   - Unread count should be correct

## Troubleshooting

### Notifications Not Appearing

1. **Check Database**:

   ```sql
   SELECT * FROM public.notifications
   WHERE user_id = 'your-user-id'
   ORDER BY created_at DESC;
   ```

2. **Check Triggers**:

   ```sql
   -- Test message trigger
   SELECT * FROM pg_trigger WHERE tgname = 'on_new_message_notification';

   -- Test order trigger
   SELECT * FROM pg_trigger WHERE tgname = 'on_order_status_change_notification';
   ```

3. **Check RLS Policies**:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'notifications';
   ```

### Real-Time Not Working

1. Check Supabase Realtime is enabled for `notifications` table
2. Check browser console for errors
3. Verify user is logged in
4. Check network tab for WebSocket connection

### Badge Not Showing

1. Verify user is logged in (bell only shows when authenticated)
2. Check if notifications exist and are unread
3. Check browser console for errors

## API Testing (Optional)

You can test the API directly using curl or Postman:

```bash
# Get notifications
curl -X GET http://localhost:3000/api/notifications \
  -H "Cookie: your-session-cookie"

# Mark as read
curl -X PATCH http://localhost:3000/api/notifications/[notification-id] \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{"read": true}'

# Delete notification
curl -X DELETE http://localhost:3000/api/notifications/[notification-id] \
  -H "Cookie: your-session-cookie"

# Mark all as read
curl -X POST http://localhost:3000/api/notifications/mark-all-read \
  -H "Cookie: your-session-cookie"
```

## Success Criteria

✅ Notifications appear instantly when created (real-time)
✅ Badge counter shows correct unread count
✅ Clicking notification marks it as read and navigates
✅ Mark all as read works
✅ Delete notification works
✅ Filtering by type works
✅ Pagination works
✅ Notifications persist after logout/login
✅ Empty state displays correctly
✅ No console errors

## Next Steps (Future Enhancements)

- Sound notifications (optional, user preference)
- Email notifications for important events
- Push notifications (PWA)
- Notification preferences (user can choose which types to receive)
- Scheduled cleanup of old notifications (30+ days)
- Notification categories/priorities
- Bulk actions (delete all, mark all as read by type)

## Files Modified/Created

### Created:

- `attire/notifications_migration.sql`
- `attire/src/context/NotificationContext.tsx`
- `attire/src/components/notifications/NotificationBell.tsx`
- `attire/src/components/notifications/NotificationDropdown.tsx`
- `attire/src/app/api/notifications/route.ts`
- `attire/src/app/api/notifications/[id]/route.ts`
- `attire/src/app/api/notifications/mark-all-read/route.ts`
- `attire/src/app/account/notifications/page.tsx`

### Modified:

- `attire/src/app/layout.tsx` (added NotificationProvider)
- `attire/src/components/layout/Header.tsx` (added NotificationBell)

## Support

If you encounter any issues during testing, check:

1. Browser console for JavaScript errors
2. Network tab for failed API requests
3. Supabase logs for database errors
4. Server logs for backend errors
