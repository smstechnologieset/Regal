# Pre-Order System Testing Guide

## Overview

This document provides comprehensive testing scenarios for the pre-order system to ensure all functionality works correctly across different use cases.

## Prerequisites

- Database migration completed (`preorder_migration.sql`)
- At least one admin user account
- At least one customer user account
- Test products in the catalog

---

## Test 12.1: End-to-End Pre-Order Flow

### Objective

Verify the complete pre-order flow from customer order to fulfillment.

### Setup

1. Create a test product with:
   - Stock: 0
   - Allow Pre-Order: true
   - Estimated Restock Date: 7 days from now
   - Estimated Delivery Days: 14

### Test Steps

#### Step 1: Customer Places Pre-Order

1. **Action**: Log in as customer
2. **Action**: Navigate to product detail page
3. **Expected**: See "Out of Stock" badge
4. **Expected**: See "Pre-Order" button instead of "Add to Cart"
5. **Expected**: See estimated availability message (e.g., "Available in 7 days")
6. **Action**: Click "Pre-Order" button
7. **Expected**: Product added to cart with pre-order badge
8. **Action**: Go to cart
9. **Expected**: See pre-order badge on item
10. **Expected**: See estimated delivery date
11. **Expected**: Checkout button shows "Proceed to Checkout (Pre-Order)"

#### Step 2: Complete Checkout

1. **Action**: Click checkout
2. **Expected**: See Pre-Order Notice component
3. **Expected**: Notice lists pre-order items with delivery estimates
4. **Action**: Complete checkout with COD
5. **Expected**: Order created successfully
6. **Action**: View order details
7. **Expected**: Order items displayed with pre-order badges
8. **Expected**: Item shows "Awaiting Stock" status
9. **Expected**: Estimated delivery date displayed

#### Step 3: Admin Updates Stock

1. **Action**: Log in as admin
2. **Action**: Navigate to Catalog > Attire
3. **Action**: Edit the test product
4. **Action**: Update stock from 0 to 10
5. **Action**: Save product
6. **Expected**: Success message with pre-order notification count
7. **Expected**: Message shows "X pre-order(s) fulfilled"

#### Step 4: Customer Receives Notification

1. **Action**: Log in as customer
2. **Expected**: Notification bell shows unread count
3. **Action**: Click notification bell
4. **Expected**: See "Your pre-order is ready!" notification
5. **Action**: Click notification
6. **Expected**: Navigate to order details

#### Step 5: Verify Order Status

1. **Expected**: Order status changed to "processing"
2. **Expected**: Pre-order item status changed to "Ready to Ship"
3. **Expected**: Item still shows estimated delivery date

#### Step 6: Admin Fulfills Order

1. **Action**: Log in as admin
2. **Action**: Navigate to Orders > Pre-Orders tab
3. **Expected**: See the order in pre-orders list
4. **Action**: Click "Mark as Fulfilled"
5. **Expected**: Pre-order status changes to "Fulfilled"
6. **Action**: View customer order details
7. **Expected**: Item shows "Fulfilled" status

### Success Criteria

- ✅ Customer can place pre-order for out-of-stock item
- ✅ Pre-order badges display correctly throughout flow
- ✅ Stock arrival triggers automatic status updates
- ✅ Customer receives notification when stock arrives
- ✅ Order progresses through all status stages correctly
- ✅ Admin can manage and fulfill pre-orders

---

## Test 12.2: Mixed Cart Scenarios

### Objective

Verify correct handling of carts containing both in-stock and pre-order items.

### Setup

1. Product A: Stock = 10, Allow Pre-Order = false
2. Product B: Stock = 0, Allow Pre-Order = true, Restock Date = 7 days

### Test Steps

#### Scenario 1: Mixed Cart Checkout

