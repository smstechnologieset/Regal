# Implementation Plan: User Recent Orders Display

## Overview

This implementation plan adds functional Recent Orders display to the user account overview page by creating an order service function and updating the account page component to fetch and display real order data from Supabase.

## Tasks

- [x] 1. Create order service function

  - [x] 1.1 Create orders service file

    - Create `attire/src/lib/services/orders.ts`
    - Define UserOrder interface
    - Implement getUserOrders function with Supabase query
    - Add proper error handling
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [ ]\* 1.2 Write unit tests for getUserOrders

    - Test successful fetch

    - Test empty results
    - Test error handling
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Create helper utility functions

  - [x] 2.1 Create order formatting utilities

    - Create `attire/src/lib/utils/orderHelpers.ts`
    - Implement formatServiceType function
    - Implement formatOrderDate function
    - Implement getOrderSummary function
    - _Requirements: 2.1, 2.2, 2.5_

  - [ ]\* 2.2 Write unit tests for helper functions
    - Test formatServiceType with all service types
    - Test formatOrderDate with various dates
    - Test getOrderSummary with different order structures
    - _Requirements: 2.1, 2.2, 2.5_

- [x] 3. Update account page component

  - [x] 3.1 Add state management for orders

    - Import getUserOrders function
    - Add useState hooks for orders, loading, and error states
    - Add useEffect to fetch orders on mount
    - _Requirements: 1.1, 3.1, 5.1_

  - [x] 3.2 Implement loading state UI

    - Replace mock data with loading spinner
    - Show loading message while fetching
    - _Requirements: 3.1_

  - [x] 3.3 Implement error state UI

    - Add error message display
    - Add retry button with click handler
    - _Requirements: 3.2, 3.3_

  - [x] 3.4 Update order list rendering

    - Map over real orders data instead of mock data
    - Use helper functions for formatting
    - Ensure proper date formatting
    - Update order links to use real order IDs
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 3.5 Verify empty state handling
    - Ensure empty state shows when user has no orders
    - Verify CTA button links correctly
    - _Requirements: 1.5_

- [ ] 4. Test status badge styling

  - [ ] 4.1 Verify all status badges display correctly
    - Test pending status (amber badge)
    - Test confirmed status (blue badge)
    - Test in_progress status (purple badge)
    - Test completed status (green badge with checkmark)
    - Test cancelled status (red badge)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [ ] 5. Integration testing

  - [ ] 5.1 Test with real user data

    - Create test user with multiple orders
    - Verify only user's orders are shown
    - Verify orders are sorted by date (newest first)
    - Verify only 5 most recent orders shown
    - _Requirements: 1.2, 1.3, 1.4_

  - [ ] 5.2 Test edge cases

    - Test with user who has no orders
    - Test with user who has exactly 5 orders
    - Test with user who has more than 5 orders
    - Test error handling when database is unavailable
    - _Requirements: 1.5, 3.2, 3.3_

  - [ ] 5.3 Test data freshness
    - Place a new order
    - Navigate back to account page
    - Verify new order appears in recent orders list
    - _Requirements: 5.1, 5.2, 5.3_

- [ ] 6. Checkpoint - Verify functionality
  - Ensure all tests pass, ask the user if questions arise.
  - Test complete user flow from login to viewing orders
  - Verify loading states work correctly
  - Verify error states work correctly
  - Verify empty states work correctly

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- The existing database schema and RLS policies already support this feature
- No database migrations needed - using existing orders table
- The account page already has the UI structure, we're just replacing mock data with real data
