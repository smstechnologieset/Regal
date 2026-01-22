# Design Document: Customer Notifications

## Overview

This design implements a comprehensive notification system using Supabase Realtime for instant delivery. Users will see a notification bell icon in the header with a badge counter, and can view notifications in a dropdown panel. Notifications are triggered by admin messages and order status changes.

## Architecture

### System Components

```
Database (notifications table)
    ↓
Supabase Realtime Subscription
    ↓
NotificationContext (React Context)
    ↓
NotificationBell Component (Header)
    ↓
NotificationDropdown Component
```

### Data Flow

**Creating Notifications:**

1. Admin sends message OR order status changes
2. Database trigger creates notification record
3. Supabase Realtime broadcasts new notification
4. NotificationContext receives update
5. Badge counter updates
6. Notification appears in dropdown

**Reading Notifications:**

1. User clicks notification
2. API call marks notification as read
3. User navigates to target page
4. Badge counter decreases

## Database Schema

### Notifications Table

```sql
CREATE TABLE public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('message', 'order_status', 'general')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX notifications_user_id_idx ON public.notifications(user_id);
CREATE INDEX notifications_read_idx ON public.notifications(read);
CREATE INDEX notifications_created_at_idx ON public.notifications(created_at DESC);
```

### Database Triggers

**Trigger 1: New Message Notification**

```sql
CREATE OR REPLACE FUNCTION create_message_notification()
RETURNS TRIGGER AS $$
DECLARE
  recipient_id UUID;
  sender_name TEXT;
  conv_subject TEXT;
BEGIN
  -- Get conversation details
  SELECT user_id, subject INTO recipient_id, conv_subject
  FROM conversations
  WHERE id = NEW.conversation_id;

  -- Get sender name
  SELECT full_name INTO sender_name
  FROM profiles
  WHERE id = NEW.sender_id;

  -- Only create notification if sender is admin
  IF EXISTS (SELECT 1 FROM profiles WHERE id = NEW.sender_id AND role = 'admin') THEN
    INSERT INTO notifications (user_id, type, title, message, link, metadata)
    VALUES (
      recipient_id,
      'message',
      'New message from ' || COALESCE(sender_name, 'Support'),
      LEFT(NEW.content, 100),
      '/account/messages/' || NEW.conversation_id,
      jsonb_build_object('conversation_id', NEW.conversation_id, 'message_id', NEW.id)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_new_message_notification
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION create_message_notification();
```

**Trigger 2: Order Status Change Notification**

```sql
CREATE OR REPLACE FUNCTION create_order_status_notification()
RETURNS TRIGGER AS $$
DECLARE
  status_message TEXT;
BEGIN
  -- Only create notification if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Create appropriate message based on status
    CASE NEW.status
      WHEN 'confirmed' THEN
        status_message := 'Your order has been confirmed and is being processed.';
      WHEN 'in_progress' THEN
        status_message := 'Your order is now in progress.';
      WHEN 'completed' THEN
        status_message := 'Your order has been completed!';
      WHEN 'cancelled' THEN
        status_message := 'Your order has been cancelled.';
      ELSE
        status_message := 'Your order status has been updated.';
    END CASE;

    INSERT INTO notifications (user_id, type, title, message, link, metadata)
    VALUES (
      NEW.user_id,
      'order_status',
      'Order Status Update',
      status_message,
      '/account/orders/' || NEW.id,
      jsonb_build_object('order_id', NEW.id, 'old_status', OLD.status, 'new_status', NEW.status)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_order_status_change_notification
  AFTER UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION create_order_status_notification();
```

## Components

### 1. NotificationContext

**Location:** `src/context/NotificationContext.tsx`

**Responsibilities:**

- Subscribe to Supabase Realtime for new notifications
- Maintain notification state (list, unread count)
- Provide methods to mark notifications as read
- Fetch initial notifications on mount

**State:**

```typescript
interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}
```

**Realtime Subscription:**

```typescript
useEffect(() => {
  const channel = supabase
    .channel("notifications")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${user.id}`,
      },
      (payload) => {
        // Add new notification to state
        // Update unread count
        // Play notification sound (if enabled)
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [user]);
```

### 2. NotificationBell Component

**Location:** `src/components/notifications/NotificationBell.tsx`

**Features:**

- Bell icon with badge counter
- Opens/closes dropdown on click
- Closes dropdown when clicking outside
- Responsive positioning

**UI:**

```tsx
<button onClick={toggleDropdown}>
  <Bell size={20} />
  {unreadCount > 0 && (
    <span className="badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
  )}
