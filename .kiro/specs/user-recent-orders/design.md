# Design Document: User Recent Orders Display

## Overview

This design implements functional Recent Orders display on the user account overview page by fetching real order data from Supabase. The solution uses the existing database schema and adds a new API service function to retrieve user orders with proper filtering and sorting.

## Architecture

The solution follows the existing pattern used in the admin dashboard for fetching orders:

```
┌─────────────────────────────────────────────────────────────┐
│                  Account Page Component                      │
│  - Fetches orders on mount                                   │
│  - Displays loading/error/empty states                       │
│  - Renders order list with status badges                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  getUserOrders() Function                    │
│  - Client-side Supabase query                                │
│  - Filters by authenticated user ID                          │
│  - Orders by created_at DESC                                 │
│  - Limits to 5 results                                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Supabase Database                          │
│  - orders table with RLS policies                            │
│  - User can only see their own orders                        │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Order Service Function

Create a new function in the API layer to fetch user orders:

```typescript
// attire/src/lib/services/orders.ts

export interface UserOrder {
  id: string;
  service_type: "attire" | "events" | "bridal" | "catering";
  status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
  total: number;
  created_at: string;
  details: Record<string, unknown>;
}

/**
 * Fetch recent orders for the authenticated user
 * @param limit - Maximum number of orders to fetch (default: 5)
 * @returns Array of user orders
 */
export async function getUserOrders(limit: number = 5): Promise<UserOrder[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("orders")
    .select("id, service_type, status, total, created_at, details")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching user orders:", error);
    throw new Error("Failed to fetch orders");
  }

  return data || [];
}
```

### 2. Updated Account Page Component

Modify the account page to fetch and display real orders:

```typescript
// attire/src/app/account/page.tsx

export default function AccountPage() {
  const { profile, user } = useAuth();
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrders() {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);
        const data = await getUserOrders(5);
        setOrders(data);
      } catch (err) {
        console.error("Failed to load orders:", err);
        setError("Failed to load orders. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, [user]);

  // ... rest of component
}
```

### 3. Order Display Helpers

Utility functions for formatting order data:

```typescript
// Helper to format service type for display
function formatServiceType(serviceType: string): string {
  return serviceType.charAt(0).toUpperCase() + serviceType.slice(1);
}

// Helper to format date
function formatOrderDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Helper to get first item name from order details
function getOrderSummary(details: Record<string, unknown>): string {
  const items = details.items as any[];
  if (!items || items.length === 0) return "Order";

  const firstItem = items[0];
  const itemName = firstItem.product?.name || firstItem.productName || "Item";

  if (items.length > 1) {
    return `${itemName} +${items.length - 1} more`;
  }

  return itemName;
}
```

## Data Models

Using existing database schema - no changes needed:

```typescript
// From attire/src/types/database.ts
export interface Order {
  id: string;
  user_id: string;
  service_type: "attire" | "events" | "bridal" | "catering";
  status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
  details: Record<string, unknown>;
  total: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: User Isolation

_For any_ authenticated user, the getUserOrders function SHALL return only orders where the user_id matches the authenticated user's ID, and SHALL NOT return orders belonging to other users.

**Validates: Requirements 1.2**

### Property 2: Order Sorting

_For any_ list of orders returned by getUserOrders, the orders SHALL be sorted by created_at timestamp in descending order, with the most recent order first.

**Validates: Requirements 1.3**

### Property 3: Result Limit

_For any_ call to getUserOrders with a limit parameter, the function SHALL return at most that number of orders, even if more orders exist in the database.

**Validates: Requirements 1.4**

### Property 4: Status Badge Consistency

_For any_ order status value, the getStatusBadge function SHALL return a consistent CSS class string that corresponds to the correct color scheme for that status.

**Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**

## Error Handling

### Database Query Errors

1. **Network Errors**: If the Supabase query fails due to network issues, display error message with retry button
2. **Authentication Errors**: If user is not authenticated, the RLS policy will prevent data access - redirect to login
3. **Permission Errors**: If RLS policy denies access, display appropriate error message

### Error State UI

```typescript
{
  error && (
    <div className="p-8 text-center">
      <p className="text-red-600 mb-4">{error}</p>
      <Button onClick={fetchOrders} variant="outline">
        Retry
      </Button>
    </div>
  );
}
```

### Loading State UI

```typescript
{
  loading && (
    <div className="p-8 text-center">
      <div className="animate-spin w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full mx-auto"></div>
      <p className="text-slate-500 mt-4">Loading orders...</p>
    </div>
  );
}
```

## Testing Strategy

### Unit Tests

1. **getUserOrders Function Tests**

   - Test successful order fetch
   - Test empty result handling
   - Test error handling
   - Test limit parameter

2. **Helper Function Tests**
   - Test formatServiceType with all service types
   - Test formatOrderDate with various date formats
   - Test getOrderSummary with different order details structures

### Integration Tests

Manual testing scenarios:

1. User with multiple orders - verify 5 most recent shown
2. User with no orders - verify empty state displayed
3. New user - verify empty state with CTA
4. After placing order - verify new order appears in list
5. Network error simulation - verify error state and retry

### Property-Based Tests

Property-based tests would verify:

1. **User Isolation Property**: Generate random user IDs and verify orders are filtered correctly
2. **Sorting Property**: Generate random order sets and verify sorting is maintained
3. **Limit Property**: Generate various limit values and verify result count

### Test Configuration

- Unit tests: Jest with React Testing Library
- Integration tests: Manual testing in development environment
- Each test should verify specific requirements from the requirements document
