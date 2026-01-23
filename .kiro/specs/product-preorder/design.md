# Design Document: Product Pre-Order System

## Overview

The pre-order system allows customers to reserve out-of-stock products and provides admins with tools to manage inventory expectations and fulfill pre-orders when stock arrives. The system integrates with the existing order management, notification system, and inventory tracking.

## Architecture

### High-Level Flow

```
Customer Flow:
1. Customer views out-of-stock product → sees "Pre-Order" button with estimated delivery
2. Adds to cart → item marked as pre-order with delivery estimate
3. Proceeds to checkout → sees pre-order notice and terms
4. Places order → order created with pre-order status
5. Receives notification when stock arrives → order moves to processing

Admin Flow:
1. Product goes out of stock → admin sets estimated restock date
2. Customers place pre-orders → admin sees pre-order queue
3. Stock arrives → admin updates inventory
4. System auto-notifies customers → pre-orders move to "ready" status
5. Admin fulfills orders → marks as shipped
```

### System Components

- **Product Catalog** - Extended with pre-order fields
- **Cart System** - Handles mixed in-stock and pre-order items
- **Order Management** - Tracks pre-order status and fulfillment
- **Notification System** - Alerts customers about stock availability
- **Admin Dashboard** - Pre-order management and analytics

## Database Schema Changes

### 1. Extend `attire_products` Table

Add fields to track pre-order availability:

```sql
ALTER TABLE attire_products ADD COLUMN IF NOT EXISTS estimated_restock_date TIMESTAMPTZ;
ALTER TABLE attire_products ADD COLUMN IF NOT EXISTS allow_preorder BOOLEAN DEFAULT true;
ALTER TABLE attire_products ADD COLUMN IF NOT EXISTS preorder_count INTEGER DEFAULT 0;
```

**Fields:**

- `estimated_restock_date`: When admin expects stock to arrive
- `allow_preorder`: Whether pre-orders are enabled for this product
- `preorder_count`: Cached count of pending pre-orders

### 2. Extend `attire_order_items` Table

Add field to track pre-order status:

```sql
ALTER TABLE attire_order_items ADD COLUMN IF NOT EXISTS is_preorder BOOLEAN DEFAULT false;
ALTER TABLE attire_order_items ADD COLUMN IF NOT EXISTS preorder_status TEXT CHECK (preorder_status IN ('pending', 'ready', 'fulfilled', 'cancelled'));
ALTER TABLE attire_order_items ADD COLUMN IF NOT EXISTS estimated_delivery_date TIMESTAMPTZ;
```

**Fields:**

- `is_preorder`: Whether this item was a pre-order at time of purchase
- `preorder_status`: Current status of the pre-order
- `estimated_delivery_date`: Snapshot of estimated date at order time

### 3. Add Pre-Order Status to `attire_orders` Table

```sql
ALTER TABLE attire_orders ADD COLUMN IF NOT EXISTS has_preorders BOOLEAN DEFAULT false;
ALTER TABLE attire_orders ADD COLUMN IF NOT EXISTS preorder_status TEXT CHECK (preorder_status IN ('none', 'partial', 'all'));
```

**Fields:**

- `has_preorders`: Quick flag for filtering orders with pre-orders
- `preorder_status`: 'none' (no pre-orders), 'partial' (mixed), 'all' (all items are pre-orders)

## Data Models

### Extended Product Type

```typescript
interface AttireProduct {
  // ... existing fields
  estimated_restock_date: string | null;
  allow_preorder: boolean;
  preorder_count: number;
}
```

### Extended Order Item Type

```typescript
interface AttireOrderItem {
  // ... existing fields
  is_preorder: boolean;
  preorder_status: "pending" | "ready" | "fulfilled" | "cancelled" | null;
  estimated_delivery_date: string | null;
}
```

### Pre-Order Summary Type

```typescript
interface PreOrderSummary {
  product_id: string;
  product_name: string;
  total_preorders: number;
  pending_count: number;
  ready_count: number;
  estimated_restock_date: string | null;
}
```

## Components and Interfaces

### 1. Customer-Facing Components

#### `PreOrderButton` Component

- Replaces "Add to Cart" when stock is 0
- Shows estimated delivery time
- Adds item to cart with pre-order flag

```typescript
interface PreOrderButtonProps {
  product: AttireProduct;
  selectedSize: string;
  selectedColor: ColorOption;
  onAddToCart: (isPreOrder: boolean) => void;
}
```

#### `PreOrderBadge` Component

