# Requirements Document

## Introduction

This document outlines the requirements for implementing functional Recent Orders display on the user account overview page. Currently, the page shows mock data. We need to fetch and display actual order data from the Supabase database for the authenticated user.

## Glossary

- **User_Account_Page**: The `/account` page showing user dashboard with profile summary and recent orders
- **Orders_Table**: Supabase database table storing all orders with user_id, service_type, status, total, and timestamps
- **Recent_Orders**: The 5 most recent orders for the authenticated user, ordered by creation date
- **Order_Status**: One of: pending, confirmed, in_progress, completed, cancelled
- **Service_Type**: One of: attire, events, bridal, catering

## Requirements

### Requirement 1: Fetch User Orders

**User Story:** As a logged-in user, I want to see my recent orders on my account overview page, so that I can quickly check my order history.

#### Acceptance Criteria

1. WHEN a user views the account page, THE System SHALL fetch the user's orders from the database
2. THE System SHALL only fetch orders belonging to the authenticated user (filtered by user_id)
3. THE System SHALL order results by created_at timestamp in descending order (newest first)
4. THE System SHALL limit results to the 5 most recent orders
5. IF the user has no orders, THEN THE System SHALL display an empty state with a call-to-action

### Requirement 2: Display Order Information

**User Story:** As a user, I want to see key details about each order, so that I can identify and track my purchases.

#### Acceptance Criteria

1. FOR EACH order, THE System SHALL display the order ID
2. FOR EACH order, THE System SHALL display the service type (Attire, Events, Bridal, or Catering)
3. FOR EACH order, THE System SHALL display the order status with appropriate visual styling
4. FOR EACH order, THE System SHALL display the order total amount
5. FOR EACH order, THE System SHALL display the creation date in a readable format
6. THE System SHALL make each order clickable, linking to the order details page

### Requirement 3: Handle Loading and Error States

**User Story:** As a user, I want clear feedback when my orders are loading or if there's an error, so that I understand what's happening.

#### Acceptance Criteria

1. WHILE orders are being fetched, THE System SHALL display a loading skeleton or spinner
2. IF the fetch fails, THEN THE System SHALL display an error message with a retry option
3. WHEN the user clicks retry, THE System SHALL re-attempt to fetch the orders
4. THE System SHALL not show stale or cached data if the fetch fails

### Requirement 4: Order Status Visualization

**User Story:** As a user, I want to quickly understand the status of my orders through visual indicators, so that I can see at a glance which orders are complete or in progress.

#### Acceptance Criteria

1. WHEN an order status is "pending", THE System SHALL display an amber/yellow badge
2. WHEN an order status is "confirmed", THE System SHALL display a blue badge
3. WHEN an order status is "in_progress", THE System SHALL display a purple badge
4. WHEN an order status is "completed", THE System SHALL display a green badge with a checkmark icon
5. WHEN an order status is "cancelled", THE System SHALL display a red badge
6. THE status text SHALL be displayed in a human-readable format (e.g., "In Progress" instead of "in_progress")

### Requirement 5: Real-time Data Freshness

**User Story:** As a user, I want to see my most up-to-date order information, so that I always have accurate data.

#### Acceptance Criteria

1. WHEN the user navigates to the account page, THE System SHALL fetch fresh order data from the database
2. THE System SHALL not rely on stale cached data for order information
3. IF the user returns to the account page after placing an order, THE System SHALL show the new order in the recent orders list
