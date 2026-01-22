# Unread Messages Feature

## Overview

The messages page now displays visual indicators for unread messages, making it easy for users to identify new messages at a glance.

## Features Implemented

### 1. Visual Indicators for Unread Messages

- **Green Glow Effect**: Conversations with unread messages have a green background
- **Left Border**: Green border on the left side of unread conversations
- **Icon Styling**: Green icon background with a ring effect
- **Unread Badge**: Shows the count of unread messages
- **"New" Label**: Displays next to the conversation subject

### 2. Automatic Read Status

- Messages are automatically marked as read when the user opens the conversation
- Real-time updates via Socket.io ensure instant status changes
- Read receipts show on sent messages

### 3. Unread Count

- Each conversation displays the number of unread messages
- Only counts messages sent by others (not the user's own messages)
- Updates in real-time when new messages arrive

## How It Works

### Messages List Page (`/account/messages`)

```typescript
// Fetches unread count for each conversation
const { count } = await supabase
  .from("messages")
  .select("*", { count: "exact", head: true })
  .eq("conversation_id", conv.id)
  .eq("read", false)
  .neq("sender_id", user.id); // Only count messages not sent by user
```

### Visual Styling

```typescript
// Green glow for unread messages
className={`block p-5 transition-all ${
  hasUnread
    ? "bg-green-50 hover:bg-green-100 border-l-4 border-green-500 shadow-sm"
    : "hover:bg-slate-50"
}`}
```

### Auto-Mark as Read

```typescript
// In ChatWindow component
useEffect(() => {
  if (messages.length > 0) {
    const hasUnread = messages.some((m) => !m.read && m.sender_id !== user?.id);
    if (hasUnread) {
      markAsRead(conversationId);
    }
  }
}, [messages, conversationId, user?.id, markAsRead]);
```

## User Experience

1. **New Message Arrives**:
   - Conversation appears with green glow
   - Badge shows unread count
   - "New" label appears

2. **User Opens Conversation**:
   - Messages are automatically marked as read
   - Green glow disappears from the list
   - Badge count updates

3. **Real-time Updates**:
   - All changes happen instantly via Socket.io
   - No page refresh needed

## Testing

To test the feature:

1. As admin, send a message to a customer
2. Customer sees green glow on messages page
3. Customer opens the conversation
4. Green glow disappears automatically
5. Admin sees "Read" status on their sent message

## Files Modified

- `attire/src/app/account/messages/page.tsx` - Messages list with unread indicators
- `attire/src/components/chat/ChatWindow.tsx` - Auto-mark as read functionality
- Uses existing Socket.io infrastructure for real-time updates