- Visual indicator for pre-order items
- Shows in cart, checkout, and order history
- Displays estimated delivery date

```typescript
interface PreOrderBadgeProps {
  estimatedDate: string | null;
  status?: "pending" | "ready" | "fulfilled";
  variant?: "compact" | "detailed";
}
```

#### `PreOrderNotice` Component

- Checkout page notice about pre-order terms
- Explains delivery timeline
- Shows which items are pre-orders

```typescript
interface PreOrderNoticeProps {
  preOrderItems: CartItem[];
  estimatedDates: Map<string, string>;
}
```

### 2. Admin Components

#### `PreOrderManager` Component

- Dedicated section in admin orders page
- Lists all pre-orders with filtering
- Shows pre-order queue by product

```typescript
interface PreOrderManagerProps {
  orders: AttireOrder[];
  products: AttireProduct[];
  onUpdateStatus: (orderId: string, itemId: string, status: string) => void;
}
```

#### `RestockDatePicker` Component

- In product edit form
- Sets estimated restock date
- Calculates "days until restock"

```typescript
interface RestockDatePickerProps {
  productId: string;
  currentDate: string | null;
  onUpdate: (date: string) => void;
}
```

#### `PreOrderAnalytics` Component

- Dashboard widget showing pre-order metrics
- Total pre-orders, by product, conversion rate
- Average fulfillment time

```typescript
interface PreOrderAnalyticsProps {
  dateRange: { start: string; end: string };
}
```

## API Endpoints

### Customer Endpoints

#### `GET /api/attire/products/:id`

**Extended Response:**

```typescript
{
  // ... existing product fields
  stock: number;
  estimated_restock_date: string | null;
  allow_preorder: boolean;
  is_available_for_preorder: boolean; // computed: stock === 0 && allow_preorder
}
```

#### `POST /api/attire/cart/add`

**Extended Request:**

```typescript
{
  product_id: string;
  size: string;
  color: string;
  quantity: number;
  is_preorder: boolean; // new field
}
```

#### `POST /api/attire/orders`

**Extended Request:**

```typescript
{
  // ... existing order fields
  items: Array<{
    // ... existing item fields
    is_preorder: boolean;
    estimated_delivery_date: string | null;
  }>;
}
```

### Admin Endpoints

#### `PATCH /api/admin/attire/products/:id/restock-date`

**Request:**

```typescript
{
  estimated_restock_date: string | null;
}
```

**Response:**

```typescript
{
  success: boolean;
  product: AttireProduct;
  notified_customers: number; // count of customers notified
}
```

#### `GET /api/admin/attire/preorders`

**Query Parameters:**

- `status`: 'pending' | 'ready' | 'fulfilled' | 'all'
- `product_id`: filter by product
- `page`: pagination
- `limit`: items per page

**Response:**

```typescript
{
  preorders: Array<{
    order_id: string;
    order_number: string;
    customer_name: string;
    customer_email: string;
    product_id: string;
    product_name: string;
    size: string;
    color: string;
    quantity: number;
    preorder_status: string;
    estimated_delivery_date: string | null;
    order_date: string;
  }>;
  total: number;
  page: number;
}
```

#### `PATCH /api/admin/attire/preorders/:orderId/items/:itemId`

**Request:**

```typescript
{
  preorder_status: "ready" | "fulfilled" | "cancelled";
}
```

#### `GET /api/admin/attire/preorders/analytics`

**Response:**

```typescript
{
  total_active_preorders: number;
  by_product: Array<{
    product_id: string;
    product_name: string;
    count: number;
  }>;
  average_wait_days: number;
  conversion_rate: number; // fulfilled / (fulfilled + cancelled)
}
```

## Business Logic

### Pre-Order Eligibility Check

```typescript
function isEligibleForPreOrder(product: AttireProduct): boolean {
  return (
    product.stock === 0 &&
    product.allow_preorder === true &&
    product.is_active === true
  );
}
```

### Estimated Delivery Calculation

```typescript
function calculateEstimatedDelivery(restockDate: Date | null): string | null {
  if (!restockDate) return null;

  const today = new Date();
  const diffTime = restockDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "Available soon";
  if (diffDays === 0) return "Available today";
  if (diffDays === 1) return "Available tomorrow";
  if (diffDays <= 7) return `Available in ${diffDays} days`;
  if (diffDays <= 30) return `Available in ${Math.ceil(diffDays / 7)} weeks`;

  return restockDate.toLocaleDateString();
}
```

