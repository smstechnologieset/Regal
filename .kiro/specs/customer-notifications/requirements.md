# Requirements Document: Customer Notifications

## Introduction

This feature implements a real-time notification system that alerts customers about important events such as new messages from admin, order status changes, and other relevant updates. Notifications will appear in-app with a notification bell icon and badge counter.

## Glossary

- **Notification**: An alert message informing users about an event or update
- **Notification Center**: A dropdown panel showing all user notifications
- **Badge Counter**: A visual indicator showing the count of unread notifications
- **Notification Type**: Category of notification (message, order_status, general)
- **Read Status**: Whether a notification has been viewed by the user
- **Real-time Updates**: Notifications that appear immediately without page refresh

## Requirements

### Requirement 1: Notification Bell Icon

**User Story:** As a user, I want to see a notification bell icon in the header, so that I can quickly access my notifications.

#### Acceptance Criteria

1. THE system SHALL display a notification bell icon in the main header navigation
2. WHEN there are unread notifications, THEN the system SHALL display a badge counter on the bell icon
3. WHEN the user clicks the bell icon, THEN the system SHALL open a notification dropdown panel
4. WHEN the user clicks outside the dropdown, THEN the system SHALL close the notification panel
5. THE badge counter SHALL display the count of unread notifications (max display: 99+)

### Requirement 2: New Message Notifications

**User Story:** As a user, I want to receive notifications when an admin sends me a message, so that I can respond promptly.

#### Acceptance Criteria

1. WHEN an admin sends a message in a user's conversation, THEN the system SHALL create a notification for that user
2. THE notification SHALL include the message preview (first 100 characters)
3. THE notification SHALL include a link to the conversation
4. WHEN the user clicks the notification, THEN the system SHALL navigate to the conversation and mark the notification as read
5. THE notification SHALL display the time elapsed since the message was sent

### Requirement 3: Order Status Change Notifications

**User Story:** As a user, I want to receive notifications when my order status changes, so that I can track my order progress.

#### Acceptance Criteria

1. WHEN an order status changes from pending to confirmed, THEN the system SHALL create a notification
2. WHEN an order status changes to in_progress, THEN the system SHALL create a notification
3. WHEN an order status changes to completed, THEN the system SHALL create a notification
4. WHEN an order status changes to cancelled, THEN the system SHALL create a notification
5. THE notification SHALL include the order ID and new status
6. THE notification SHALL include a link to the order details page
7. WHEN the user clicks the notification, THEN the system SHALL navigate to the order and mark the notification as read

### Requirement 4: Notification List Display

**User Story:** As a user, I want to see all my notifications in a list, so that I can review past notifications.

#### Acceptance Criteria

1. THE notification dropdown SHALL display up to 10 most recent notifications
2. THE system SHALL display unread notifications with a visual indicator (blue dot or highlighted background)
3. THE system SHALL display read notifications with normal styling
4. THE system SHALL group notifications by date (Today, Yesterday, This Week, Older)
5. THE notification list SHALL include a "View All" link to a full notifications page

### Requirement 5: Mark Notifications as Read

**User Story:** As a user, I want to mark notifications as read, so that I can keep track of which notifications I've seen.

#### Acceptance Criteria

1. WHEN a user clicks on a notification, THEN the system SHALL mark it as read
2. THE system SHALL provide a "Mark all as read" button in the notification dropdown
3. WHEN the user clicks "Mark all as read", THEN the system SHALL mark all notifications as read
4. WHEN a notification is marked as read, THEN the badge counter SHALL decrease
5. WHEN all notifications are read, THEN the badge counter SHALL disappear

### Requirement 6: Notification Persistence

**User Story:** As a user, I want my notifications to persist across sessions, so that I don't lose important updates.

#### Acceptance Criteria

1. THE system SHALL store notifications in the database
2. THE system SHALL load notifications when the user logs in
3. THE system SHALL retain notifications for 30 days
4. THE system SHALL automatically delete notifications older than 30 days
5. THE system SHALL preserve read/unread status across sessions

### Requirement 7: Real-time Notification Delivery

**User Story:** As a user, I want to receive notifications in real-time, so that I'm immediately informed of important updates.

#### Acceptance Criteria

1. WHEN a new notification is created, THEN the system SHALL deliver it to the user without requiring a page refresh
2. THE system SHALL use Supabase Realtime subscriptions for instant delivery
3. WHEN a notification arrives, THEN the badge counter SHALL update immediately
4. WHEN the notification dropdown is open, THEN new notifications SHALL appear at the top of the list
5. THE system SHALL play a subtle sound when a new notification arrives (optional, user-configurable)

### Requirement 8: Notification Preferences

**User Story:** As a user, I want to control which notifications I receive, so that I'm not overwhelmed with alerts.

#### Acceptance Criteria

1. THE system SHALL provide a notification preferences page in account settings
2. THE user SHALL be able to enable/disable message notifications
3. THE user SHALL be able to enable/disable order status notifications
4. THE user SHALL be able to enable/disable notification sounds
5. THE system SHALL respect user preferences when creating notifications
