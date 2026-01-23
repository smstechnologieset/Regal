# Implementation Plan: Product Pre-Order System

## Overview

This plan implements the pre-order system for out-of-stock attire products, including database changes, UI components, admin management, and customer notifications.

## Tasks

- [x] 1. Database Schema Updates
  - Create migration file for pre-order fields
  - Add `estimated_restock_date`, `allow_preorder`, `preorder_count` to `attire_products`
  - Add `is_preorder`, `preorder_status`, `estimated_delivery_date` to `attire_order_items`
  - Add `has_preorders`, `preorder_status` to `attire_orders`
  - Run migration in Supabase
  - _Requirements: 1.1, 2.1, 4.5, 4.6_

- [x] 2. Update TypeScript Types
  - Extend `AttireProduct` interface with pre-order fields
  - Extend `AttireOrderItem` interface with pre-order fields
  - Extend `AttireOrder` interface with pre-order fields
  - Create `PreOrderSummary` type
  - _Requirements: All_

- [-] 3. Create Pre-Order Utility Functions
  - [x] 3.1 Implement `isEligibleForPreOrder()` function
    - Check stock === 0, allow_preorder === true, is_active === true
    - _Requirements: 1.1, 1.2_
  - [x] 3.2 Implement `calculateEstimatedDelivery()` function
    - Calculate days until restock date
    - Return human-readable string ("Available in X days")
    - _Requirements: 1.3, 2.2, 2.3_
  - [x] 3.3 Implement `getPreOrderStatus()` function
    - Determine order pre-order status (none/partial/all)
    - _Requirements: 3.3, 3.4_

- [-] 4. Customer UI Components
  - [x] 4.1 Create `PreOrderButton` component
    - Replace "Add to Cart" when stock is 0
    - Show estimated delivery time
    - Add to cart with `is_preorder: true` flag
    - _Requirements: 1.2, 1.3, 1.4_
  - [x] 4.2 Create `PreOrderBadge` component
    - Visual badge with "Pre-Order" label
    - Show estimated delivery date
    - Support compact and detailed variants
    - _Requirements: 2.1, 2.2, 2.3_
  - [x] 4.3 Update Product Detail Page
    - Show "Out of Stock" status when stock === 0
    - Render `PreOrderButton` instead of "Add to Cart"
    - Display estimated availability message
    - _Requirements: 1.1, 1.2, 1.3, 1.5_
  - [x] 4.4 Update Cart Page
    - Add `PreOrderBadge` to pre-order items
    - Show estimated delivery dates
    - Update checkout button text when cart has pre-orders
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  - [x] 4.5 Create `PreOrderNotice` component
    - Display pre-order terms and conditions
    - List pre-order items with delivery estimates
    - Show mixed order notice if applicable
    - _Requirements: 3.1, 3.2_
  - [x] 4.6 Update Checkout Page
    - Add `PreOrderNotice` component
    - Pass pre-order items to order submission
    - _Requirements: 3.1, 3.2, 3.5_

- [-] 5. Order Submission Logic
  - [x] 5.1 Update `submitOrder()` function
    - Include `is_preorder` flag for each item
    - Include `estimated_delivery_date` snapshot
    - Set order `has_preorders` and `preorder_status` fields
    - _Requirements: 3.2, 3.3, 3.4_
  - [ ] 5.2 Update order confirmation email
    - Include pre-order items section
    - Show estimated delivery dates
    - _Requirements: 3.5_

- [x] 6. Admin Product Management
  - [x] 6.1 Update Product Edit Form
    - Add "Allow Pre-Orders" checkbox
    - Add "Estimated Restock Date" date picker
    - Show current pre-order count (read-only)
    - _Requirements: 4.5, 4.6_
  - [x] 6.2 Create API endpoint `PATCH /api/admin/attire/products/:id/restock-date`
    - Update `estimated_restock_date` field
    - Trigger notifications to customers with pending pre-orders
    - Return count of notified customers
    - _Requirements: 4.6, 4.8_