### Stock Arrival Handler

When admin updates stock from 0 to positive:

```typescript
async function handleStockArrival(productId: string) {
  // 1. Find all pending pre-orders for this product
  const preOrders = await getPendingPreOrders(productId);

  // 2. Update pre-order status to 'ready'
  await updatePreOrderStatus(preOrders, "ready");

  // 3. Send notifications to customers
  for (const preOrder of preOrders) {
    await sendNotification({
      user_id: preOrder.user_id,
      type: "preorder_ready",
      title: "Your pre-order is ready!",
      message: `${preOrder.product_name} is now in stock and your order is being processed.`,
      link: `/account/orders/${preOrder.order_id}`,
    });
  }

  // 4. Update order status to 'processing'
  await updateOrdersStatus(
    preOrders.map((p) => p.order_id),
    "processing"
  );
}
```

### Pre-Order Cancellation Logic

```typescript
async function cancelPreOrder(orderId: string, itemId: string) {
  // 1. Update item status
  await updateOrderItem(itemId, { preorder_status: "cancelled" });

  // 2. Check if order has other items
  const order = await getOrder(orderId);
  const activeItems = order.items.filter(
    (i) => i.id !== itemId && i.preorder_status !== "cancelled"
  );

  // 3. Update order status if needed
  if (activeItems.length === 0) {
    await updateOrder(orderId, { status: "cancelled" });
  } else {
    // Recalculate preorder_status
    const hasPreOrders = activeItems.some((i) => i.is_preorder);
    const allPreOrders = activeItems.every((i) => i.is_preorder);

    await updateOrder(orderId, {
      preorder_status: allPreOrders ? "all" : hasPreOrders ? "partial" : "none",
    });
  }

  // 4. Decrement product preorder count
  await decrementPreOrderCount(
    order.items.find((i) => i.id === itemId).product_id
  );
}
```

## UI/UX Considerations

### Product Page

- Clear "Out of Stock" indicator
- Prominent "Pre-Order" button (different color from "Add to Cart")
- Estimated delivery message: "Available in 14 days" or specific date
- Optional: Show number of people who pre-ordered

### Cart Page

- Pre-order badge on item cards
- Estimated delivery date below item
- Notice at top: "This cart contains pre-order items"
- Separate sections for in-stock vs pre-order items (optional)

### Checkout Page

- Pre-order terms and conditions
- List of pre-order items with delivery estimates
- Notice: "Pre-order items will ship when available"
- Mixed orders: "Some items will ship immediately, pre-orders will follow"

### Order Confirmation

- Clear indication of which items are pre-orders
- Estimated delivery dates
- Email confirmation includes pre-order details

### Admin Dashboard

- "Pre-Orders" tab in orders section
- Filter by status: Pending, Ready, Fulfilled
- Bulk actions: Mark as ready, Mark as fulfilled
- Product-level view: See all pre-orders for a product
- Analytics widget on main dashboard

## Error Handling

### Stock Validation

- Prevent adding more pre-orders than reasonable (optional limit)
- Handle race conditions when multiple customers pre-order simultaneously
- Validate stock levels before marking pre-orders as ready

### Date Validation

- Ensure estimated restock date is in the future
- Handle timezone differences correctly
- Update estimates if date passes without stock arrival

### Notification Failures

- Retry failed notifications
- Log notification errors
- Provide admin interface to manually notify customers

## Testing Strategy

### Unit Tests

- Pre-order eligibility logic
- Estimated delivery calculations
- Stock arrival handler
- Cancellation logic

### Integration Tests

- End-to-end pre-order flow
- Mixed cart (in-stock + pre-order)
- Stock update triggers notifications
- Admin pre-order management

### Edge Cases

- Product goes back out of stock before pre-orders fulfilled
- Customer cancels pre-order
- Estimated date changes multiple times
- Insufficient stock for all pre-orders

## Migration Strategy

1. **Database Migration**: Add new columns to existing tables
2. **Backward Compatibility**: Existing orders work without pre-order fields
3. **Admin Training**: Document how to set restock dates
4. **Gradual Rollout**: Enable pre-orders product-by-product
5. **Monitoring**: Track pre-order metrics and customer feedback

## Future Enhancements

- Waitlist for products (notify when back in stock without ordering)
- Partial fulfillment (ship in-stock items first)
- Pre-order deposits or full payment upfront
- Automatic restock date estimation based on supplier data
- Pre-order priority tiers (VIP customers get first access)
