# Implementation Plan: Customer Notifications

## Overview

This plan implements a real-time notification system with database triggers, Realtime subscriptions, a notification bell in the header, and a full notifications page.

## Tasks

- [x] 1. Create notifications database table and triggers
  - Run SQL migration to create notifications table with indexes
  - Create trigger for new message notifications (admin to user)
  - Create trigger for order status change notifications
  - Add RLS policies for notifications table
  - Test triggers by creating test messages and updating order status
  - _Requirements: 2.1, 3.1, 3.2, 3.3, 3.4, 6.1, 6.2_

- [x] 2. Create NotificationContext
  - [x] 2.1 Create NotificationContext file with TypeScript interfaces
    - Define Notification interface
    - Define NotificationContextType interface
    - Create context and provider component
    - _Requirements: 7.1, 7.2_

  - [x] 2.2 Implement notification state management
    - Add notifications array state
    - Add unreadCount state
    - Add loading state
    - Calculate unread count from notifications array
    - _Requirements: 1.2, 5.4_

  - [x] 2.3 Implement fetchNotifications function
    - Fetch user notifications from API
    - Sort by created_at descending
    - Update state with fetched notifications
    - Handle errors gracefully
    - _Requirements: 6.2, 6.3_

  - [x] 2.4 Implement Supabase Realtime subscription
    - Subscribe to notifications table for current user
    - Listen for INSERT events
    - Add new notifications to state
    - Update unread count
    - Handle subscription cleanup on unmount
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x] 2.5 Implement markAsRead function
    - Call API to mark notification as read
    - Update local state
    - Decrease unread count
    - _Requirements: 5.1, 5.4_

  - [x] 2.6 Implement markAllAsRead function
    - Call API to mark all notifications as read
    - Update all notifications in state
    - Set unread count to 0
    - _Requirements: 5.2, 5.3, 5.5_

- [x] 3. Create notification API routes
  - [x] 3.1 Create GET /api/notifications route
    - Verify user authentication
    - Fetch notifications for current user
    - Support query parameters (limit, offset, type, unread_only)
    - Return notifications with total count and unread count
    - _Requirements: 4.1, 6.2_

  - [x] 3.2 Create PATCH /api/notifications/[id] route
    - Verify user authentication
    - Verify notification belongs to user
    - Update read status
    - Return updated notification
    - _Requirements: 5.1_

  - [x] 3.3 Create POST /api/notifications/mark-all-read route
    - Verify user authentication
    - Mark all user notifications as read
    - Return count of updated notifications
    - _Requirements: 5.2, 5.3_

- [x] 4. Create NotificationBell component
  - [x] 4.1 Create NotificationBell component file
    - Import Bell icon from lucide-react
    - Use NotificationContext for unread count
    - Add click handler to toggle dropdown
    - _Requirements: 1.1, 1.3_

  - [x] 4.2 Implement badge counter display
    - Show badge only when unreadCount > 0
    - Display count (max 99+)
    - Style badge with red background
    - Position badge at top-right of bell icon
    - _Requirements: 1.2, 1.5_

  - [x] 4.3 Implement dropdown toggle logic
    - Add isOpen state
    - Toggle on bell click
    - Close when clicking outside (useEffect with document listener)
    - _Requirements: 1.3, 1.4_

  - [x] 4.4 Add NotificationBell to Header component
    - Import NotificationBell
    - Place between search and user profile
    - Ensure proper spacing and alignment
    - _Requirements: 1.1_

- [x] 5. Create NotificationDropdown component
  - [x] 5.1 Create NotificationDropdown component file
    - Accept isOpen prop
    - Use NotificationContext for notifications
    - Implement dropdown positioning (absolute, right-aligned)
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 5.2 Implement notification grouping by date
    - Create helper function to group notifications
    - Groups: Today, Yesterday, This Week, Older
    - Display group headers
    - _Requirements: 4.4_

  - [x] 5.3 Implement notification list rendering
    - Map through grouped notifications
    - Display icon based on type
    - Display title and message
    - Display time elapsed
    - Show blue dot for unread notifications
    - Limit to 10 most recent
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 5.4 Implement notification click handler
    - Call markAsRead when notification clicked
    - Navigate to notification link
    - Close dropdown
    - _Requirements: 2.4, 3.7, 5.1_

  - [x] 5.5 Add "Mark all as read" button
    - Place at top of dropdown
    - Call markAllAsRead from context
    - Disable when no unread notifications
    - _Requirements: 5.2, 5.3_

  - [x] 5.6 Add "View All" link
    - Place at bottom of dropdown
    - Link to /account/notifications
    - _Requirements: 4.5_

  - [x] 5.7 Implement empty state
    - Show when notifications array is empty
    - Display friendly message and icon
    - _Requirements: 4.1_

- [x] 6. Create full notifications page
  - [x] 6.1 Create /account/notifications/page.tsx
    - Use NotificationContext
    - Display all notifications (not just 10)
    - Implement pagination (20 per page)
    - _Requirements: 4.5, 6.3_

  - [x] 6.2 Add filter tabs
    - All, Messages, Orders
    - Filter notifications by type
    - Update URL with filter parameter
    - _Requirements: 4.1_

  - [x] 6.3 Implement notification cards
    - Similar to dropdown but with more detail
    - Show full message text
    - Include delete button
    - _Requirements: 4.2, 4.3_

- [x] 7. Create database migration file
  - Create SQL file with all table and trigger definitions
  - Include RLS policies
  - Include indexes
  - Add comments for documentation
  - _Requirements: 6.1, 6.4_

- [ ] 8. Test notification system
  - [ ] 8.1 Test message notifications
    - Log in as admin
    - Send message to test user
    - Verify notification appears for user
    - Verify badge counter updates
    - Click notification and verify navigation
    - **See NOTIFICATIONS_TESTING.md for detailed testing steps**
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ] 8.2 Test order status notifications
    - Create test order
    - Update order status as admin
    - Verify notification appears for user
    - Test all status changes (confirmed, in_progress, completed, cancelled)
    - **See NOTIFICATIONS_TESTING.md for detailed testing steps**
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [ ] 8.3 Test mark as read functionality
    - Click individual notification
    - Verify it's marked as read
    - Verify badge counter decreases
    - Test "Mark all as read" button
    - Verify all notifications marked as read
    - Verify badge disappears
    - **See NOTIFICATIONS_TESTING.md for detailed testing steps**
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ] 8.4 Test real-time updates
    - Open app in two browser windows (admin and user)
    - Send message as admin
    - Verify notification appears immediately for user
    - No page refresh required
    - **See NOTIFICATIONS_TESTING.md for detailed testing steps**
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ] 8.5 Test notification persistence
    - Create notifications
    - Log out and log back in
    - Verify notifications still present
    - Verify read/unread status preserved
    - **See NOTIFICATIONS_TESTING.md for detailed testing steps**
    - _Requirements: 6.1, 6.2, 6.5_

- [ ] 9. Checkpoint - Ensure all tests pass
  - Follow the comprehensive testing guide in NOTIFICATIONS_TESTING.md
  - Verify all features work as expected
  - Report any issues found during testing

## Notes

- Notifications table uses UUID for id (auto-generated)
- Database triggers automatically create notifications
- Supabase Realtime provides instant delivery without polling
- Badge counter maxes out at 99+ for visual clarity
- Notifications older than 30 days can be cleaned up with a scheduled job (future enhancement)
- Sound notifications are optional and can be added in preferences (future enhancement)
