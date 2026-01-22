# Implementation Plan: Google OAuth Login

## Overview

This plan implements Google OAuth authentication by enhancing the AuthContext with a new sign-in method, updating the login page to handle OAuth flow, and creating a callback route to process OAuth redirects.

## Tasks

- [ ] 1. Configure Google OAuth in Supabase
  - Follow the Supabase Configuration Guide in design.md
  - Create Google OAuth credentials in Google Cloud Console
  - Add credentials to Supabase Authentication settings
  - Test the configuration with a test account
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 2. Add Google OAuth method to AuthContext
  - [x] 2.1 Add `signInWithGoogle` method to AuthContext
    - Create async function that calls `supabase.auth.signInWithOAuth()`
    - Configure provider as 'google'
    - Set redirectTo to `/auth/callback`
    - Add queryParams for offline access and consent prompt
    - Return error object for error handling
    - _Requirements: 1.1, 5.1_

  - [x] 2.2 Export `signInWithGoogle` in AuthContextType interface
    - Add method signature to interface
    - Update context value to include new method
    - _Requirements: 1.1_

- [x] 3. Create OAuth callback route
  - [x] 3.1 Create `/app/auth/callback/route.ts` file
    - Import NextRequest, NextResponse
    - Import createClient from Supabase
    - Export GET handler function
    - _Requirements: 1.2_

  - [x] 3.2 Implement code exchange logic
    - Extract code parameter from URL
    - Extract next parameter for redirect (default to /account)
    - Call `supabase.auth.exchangeCodeForSession(code)`
    - Handle errors gracefully
    - _Requirements: 1.2, 2.2, 2.3_

  - [x] 3.3 Implement redirect logic
    - Redirect to next parameter or /account
    - Preserve any error messages in URL params
    - _Requirements: 1.5_

- [x] 4. Update login page for Google OAuth
  - [x] 4.1 Add loading state for Google button
    - Create `isGoogleLoading` state variable
    - Disable button when loading
    - Show spinner icon when loading
    - _Requirements: 1.1_

  - [x] 4.2 Implement Google sign-in handler
    - Create `handleGoogleSignIn` async function
    - Set loading state to true
    - Call `signInWithGoogle()` from AuthContext
    - Handle errors by setting error state
    - Note: Success redirects to Google, no need to set loading false
    - _Requirements: 1.1, 2.3_

  - [x] 4.3 Connect handler to Google button
    - Add onClick handler to Google button
    - Pass `handleGoogleSignIn` function
    - Ensure button is disabled during loading
    - _Requirements: 1.1_

  - [x] 4.4 Update button UI for loading state
    - Show spinner when `isGoogleLoading` is true
    - Disable button when `isGoogleLoading` is true
    - Keep Google icon visible when not loading
    - _Requirements: 1.1_

- [ ] 5. Test OAuth flow
  - [ ] 5.1 Test new user sign-in with Google
    - Click Google button
    - Authenticate with new Google account
    - Verify profile created with Google name and avatar
    - Verify redirect to /account
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 4.1, 4.2_

  - [ ] 5.2 Test existing user sign-in with Google
    - Sign in with existing Google account
    - Verify existing profile preserved
    - Verify redirect to correct page
    - _Requirements: 1.4, 1.5, 4.3_

  - [ ] 5.3 Test admin user sign-in with Google
    - Sign in as admin with Google
    - Verify redirect to /admin
    - _Requirements: 1.5_

  - [ ] 5.4 Test error scenarios
    - Cancel OAuth popup (verify no error shown)
    - Test with invalid configuration (verify error message)
    - Test network failure (verify error message)
    - _Requirements: 2.1, 2.2, 2.3, 2.5_

  - [ ] 5.5 Test session persistence
    - Sign in with Google
    - Close browser
    - Reopen browser and visit site
    - Verify session restored without re-authentication
    - _Requirements: 3.1, 3.2_

- [ ] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Google OAuth configuration must be completed in Supabase before testing
- The existing database trigger will handle profile creation automatically
- OAuth tokens are managed by Supabase and stored securely
- The AuthContext already handles session restoration on page load
- Error handling uses the existing error display mechanism in the login page