</button>;
{
  isOpen && <NotificationDropdown />;
}
```

### 3. NotificationDropdown Component

**Location:** `src/components/notifications/NotificationDropdown.tsx`

**Features:**

- List of recent notifications (10 max)
- Group by date (Today, Yesterday, etc.)
- Visual indicator for unread notifications
- "Mark all as read" button
- "View all" link to full page
- Empty state when no notifications

**UI Structure:**

```
┌─────────────────────────────────┐
│ Notifications    [Mark all read]│
├─────────────────────────────────┤
│ Today                           │
│ ● New message from Support     │
│   "Your order has been..."      │
│   2 minutes ago                 │
├─────────────────────────────────┤
│ Yesterday                       │
│   Order Status Update           │
│   "Your order has been..."      │
│   1 day ago                     │
├─────────────────────────────────┤
│ [View All Notifications]        │
└─────────────────────────────────┘
```

### 4. NotificationsPage Component

**Location:** `src/app/account/notifications/page.tsx`

**Features:**

- Full list of all notifications
- Filter by type (all, messages, orders)
- Pagination (20 per page)
- Mark individual notifications as read
- Delete notifications

## API Routes

### GET /api/notifications

**Purpose:** Fetch user notifications

**Query Parameters:**

- `limit`: Number of notifications (default: 10)
- `offset`: Pagination offset (default: 0)
- `type`: Filter by type (optional)
- `unread_only`: Boolean (optional)

**Response:**

```json
{
  "notifications": [...],
  "total": 45,
  "unread_count": 3
}
```

### PATCH /api/notifications/[id]

**Purpose:** Mark notification as read

**Body:**

```json
{
  "read": true
}
```

### POST /api/notifications/mark-all-read

**Purpose:** Mark all user notifications as read

**Response:**

```json
{
  "success": true,
  "count": 5
}
```

### DELETE /api/notifications/[id]

**Purpose:** Delete a notification

## Styling

### Badge Counter

- Position: Absolute top-right of bell icon
- Background: Red (#EF4444)
- Text: White, bold, 10px
- Border-radius: Full circle
- Min-width: 18px
- Padding: 2px 6px

### Unread Notification

- Background: Light blue (#EFF6FF)
- Blue dot indicator on left
- Bold title text

### Read Notification

- Background: White
- Normal text weight
- Slightly faded appearance

### Notification Types

- Message: Blue icon (MessageSquare)
- Order Status: Package icon with status color
  - Confirmed: Blue
  - In Progress: Purple
  - Completed: Green
  - Cancelled: Red

## Error Handling

1. **Realtime Connection Lost**
   - Show reconnecting indicator
   - Attempt to reconnect automatically
   - Fetch missed notifications on reconnect

2. **Failed to Mark as Read**
   - Retry automatically (3 attempts)
   - Show error toast if all attempts fail
   - Keep notification in unread state

3. **Failed to Load Notifications**
   - Show error message in dropdown
   - Provide retry button
   - Log error for debugging

## Performance Considerations

1. **Pagination:** Load only 10 notifications in dropdown, full list on dedicated page
2. **Caching:** Cache notifications in context to avoid repeated API calls
3. **Debouncing:** Debounce mark-as-read calls when clicking multiple notifications
4. **Cleanup:** Automatically delete notifications older than 30 days (database job)

## Security

1. **RLS Policies:** Users can only see their own notifications
2. **Admin Verification:** Verify sender is admin before creating message notifications
3. **Input Validation:** Sanitize notification content to prevent XSS
4. **Rate Limiting:** Limit notification creation to prevent spam

## Testing Strategy

### Unit Tests

- NotificationContext state management
- Notification grouping by date
- Badge counter calculation
- Mark as read functionality

### Integration Tests

- Realtime subscription receives new notifications
- Clicking notification navigates to correct page
- Mark all as read updates all notifications
- Notification preferences are respected

### Manual Testing

- Create test message as admin, verify user receives notification
- Change order status, verify notification appears
- Test notification dropdown UI and interactions
- Test on mobile devices for responsive design

## Implementation Notes

1. **Sound Notification:** Use Web Audio API, make it optional in preferences
2. **Browser Notifications:** Consider adding browser push notifications in future
3. **Email Notifications:** Consider adding email notifications for critical updates
4. **Mobile App:** Design is compatible with future mobile app implementation
