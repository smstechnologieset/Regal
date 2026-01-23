# Pre-Order Cancellation Feature

## Overview

Customers can now cancel their pending pre-orders directly from the order details page.

## Implementation Details

### Customer Order Details Page

**File**: `attire/src/app/account/orders/[id]/page.tsx`

**Features**:

- Displays all order items with details (name, size, color, quantity, price)
- Shows pre-order badge and status for pre-order items
- Displays estimated delivery date for pending pre-orders
- "Cancel Pre-Order" button appears only for items with status 'pending'
- Confirmation dialog before cancellation
- Real-time UI updates after cancellation

**Pre-Order Status Display**:

- `pending` → Blue badge "Awaiting Stock"
- `ready` → Green badge "Ready to Ship"
- `fulfilled` → Gray badge "Fulfilled"
- `cancelled` → Red badge "Cancelled"

### Cancellation API Endpoint

**File**: `attire/src/app/api/attire/orders/[orderId]/items/[itemId]/cancel/route.ts`

**Endpoint**: `POST /api/attire/orders/:orderId/items/:itemId/cancel`

**Logic**:

1. Validates that the item is a pre-order with status 'pending'
2. Updates item `preorder_status` to 'cancelled'
3. Product `preorder_count` is automatically decremented by database trigger
4. Recalculates order `preorder_status`:
   - `none` - No active pre-orders
   - `partial` - Mix of regular and pre-order items
   - `all` - All items are pre-orders
5. Updates order status to 'cancelled' if all items are cancelled
6. Returns updated item and order data

**Error Handling**:

- Returns 404 if order item not found
- Returns 400 if item is not a pre-order
- Returns 400 if pre-order status is not 'pending'
- Returns 500 for server errors

### Database Integration

The existing database triggers (from `preorder_migration.sql`) automatically handle:

- Decrementing `products.preorder_count` when status changes from 'pending'
- Updating `orders.has_preorders` and `orders.preorder_status` based on items

## User Experience

### Cancellation Flow

1. Customer navigates to order details page
2. Sees list of order items with pre-order badges
3. Clicks "Cancel Pre-Order" button for pending item
4. Confirmation dialog appears: "Are you sure you want to cancel the pre-order for [Product Name]?"
5. Customer confirms cancellation
6. Item status updates to "Cancelled" immediately
7. Success toast notification appears
8. Order status updates if all items cancelled

### Mixed Order Handling

- If order has both regular and pre-order items:
  - Cancelling pre-order items doesn't cancel the entire order
  - Order continues with remaining items
  - Order `preorder_status` updates to 'none' if all pre-orders cancelled
- If order has only pre-order items:
  - Cancelling all items sets order status to 'cancelled'

## Testing Checklist

- [ ] Cancel single pre-order item in mixed order
- [ ] Cancel all pre-order items in pre-order-only order
- [ ] Verify product preorder_count decrements correctly
- [ ] Verify order status updates correctly
- [ ] Test error handling (invalid item, non-pending status)
- [ ] Verify UI updates in real-time
- [ ] Test confirmation dialog (cancel and keep)
- [ ] Verify toast notifications appear

## Related Files

- Customer UI: `attire/src/app/account/orders/[id]/page.tsx`
- API Endpoint: `attire/src/app/api/attire/orders/[orderId]/items/[itemId]/cancel/route.ts`
- Database Schema: `attire/preorder_migration.sql`
- Type Definitions: `attire/src/types/index.ts`

## Next Steps

Continue with Task 10: Pre-Order Analytics & Reporting