- [x] 7. Stock Update Handler
  - [x] 7.1 Create `handleStockArrival()` function
    - Detect when stock changes from 0 to positive
    - Find all pending pre-orders for product
    - Update pre-order status to 'ready'
    - _Requirements: 4.1, 4.2_
  - [x] 7.2 Integrate with product update API
    - Call `handleStockArrival()` when stock updated
    - _Requirements: 4.1, 4.2_
  - [x] 7.3 Send customer notifications
    - Create notification for each customer with pending pre-order
    - Include product name, order number, link to order
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [-] 8. Admin Pre-Order Management
  - [x] 8.1 Create API endpoint `GET /api/admin/attire/preorders`
    - Query pre-orders with filtering (status, product)
    - Support pagination
    - Return pre-order details with customer info
    - _Requirements: 4.3, 4.4, 9.1, 9.2, 9.3, 9.4, 9.5_
  - [x] 8.2 Create API endpoint `PATCH /api/admin/attire/preorders/:orderId/items/:itemId`
    - Update pre-order status (ready, fulfilled, cancelled)
    - _Requirements: 8.1, 8.2, 8.3_
  - [x] 8.3 Create `PreOrderManager` component
    - Display list of pre-orders
    - Filter by status and product
    - Show order details, customer info, delivery dates
    - Actions: mark as ready, mark as fulfilled
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_
  - [x] 8.4 Add "Pre-Orders" tab to Admin Orders Page
    - Integrate `PreOrderManager` component
    - Show count of pending pre-orders
    - _Requirements: 9.1, 9.2_

- [x] 9. Pre-Order Cancellation
  - [x] 9.1 Add "Cancel Pre-Order" button to customer order details
    - Show only for pre-order items with status 'pending'
    - _Requirements: 6.1_
  - [x] 9.2 Create API endpoint `POST /api/attire/orders/:orderId/items/:itemId/cancel`
    - Update item `preorder_status` to 'cancelled'
    - Recalculate order `preorder_status`
    - Update order status if all items cancelled
    - Decrement product `preorder_count`
    - _Requirements: 6.2, 6.3, 6.4, 6.5_
  - [x] 9.3 Implement cancellation logic
    - Handle partial cancellations (mixed orders)
    - Update order totals if needed
    - _Requirements: 6.4, 6.5_

- [x] 10. Pre-Order Analytics
  - [x] 10.1 Create API endpoint `GET /api/admin/attire/preorders/analytics`
    - Calculate total active pre-orders
    - Group pre-orders by product
    - Calculate average wait time
    - Calculate conversion rate (fulfilled vs cancelled)
    - _Requirements: 10.1, 10.2, 10.3, 10.4_
  - [x] 10.2 Create `PreOrderAnalytics` dashboard widget
    - Display key metrics
    - Show pre-order demand by product
    - _Requirements: 10.1, 10.2, 10.3, 10.4_
  - [x] 10.3 Add analytics widget to admin dashboard
    - Place in prominent location
    - _Requirements: 10.1_

- [x] 11. Stock Reservation Logic
  - [x] 11.1 Implement FIFO queue for pre-orders
    - Order pre-orders by `created_at` timestamp
    - Reserve stock in order when available
    - _Requirements: 7.1, 7.2, 7.3_
  - [x] 11.2 Handle insufficient stock scenario
    - Notify customers if their pre-order cannot be fulfilled
    - Update pre-order status appropriately
    - _Requirements: 7.4_

- [x] 12. Testing and Validation
  - [x] 12.1 Test pre-order flow end-to-end
    - Customer places pre-order
    - Admin updates stock
    - Customer receives notification
    - Order is fulfilled
  - [x] 12.2 Test mixed cart scenarios
    - Cart with in-stock and pre-order items
    - Checkout and order creation
    - Verify correct status tracking
  - [x] 12.3 Test cancellation scenarios
    - Cancel single pre-order item
    - Cancel all items in order
    - Verify order status updates
  - [x] 12.4 Test edge cases
    - Product goes back out of stock
    - Estimated date changes
    - Multiple customers pre-order same product
    - Insufficient stock for all pre-orders

- [ ] 13. Documentation
  - [ ] 13.1 Create admin guide for pre-order management
    - How to set restock dates
    - How to fulfill pre-orders
    - Best practices
  - [ ] 13.2 Update customer FAQ
    - Explain pre-order process
    - Delivery expectations
    - Cancellation policy

## Notes

- Database migration should be run first before any code changes
- Pre-order functionality is additive - existing orders continue to work
- Test thoroughly with mixed carts (in-stock + pre-order items)
- Monitor notification delivery for pre-order updates
- Consider adding admin setting to globally enable/disable pre-orders