1. **Action**: Add Product A (in-stock) to cart
2. **Action**: Add Product B (pre-order) to cart
3. **Expected**: Cart shows both items
4. **Expected**: Product B has pre-order badge
5. **Expected**: Checkout button shows "(Pre-Order)" indicator
6. **Action**: Go to checkout
7. **Expected**: Pre-Order Notice displays
8. **Expected**: Notice shows only Product B as pre-order
9. **Expected**: Notice indicates "mixed order"
10. **Action**: Complete checkout
11. **Expected**: Order created with `preorder_status: 'partial'`
12. **Action**: View order details
13. **Expected**: Product A shows no pre-order badge
14. **Expected**: Product B shows pre-order badge and status

#### Scenario 2: Cancel Pre-Order in Mixed Order

1. **Action**: From order details, click "Cancel Pre-Order" on Product B
2. **Expected**: Confirmation dialog appears
3. **Action**: Confirm cancellation
4. **Expected**: Product B status changes to "Cancelled"
5. **Expected**: Order status remains active (not cancelled)
6. **Expected**: Order `preorder_status` changes to 'none'
7. **Expected**: Product A remains unaffected

#### Scenario 3: Stock Arrival for Mixed Order

1. **Setup**: Create new mixed order (Product A + Product B)
2. **Action**: Admin updates Product B stock to 10
3. **Expected**: Product B status changes to "Ready"
4. **Expected**: Order status changes to "processing"
5. **Expected**: Customer receives notification
6. **Expected**: Product A remains unaffected

### Success Criteria

- ✅ Mixed carts display correctly with appropriate badges
- ✅ Checkout handles mixed orders properly
- ✅ Order tracking distinguishes between regular and pre-order items
- ✅ Cancelling pre-order doesn't affect regular items
- ✅ Stock arrival only affects pre-order items

---

## Test 12.3: Cancellation Scenarios

### Objective

Verify pre-order cancellation logic works correctly in various scenarios.

### Scenario 1: Cancel Single Pre-Order Item

1. **Setup**: Order with 1 pre-order item (status: pending)
2. **Action**: Customer clicks "Cancel Pre-Order"
3. **Expected**: Confirmation dialog appears
4. **Action**: Confirm cancellation
5. **Expected**: Item `preorder_status` = 'cancelled'
6. **Expected**: Order status = 'cancelled' (all items cancelled)
7. **Expected**: Product `preorder_count` decremented
8. **Expected**: Success toast notification

### Scenario 2: Cancel Pre-Order in Multi-Item Order

1. **Setup**: Order with 2 pre-order items (both pending)
2. **Action**: Cancel first pre-order item
3. **Expected**: First item status = 'cancelled'
4. **Expected**: Second item status = 'pending' (unchanged)
5. **Expected**: Order status = 'pending' (not cancelled)
6. **Expected**: Order `preorder_status` = 'all' (still has active pre-orders)
7. **Action**: Cancel second pre-order item
8. **Expected**: Both items status = 'cancelled'
9. **Expected**: Order status = 'cancelled'
10. **Expected**: Order `preorder_status` = 'none'

### Scenario 3: Attempt to Cancel Non-Pending Pre-Order

1. **Setup**: Order with pre-order item (status: ready)
2. **Expected**: "Cancel Pre-Order" button not visible
3. **Setup**: Order with pre-order item (status: fulfilled)
4. **Expected**: "Cancel Pre-Order" button not visible
5. **Setup**: Order with pre-order item (status: cancelled)
6. **Expected**: Shows "Cancelled" badge, no cancel button

### Scenario 4: Cancel Button Visibility

1. **Setup**: Regular order (no pre-orders)
2. **Expected**: No "Cancel Pre-Order" buttons visible
3. **Setup**: Order with pre-order (status: pending)
4. **Expected**: "Cancel Pre-Order" button visible
5. **Action**: Admin marks pre-order as ready
6. **Action**: Customer refreshes order details
7. **Expected**: "Cancel Pre-Order" button no longer visible

### Success Criteria

- ✅ Cancellation updates item and order status correctly
- ✅ Product preorder_count decrements properly
- ✅ Cancel button only shows for pending pre-orders
- ✅ Partial cancellations handled correctly
- ✅ Full cancellations mark order as cancelled

