# Implementation Plan: Fix Intermittent Loading Issues

## Overview

This implementation plan addresses the intermittent loading issues in the Attire store by creating Supabase RPC functions for batched queries, implementing a request manager for deduplication/caching, and updating components to handle React Strict Mode gracefully.

## Tasks

- [ ] 1. Create Supabase RPC functions for batched queries
  - [ ] 1.1 Create `get_featured_products` PostgreSQL function
    - Create SQL migration file with the RPC function
    - Function returns JSON with newArrivals, bestsellers, onSale arrays
    - _Requirements: 7.1, 7.2_
  - [ ] 1.2 Create `get_homepage_data` PostgreSQL function
    - Create SQL migration file with the RPC function
    - Function returns categories + all featured products in one call
    - _Requirements: 7.3, 7.4_

- [ ] 2. Create Request Manager utility
  - [ ] 2.1 Implement request manager with caching and deduplication
    - Create `attire/src/lib/request-manager.ts`
    - Implement in-memory cache with TTL
    - Implement request deduplication for concurrent calls
    - _Requirements: 3.1, 3.2_
  - [ ]* 2.2 Write property test for request deduplication
    - **Property 2: Request Deduplication**
    - **Validates: Requirements 3.1**

- [ ] 3. Update Supabase client and retry logic
  - [ ] 3.1 Enhance withRetry utility
    - Increase default timeout from 15s to 20s
    - Improve abort signal handling
    - Add better logging for debugging
    - _Requirements: 2.2, 2.3_
  - [ ] 3.2 Verify Supabase client singleton stability
    - Ensure getSupabaseClient() always returns same instance
    - _Requirements: 1.1, 1.2_
  - [ ]* 3.3 Write property test for singleton consistency
    - **Property 1: Singleton Consistency**
    - **Validates: Requirements 1.1, 1.2**

- [ ] 4. Update attire service to use RPC
  - [ ] 4.1 Update getFeaturedProducts to use RPC
    - Replace 3 separate queries with single `get_featured_products` RPC call
    - Integrate with request manager for caching
    - _Requirements: 5.3, 7.2_
  - [ ] 4.2 Create getHomepageData function using RPC
    - New function that calls `get_homepage_data` RPC
    - Returns categories and featured products in one call
    - _Requirements: 7.3, 7.4_
  - [ ]* 4.3 Write property test for RPC single round-trip
    - **Property 8: RPC Single Round-Trip**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4**

- [ ] 5. Create useStableEffect hook for Strict Mode compatibility
  - [ ] 5.1 Implement useStableEffect hook
    - Create `attire/src/lib/hooks/useStableEffect.ts`
    - Add small delay before aborting to handle Strict Mode double-mount
    - _Requirements: 6.1, 6.2_
  - [ ]* 5.2 Write property test for Strict Mode resilience
    - **Property 5: Strict Mode Resilience**
    - **Validates: Requirements 6.1, 6.2**

- [ ] 6. Update AttireHomePage component
  - [ ] 6.1 Refactor AttireHomePage to use new data fetching
    - Use getHomepageData RPC for single fetch
    - Use useStableEffect for Strict Mode compatibility
    - Remove separate category and featured products fetches
    - _Requirements: 4.3, 4.4, 7.4_
  - [ ]* 6.2 Write property test for loading state stability
    - **Property 6: Loading State Stability**
    - **Validates: Requirements 4.4**

- [ ] 7. Update AppContext for optimized category fetching
  - [ ] 7.1 Update AppContext to use request manager
    - Integrate category fetching with request manager cache
    - Use useStableEffect for Strict Mode compatibility
    - _Requirements: 3.2, 6.1_

- [ ] 8. Update ProductsPage component
  - [ ] 8.1 Refactor ProductsPage data fetching
    - Use useStableEffect for Strict Mode compatibility
    - Integrate with request manager for caching
    - _Requirements: 2.1, 4.4_

- [ ] 9. Checkpoint - Verify core functionality
  - Ensure all tests pass, ask the user if questions arise.
  - Test homepage loading with rapid refresh
  - Test products page with filter changes
  - Verify no loading state flickering

- [ ] 10. Add error handling and fallback UI
  - [ ] 10.1 Implement error state with retry button
    - Add error boundary or error state to components
    - Show retry button when data fails to load
    - _Requirements: 4.2_
  - [ ] 10.2 Implement cache fallback on failure
    - Return cached data when fresh fetch fails
    - _Requirements: 2.4_
  - [ ]* 10.3 Write property test for retry with fallback
    - **Property 4: Retry with Fallback**
    - **Validates: Requirements 2.4**

- [ ] 11. Final checkpoint - Full integration testing
  - Ensure all tests pass, ask the user if questions arise.
  - Test rapid page navigation
  - Test with slow network (Chrome DevTools throttling)
  - Verify React Strict Mode compatibility in development

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- The RPC functions must be deployed to Supabase before the TypeScript changes can work
