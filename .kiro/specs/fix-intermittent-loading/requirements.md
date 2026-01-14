# Requirements Document

## Introduction

This document outlines the requirements for fixing intermittent loading issues in the Attire store section. Users experience data fetching that randomly gets stuck on loading states when reloading pages, affecting categories in the header, "Shop by Category", "New Arrivals", "Bestsellers", "On Sale" sections, and the products listing page.

## Glossary

- **Supabase_Client**: The browser-side Supabase client used for database queries
- **AppContext**: Global React context providing categories and app-wide state
- **withRetry**: Utility function that wraps Supabase queries with retry logic and timeout handling
- **AbortController**: Browser API for cancelling fetch requests
- **Race_Condition**: A situation where the outcome depends on the timing of uncontrollable events
- **Connection_Pool**: Limited number of concurrent HTTP connections browsers allow per domain

## Root Cause Analysis

### Issue 1: Supabase Client Singleton Race Condition
The `getSupabaseClient()` function uses a singleton pattern that can cause issues during React's Strict Mode double-mounting or rapid navigation. Multiple components may attempt to initialize the client simultaneously.

### Issue 2: Aggressive Request Cancellation
The `useEffect` cleanup functions abort requests on every re-render or unmount. Combined with React 18's Strict Mode (which double-mounts components in development), this causes legitimate requests to be cancelled before completion.

### Issue 3: Browser Connection Limits
The `getFeaturedProducts` function makes 3 sequential Supabase requests. Combined with the AppContext fetching categories, and the Header potentially triggering additional fetches, this can exhaust browser connection limits (typically 6 per domain).

### Issue 4: Timeout Configuration
The 15-second timeout in `withRetry` may be too aggressive for slower connections or when Supabase is under load, causing premature request failures.

### Issue 5: Missing Request Deduplication
Multiple components (Header, AttireHomePage, ProductsPage) may request the same data simultaneously without coordination, leading to redundant requests and potential race conditions.

### Issue 6: State Updates After Unmount
Although AbortController is used, there's no guarantee that state updates won't be attempted after component unmount in edge cases.

## Requirements

### Requirement 1: Stable Supabase Client Initialization

**User Story:** As a user, I want the database connection to be reliably established, so that data loads consistently on every page visit.

#### Acceptance Criteria

1. THE Supabase_Client SHALL be initialized once and reused across all components
2. WHEN multiple components request the client simultaneously, THE Supabase_Client SHALL return the same instance
3. IF the client initialization fails, THEN THE Supabase_Client SHALL retry initialization with exponential backoff

### Requirement 2: Resilient Request Handling

**User Story:** As a user, I want data fetching to complete successfully even during rapid navigation, so that I see content instead of loading states.

#### Acceptance Criteria

1. WHEN a component unmounts during a fetch, THE System SHALL only abort the request if the component is truly being removed (not re-mounted)
2. WHEN a request times out, THE System SHALL retry with increased timeout before failing
3. THE withRetry utility SHALL use a minimum timeout of 20 seconds for initial requests
4. IF a request fails after all retries, THEN THE System SHALL display cached data if available

### Requirement 3: Request Deduplication and Caching

**User Story:** As a user, I want pages to load quickly without redundant network requests, so that I have a smooth browsing experience.

#### Acceptance Criteria

1. WHEN multiple components request the same data within 5 seconds, THE System SHALL deduplicate requests and share the response
2. THE System SHALL cache category data for the duration of the session
3. WHEN cached data exists, THE System SHALL display it immediately while fetching fresh data in the background
4. THE getFeaturedProducts function SHALL batch requests where possible to reduce connection usage

### Requirement 4: Graceful Loading State Management

**User Story:** As a user, I want to see content quickly and understand when data is loading, so that I don't think the page is broken.

#### Acceptance Criteria

1. WHEN data is being fetched, THE System SHALL show skeleton loaders for a maximum of 10 seconds before showing an error state
2. IF data fails to load, THEN THE System SHALL display a retry button with a clear error message
3. WHEN partial data is available, THE System SHALL display it rather than showing a full loading state
4. THE System SHALL not flash between loading and loaded states during normal operation

### Requirement 5: Connection Pool Management

**User Story:** As a user, I want all sections of the page to load reliably, so that I can browse products without missing content.

#### Acceptance Criteria

1. THE System SHALL limit concurrent Supabase requests to 4 per page load
2. WHEN the connection limit is reached, THE System SHALL queue additional requests
3. THE getFeaturedProducts function SHALL use a single RPC call instead of 3 separate queries
4. WHEN navigating between pages, THE System SHALL cancel pending requests for the previous page

### Requirement 7: Database Query Optimization via RPC

**User Story:** As a user, I want pages to load faster by reducing database round-trips, so that I have a snappy browsing experience.

#### Acceptance Criteria

1. THE System SHALL use Supabase RPC functions to batch multiple related queries into single database calls
2. THE get_featured_products RPC SHALL return new arrivals, bestsellers, and on-sale products in one call
3. THE get_homepage_data RPC SHALL return categories and all featured products in one call
4. WHEN fetching homepage data, THE System SHALL make exactly 1 database round-trip instead of 4
5. THE RPC functions SHALL be created as PostgreSQL functions in the Supabase database

### Requirement 6: Development Mode Compatibility

**User Story:** As a developer, I want the application to work correctly in development mode with React Strict Mode enabled, so that I can test reliably.

#### Acceptance Criteria

1. WHEN React Strict Mode double-mounts components, THE System SHALL handle the rapid mount/unmount/mount cycle gracefully
2. THE System SHALL not abort requests during the Strict Mode re-mount phase
3. WHILE in development mode, THE System SHALL log fetch lifecycle events for debugging

Another things to add
- I believe the api calls to the supabase are mutliple and their will be a round back and forth to data base when we can change it into rpc multiple concurrent calls, so we have to add that too