---

## Test 12.4: Edge Cases

### Objective

Test edge cases and error conditions.

### Scenario 1: Product Goes Back Out of Stock

1. **Setup**: Product with stock = 10, has pending pre-orders
2. **Action**: Admin updates stock to 0
3. **Expected**: No automatic status changes
4. **Expected**: Pending pre-orders remain pending
5. **Action**: Admin updates stock back to 10
6. **Expected**: Pre-orders move to 'ready'
7. **Expected**: Customers notified

### Scenario 2: Estimated Date Changes

1. **Setup**: Product with restock date = 7 days, has pending pre-orders
2. **Action**: Admin updates restock date to 14 days
3. **Expected**: Customers with pending pre-orders receive notification
4. **Expected**: Notification shows new estimated date
5. **Action**: Customer views order details
6. **Expected**: Estimated delivery date reflects original snapshot (not updated)

### Scenario 3: Multiple Customers Pre-Order Same Product

1. **Setup**: Product with stock = 0
2. **Action**: Customer A places pre-order for 2 units (timestamp: T1)
3. **Action**: Customer B places pre-order for 3 units (timestamp: T2)
4. **Action**: Customer C places pre-order for 2 units (timestamp: T3)
5. **Action**: Admin updates stock to 5
6. **Expected**: Customer A's order fulfilled (2 units, FIFO)
7. **Expected**: Customer B's order fulfilled (3 units, FIFO)
8. **Expected**: Customer C's order remains pending (insufficient stock)
9. **Expected**: Customer A receives "ready" notification
10. **Expected**: Customer B receives "ready" notification
11. **Expected**: Customer C receives "insufficient stock" notification
12. **Expected**: Product `preorder_count` = 2 (Customer C's pending order)

### Scenario 4: Insufficient Stock for All Pre-Orders

1. **Setup**:
   - Customer A: pre-order 5 units (T1)
   - Customer B: pre-order 5 units (T2)
   - Customer C: pre-order 5 units (T3)
   - Total demand: 15 units
2. **Action**: Admin updates stock to 8
3. **Expected**: Customer A fulfilled (5 units)
4. **Expected**: Customer B fulfilled (3 units available, but order is for 5 - remains pending)
5. **Expected**: Customer C pending (0 units available)
6. **Expected**: Customer A gets "ready" notification
7. **Expected**: Customer B gets "insufficient stock" notification
8. **Expected**: Customer C gets "insufficient stock" notification
9. **Expected**: Admin sees message: "Stock arrival processed: 1 pre-order(s) fulfilled, 2 awaiting more stock"

### Scenario 5: Pre-Order Disabled Mid-Flow

1. **Setup**: Product with pre-orders enabled, has pending pre-orders
2. **Action**: Admin disables pre-orders (`allow_preorder = false`)
3. **Expected**: Existing pre-orders remain valid
4. **Expected**: New customers cannot place pre-orders
5. **Expected**: Product page shows "Out of Stock" without pre-order button

### Scenario 6: Concurrent Cancellations

1. **Setup**: Order with 1 pre-order item
2. **Action**: Customer clicks "Cancel Pre-Order" twice rapidly
3. **Expected**: Only one cancellation processes
4. **Expected**: Second request returns error or no-op
5. **Expected**: No duplicate decrements of `preorder_count`

### Scenario 7: Admin Analytics with No Pre-Orders

1. **Setup**: No active pre-orders in system
2. **Action**: Navigate to admin dashboard
3. **Expected**: Pre-Order Analytics widget displays
4. **Expected**: Shows "No Active Pre-Orders" message
5. **Expected**: All metrics show 0
6. **Expected**: No errors or crashes

### Success Criteria

- ✅ System handles stock fluctuations correctly
- ✅ Date changes trigger appropriate notifications
- ✅ FIFO queue works with multiple customers
- ✅ Insufficient stock scenarios handled gracefully
- ✅ Pre-order toggle doesn't affect existing orders
- ✅ Concurrent operations handled safely
- ✅ Empty states display correctly

---

## Test 12.5: Admin Pre-Order Management

### Objective

Verify admin can effectively manage pre-orders.

### Test Steps

#### Pre-Order List View

1. **Action**: Navigate to Orders > Pre-Orders tab
2. **Expected**: See list of all pre-orders
3. **Expected**: Can filter by status (pending, ready, fulfilled, cancelled)
4. **Expected**: Can filter by product
5. **Expected**: Can search by customer name, email, order number
6. **Expected**: Shows order details, customer info, delivery dates
7. **Expected**: Pagination works correctly

#### Status Updates

1. **Action**: Select pre-order with status "pending"
2. **Action**: Click "Mark as Ready"
3. **Expected**: Status updates to "ready"
4. **Expected**: Customer receives notification
5. **Action**: Click "Mark as Fulfilled"
6. **Expected**: Status updates to "fulfilled"
7. **Expected**: Item removed from pending/ready lists

#### Analytics Dashboard

1. **Action**: Navigate to admin dashboard
2. **Expected**: See Pre-Order Analytics widget
3. **Expected**: Shows total active pre-orders
4. **Expected**: Shows average wait time
5. **Expected**: Shows conversion rate
6. **Expected**: Shows pre-orders by product
7. **Expected**: Top 10 products displayed
8. **Expected**: Can click "Manage Pre-Orders" link

### Success Criteria

- ✅ Admin can view all pre-orders
- ✅ Filtering and search work correctly
- ✅ Status updates process successfully
- ✅ Analytics provide meaningful insights
- ✅ Navigation between views works smoothly

---

## Test 12.6: Notification System

### Objective

Verify all pre-order notifications work correctly.

### Notification Types to Test

#### 1. Stock Arrival (Ready)

- **Trigger**: Admin updates stock from 0 to positive
- **Expected**: Notification type = 'preorder_ready'
- **Expected**: Title = "Your pre-order is ready!"
- **Expected**: Message includes product name
- **Expected**: Link to order details
- **Expected**: Notification bell shows unread count

#### 2. Stock Arrival (Insufficient)

- **Trigger**: Admin updates stock but insufficient for all pre-orders
- **Expected**: Notification type = 'preorder_insufficient_stock'
- **Expected**: Title = "Pre-order stock update"
- **Expected**: Message explains insufficient stock
- **Expected**: Shows requested vs available quantity
- **Expected**: Link to order details

#### 3. Restock Date Update

- **Trigger**: Admin updates estimated restock date
- **Expected**: Notification sent to customers with pending pre-orders
- **Expected**: Message shows new estimated date
- **Expected**: Link to order details

### Success Criteria

- ✅ All notification types trigger correctly
- ✅ Notifications contain accurate information
- ✅ Links navigate to correct pages
- ✅ Notification bell updates in real-time
- ✅ Notifications can be marked as read

---

## Test 12.7: Database Integrity

### Objective

Verify database triggers and constraints work correctly.

### Tests

#### Trigger: update_product_preorder_count

1. **Action**: Create order with pre-order item (quantity: 3)
2. **Expected**: Product `preorder_count` increases by 3
3. **Action**: Update item `preorder_status` to 'ready'
4. **Expected**: Product `preorder_count` decreases by 3
5. **Action**: Update item `preorder_status` back to 'pending'
6. **Expected**: Product `preorder_count` increases by 3
7. **Action**: Delete order item
8. **Expected**: Product `preorder_count` decreases by 3

#### Trigger: update_order_preorder_status

1. **Action**: Create order with 1 pre-order item
2. **Expected**: Order `has_preorders` = true
3. **Expected**: Order `preorder_status` = 'all'
4. **Action**: Add regular item to order
5. **Expected**: Order `preorder_status` = 'partial'
6. **Action**: Update pre-order item `is_preorder` to false
7. **Expected**: Order `has_preorders` = false
8. **Expected**: Order `preorder_status` = 'none'

#### Constraint: preorder_status values

1. **Action**: Attempt to set invalid `preorder_status` (e.g., 'invalid')
2. **Expected**: Database constraint violation error
3. **Expected**: Valid values: 'pending', 'ready', 'fulfilled', 'cancelled'

### Success Criteria

- ✅ Triggers update counts automatically
- ✅ Triggers maintain data consistency
- ✅ Constraints prevent invalid data
- ✅ No orphaned or inconsistent records

---

## Test 12.8: Performance Testing

### Objective

Verify system performs well under load.

### Tests

#### Large Pre-Order Volume

1. **Setup**: Create 100 pre-orders for same product
2. **Action**: Admin updates stock to 100
3. **Expected**: All pre-orders process within reasonable time (< 10 seconds)
4. **Expected**: All customers receive notifications
5. **Expected**: No database deadlocks or timeouts

#### Analytics with Large Dataset

1. **Setup**: System with 1000+ pre-orders across 50 products
2. **Action**: Load admin dashboard
3. **Expected**: Analytics load within 3 seconds
4. **Expected**: Top 10 products display correctly
5. **Expected**: No performance degradation

#### Concurrent Operations

1. **Setup**: Multiple customers placing pre-orders simultaneously
2. **Action**: 10 customers place pre-orders at same time
3. **Expected**: All orders created successfully
4. **Expected**: Product `preorder_count` accurate
5. **Expected**: No race conditions or data corruption

### Success Criteria

- ✅ System handles high volume efficiently
- ✅ No performance bottlenecks
- ✅ Concurrent operations safe
- ✅ Database queries optimized

---

## Regression Testing Checklist

After any code changes, verify:

- [ ] Existing orders without pre-orders still work
- [ ] Regular product purchases unaffected
- [ ] Cart functionality for non-pre-order items unchanged
- [ ] Checkout process for regular orders unchanged
- [ ] Admin product management for in-stock items unchanged
- [ ] Order status tracking for regular orders unchanged
- [ ] Notification system for non-pre-order events unchanged

---

## Known Limitations

1. **Partial Fulfillment**: Currently not supported - if stock is insufficient for full order quantity, entire order remains pending
2. **Stock Reservation**: Stock is not reserved when pre-order is placed, only when stock arrives
3. **Payment**: Pre-orders use COD only (no upfront payment)
4. **Refunds**: Cancellation doesn't process refunds (COD model)

---

## Troubleshooting

### Issue: Pre-order count not updating

- **Check**: Database triggers enabled
- **Check**: Order items table has correct `is_preorder` and `preorder_status` values
- **Fix**: Run migration again or manually verify triggers

### Issue: Notifications not sending

- **Check**: Notifications table exists
- **Check**: User IDs are valid
- **Check**: Notification context provider loaded
- **Fix**: Verify notification API endpoints working

### Issue: Stock arrival not triggering updates

- **Check**: `handleStockArrival` function called in PATCH endpoint
- **Check**: Previous stock was 0 and new stock > 0
- **Check**: Pre-orders exist with status 'pending'
- **Fix**: Add logging to track function execution

---

## Test Completion Checklist

- [ ] Test 12.1: End-to-End Pre-Order Flow
- [ ] Test 12.2: Mixed Cart Scenarios
- [ ] Test 12.3: Cancellation Scenarios
- [ ] Test 12.4: Edge Cases
- [ ] Test 12.5: Admin Pre-Order Management
- [ ] Test 12.6: Notification System
- [ ] Test 12.7: Database Integrity
- [ ] Test 12.8: Performance Testing
- [ ] Regression Testing Complete
- [ ] All Known Issues Documented

---

## Sign-Off

**Tester Name**: ********\_\_\_********  
**Date**: ********\_\_\_********  
**Test Environment**: ********\_\_\_********  
**Overall Result**: ☐ Pass ☐ Fail ☐ Pass with Issues

**Notes**:
