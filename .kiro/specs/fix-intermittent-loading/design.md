# Design Document: Fix Intermittent Loading Issues

## Overview

This design addresses the intermittent loading issues in the Attire store by implementing a robust data fetching layer with request deduplication, proper caching, and React Strict Mode compatibility. The solution focuses on minimal changes to existing code while maximizing reliability.

## Architecture

The solution introduces a lightweight request management layer between components and the Supabase client:

```
┌─────────────────────────────────────────────────────────────┐
│                     React Components                         │
│  (AttireHomePage, ProductsPage, Header, AppContext)         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Request Manager                           │
│  - Request deduplication                                     │
│  - In-flight request tracking                               │
│  - Simple cache with TTL                                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Enhanced withRetry                          │
│  - Longer timeouts (20s default)                            │
│  - Better abort handling                                    │
│  - Strict Mode aware delays                                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Supabase Client                            │
│  - Stable singleton                                          │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Request Manager (`attire/src/lib/request-manager.ts`)

A simple utility for deduplicating requests and caching responses.

```typescript
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface RequestManager {
  // Execute a request with deduplication
  execute<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: {
      cacheTTL?: number;      // Cache duration in ms (default: 30000)
      forceRefresh?: boolean; // Bypass cache
    }
  ): Promise<T>;
  
  // Clear cache for a specific key or all
  invalidate(key?: string): void;
  
  // Check if a request is in-flight
  isPending(key: string): boolean;
}
```

### 2. Enhanced Supabase Client (`attire/src/lib/supabase/client.ts`)

Modifications to ensure stable initialization:

```typescript
// Use a module-level promise to handle concurrent initialization
let clientPromise: Promise<SupabaseClient> | null = null;
let browserClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (browserClient) return browserClient;
  
  // Synchronous creation - Supabase client creation is synchronous
  browserClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  return browserClient;
}
```

### 3. Enhanced withRetry (`attire/src/lib/services/attire.ts`)

Updated retry logic with better defaults:

```typescript
interface RetryOptions {
  retries?: number;        // Default: 3
  initialDelay?: number;   // Default: 500ms
  timeoutMs?: number;      // Default: 20000ms (increased from 15000)
  signal?: AbortSignal;
}

async function withRetry<T>(
  fn: (signal?: AbortSignal) => Promise<{ data: T | null; error: any; count?: number | null }>,
  options?: RetryOptions
): Promise<{ data: T | null; error: any; count?: number | null }>;
```

### 4. Supabase RPC for Batched Queries

Instead of making multiple round-trips to the database, we'll create a PostgreSQL function that returns all featured products in a single call.

#### Database Function (`get_featured_products`)

```sql
-- Create RPC function for fetching all featured products in one call
CREATE OR REPLACE FUNCTION get_featured_products(
  p_limit INTEGER DEFAULT 8
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'newArrivals', (
      SELECT COALESCE(json_agg(p), '[]'::json)
      FROM (
        SELECT * FROM products 
        WHERE 'new' = ANY(badges)
        ORDER BY created_at DESC
        LIMIT p_limit
      ) p
    ),
    'bestsellers', (
      SELECT COALESCE(json_agg(p), '[]'::json)
      FROM (
        SELECT * FROM products 
        WHERE 'bestseller' = ANY(badges)
        ORDER BY popularity DESC
        LIMIT p_limit
      ) p
    ),
    'onSale', (
      SELECT COALESCE(json_agg(p), '[]'::json)
      FROM (
        SELECT * FROM products 
        WHERE original_price IS NOT NULL AND original_price > price
        ORDER BY created_at DESC
        LIMIT p_limit
      ) p
    )
  ) INTO result;
  
  RETURN result;
END;
$$;
```

#### TypeScript Implementation

```typescript
export async function getFeaturedProducts(signal?: AbortSignal): Promise<{
  newArrivals: Product[];
  bestsellers: Product[];
  onSale: Product[];
}> {
  // Use request manager for deduplication and caching
  return requestManager.execute(
    'featured-products',
    async () => {
      // Single RPC call - one database round-trip instead of 3
      const { data, error } = await getSupabaseClient()
        .rpc('get_featured_products', { p_limit: 8 })
        .abortSignal(signal);
      
      if (error) throw error;
      
      // Map database columns to TypeScript interface
      return {
        newArrivals: mapProducts(data?.newArrivals || []),
        bestsellers: mapProducts(data?.bestsellers || []),
        onSale: mapProducts(data?.onSale || []),
      };
    },
    { cacheTTL: 60000 } // Cache for 1 minute
  );
}
```

### 5. RPC for Homepage Data (Categories + Featured Products)

For even better performance, we can create an RPC that fetches ALL homepage data in one call:

```sql
-- Create RPC function for fetching all homepage data
CREATE OR REPLACE FUNCTION get_homepage_data(
  p_product_limit INTEGER DEFAULT 8,
  p_category_limit INTEGER DEFAULT 4
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'categories', (
      SELECT COALESCE(json_agg(c), '[]'::json)
      FROM (
        SELECT * FROM categories 
        ORDER BY name ASC
        LIMIT p_category_limit
      ) c
    ),
    'newArrivals', (
      SELECT COALESCE(json_agg(p), '[]'::json)
      FROM (
        SELECT * FROM products 
        WHERE 'new' = ANY(badges)
        ORDER BY created_at DESC
        LIMIT p_product_limit
      ) p
    ),
    'bestsellers', (
      SELECT COALESCE(json_agg(p), '[]'::json)
      FROM (
        SELECT * FROM products 
        WHERE 'bestseller' = ANY(badges)
        ORDER BY popularity DESC
        LIMIT p_product_limit
      ) p
    ),
    'onSale', (
      SELECT COALESCE(json_agg(p), '[]'::json)
      FROM (
        SELECT * FROM products 
        WHERE original_price IS NOT NULL AND original_price > price
        ORDER BY created_at DESC
        LIMIT p_product_limit
      ) p
    )
  ) INTO result;
  
  RETURN result;
END;
$$;
```

This reduces the homepage from **4 separate database calls** (categories + 3 product queries) to **1 single RPC call**.

### 6. Optimized getFeaturedProducts
```

### 5. Component Updates

#### useStableEffect Hook

A custom hook that handles React Strict Mode gracefully:

```typescript
// attire/src/lib/hooks/useStableEffect.ts
export function useStableEffect(
  effect: (signal: AbortSignal) => void | (() => void),
  deps: React.DependencyList
) {
  const mountedRef = useRef(false);
  const cleanupRef = useRef<(() => void) | void>();
  
  useEffect(() => {
    // Small delay to handle Strict Mode double-mount
    const timeoutId = setTimeout(() => {
      mountedRef.current = true;
      const controller = new AbortController();
      cleanupRef.current = effect(controller.signal);
      
      return () => {
        controller.abort();
        cleanupRef.current?.();
      };
    }, 0);
    
    return () => {
      clearTimeout(timeoutId);
      if (mountedRef.current) {
        cleanupRef.current?.();
      }
    };
  }, deps);
}
```

## Data Models

No changes to existing data models. The solution operates at the fetching layer.

### Cache Key Structure

```typescript
// Cache keys follow a consistent pattern
const CACHE_KEYS = {
  categories: 'categories',
  featuredProducts: 'featured-products',
  products: (filters: string, sort: string, page: number) => 
    `products:${filters}:${sort}:${page}`,
  product: (id: string) => `product:${id}`,
};
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Singleton Consistency

*For any* number of concurrent calls to `getSupabaseClient()`, all calls SHALL return the exact same object reference.

**Validates: Requirements 1.1, 1.2**

### Property 2: Request Deduplication

*For any* set of concurrent requests with the same cache key made within the deduplication window, only one actual network request SHALL be made, and all callers SHALL receive the same response.

**Validates: Requirements 3.1**

### Property 3: Cache Persistence

*For any* successful data fetch, subsequent requests for the same data within the cache TTL SHALL return the cached data without making a new network request.

**Validates: Requirements 3.2**

### Property 4: Retry with Fallback

*For any* request that fails after all retry attempts, if cached data exists for that key, the cached data SHALL be returned instead of throwing an error.

**Validates: Requirements 2.4**

### Property 5: Strict Mode Resilience

*For any* component that mounts, unmounts within 100ms, and remounts (simulating React Strict Mode), the data fetch initiated by the final mount SHALL complete successfully without being aborted.

**Validates: Requirements 6.1, 6.2**

### Property 6: Loading State Stability

*For any* data fetch operation, the loading state SHALL transition from `true` to `false` exactly once per fetch cycle (no flickering between states).

**Validates: Requirements 4.4**

### Property 7: Concurrent Request Limiting

*For any* page load that triggers multiple data fetches, no more than 4 requests SHALL be in-flight simultaneously; additional requests SHALL be queued.

**Validates: Requirements 5.1, 5.2**

### Property 8: RPC Single Round-Trip

*For any* call to `getFeaturedProducts()` or `getHomepageData()`, exactly one database round-trip (RPC call) SHALL be made, returning all required data in a single response.

**Validates: Requirements 7.1, 7.2, 7.3, 7.4**

## Error Handling

### Network Errors

1. **Timeout**: Requests timeout after 20 seconds (configurable). On timeout, retry up to 3 times with exponential backoff (500ms, 1000ms, 2000ms delays).

2. **Connection Errors**: Treated same as timeout - retry with backoff.

3. **Supabase Errors**: 
   - `PGRST116` (no rows): Return empty result, don't retry
   - Other errors: Retry with backoff

4. **Abort Errors**: Silently ignore - these are intentional cancellations.

### Fallback Strategy

```
Request Failed
    │
    ▼
Check Cache ──Yes──► Return Cached Data
    │
    No
    ▼
Show Error State with Retry Button
```

### Error State UI

When all retries fail and no cache exists:
- Display a clear error message
- Show a "Retry" button
- Log error details to console (development only)

## Testing Strategy

### Unit Tests

Unit tests will verify individual functions work correctly:

1. **Request Manager Tests**
   - Cache hit/miss behavior
   - TTL expiration
   - Concurrent request deduplication

2. **withRetry Tests**
   - Successful request handling
   - Retry on failure
   - Timeout behavior
   - Abort signal handling

3. **Supabase Client Tests**
   - Singleton behavior

### Property-Based Tests

Property-based tests will use fast-check to verify properties hold across many inputs:

1. **Singleton Property Test**: Generate random concurrent access patterns and verify same instance returned
2. **Deduplication Property Test**: Generate random request patterns and verify deduplication
3. **Cache Property Test**: Generate random cache operations and verify consistency
4. **Strict Mode Property Test**: Simulate mount/unmount patterns and verify request completion

### Integration Tests

Manual testing scenarios:
1. Rapid page refresh (F5 spam)
2. Quick navigation between pages
3. Slow network simulation (Chrome DevTools)
4. React Strict Mode enabled (development default)

### Test Configuration

- Property tests: Minimum 100 iterations
- Test framework: Jest with fast-check for property-based testing
- Each property test tagged with: `**Feature: fix-intermittent-loading, Property {N}: {description}**`

