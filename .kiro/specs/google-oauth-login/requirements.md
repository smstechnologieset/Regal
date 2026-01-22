# Requirements Document: Google OAuth Login

## Introduction

This feature enables users to sign in to the Regal Platform using their Google account through OAuth 2.0 authentication. This provides a seamless, secure login experience without requiring users to create and remember separate credentials.

## Glossary

- **OAuth Provider**: Google's authentication service that handles user identity verification
- **Supabase Auth**: The authentication service managing user sessions and provider integrations
- **Login Page**: The `/login` route where users authenticate
- **Auth Context**: React context managing authentication state throughout the application
- **Profile**: User account data stored in the profiles table
- **Redirect URL**: The callback URL where Google sends users after authentication

## Requirements

### Requirement 1: Google OAuth Button Functionality

**User Story:** As a user, I want to click the Google login button and authenticate with my Google account, so that I can quickly access the platform without creating a password.

#### Acceptance Criteria

1. WHEN a user clicks the "Google" button on the login page, THEN the system SHALL initiate OAuth flow with Google
2. WHEN the OAuth flow completes successfully, THEN the system SHALL create or retrieve the user's profile
3. WHEN a new user signs in with Google, THEN the system SHALL create a profile record with their Google display name
4. WHEN an existing user signs in with Google, THEN the system SHALL retrieve their existing profile
5. WHEN authentication succeeds, THEN the system SHALL redirect users to their appropriate destination (account page for users, admin dashboard for admins)

### Requirement 2: OAuth Flow Error Handling

**User Story:** As a user, I want clear feedback if Google login fails, so that I understand what went wrong and can try again.

#### Acceptance Criteria

1. WHEN the OAuth flow is cancelled by the user, THEN the system SHALL return to the login page without error messages
2. WHEN the OAuth flow fails due to network issues, THEN the system SHALL display an error message explaining the issue
3. WHEN the OAuth provider returns an error, THEN the system SHALL display a user-friendly error message
4. WHEN an error occurs, THEN the system SHALL log technical details for debugging
5. IF authentication fails, THEN the system SHALL allow the user to retry immediately

### Requirement 3: Session Management

**User Story:** As a user, I want my Google login session to persist across browser sessions, so that I don't have to log in repeatedly.

#### Acceptance Criteria

1. WHEN a user successfully authenticates with Google, THEN the system SHALL create a persistent session
2. WHEN a user returns to the site, THEN the system SHALL restore their session if valid
3. WHEN a user signs out, THEN the system SHALL clear the Google OAuth session
4. WHEN a session expires, THEN the system SHALL prompt the user to re-authenticate

### Requirement 4: Profile Synchronization

**User Story:** As a user, I want my Google profile information to be used in my account, so that my name and avatar are automatically populated.

#### Acceptance Criteria

1. WHEN a new user signs in with Google, THEN the system SHALL populate their full_name from Google's display name
2. WHEN a new user signs in with Google, THEN the system SHALL populate their avatar_url from Google's profile picture
3. WHEN an existing user signs in with Google, THEN the system SHALL preserve their existing profile data
4. WHEN profile creation fails, THEN the system SHALL retry with exponential backoff

### Requirement 5: Security and Privacy

**User Story:** As a user, I want my Google authentication to be secure, so that my account cannot be compromised.

#### Acceptance Criteria

1. THE system SHALL use PKCE (Proof Key for Code Exchange) flow for OAuth
2. THE system SHALL validate OAuth state parameters to prevent CSRF attacks
3. THE system SHALL only request necessary OAuth scopes (email, profile)
4. THE system SHALL store OAuth tokens securely in httpOnly cookies
5. THE system SHALL not expose OAuth tokens to client-side JavaScript

### Requirement 6: Supabase Configuration

**User Story:** As a developer, I want clear instructions for configuring Google OAuth in Supabase, so that the feature works correctly in all environments.

#### Acceptance Criteria

1. THE documentation SHALL include steps to create Google OAuth credentials
2. THE documentation SHALL include steps to configure Supabase with Google credentials
3. THE documentation SHALL include the correct redirect URLs for development and production
4. THE documentation SHALL include steps to test the OAuth flow
5. THE documentation SHALL include troubleshooting steps for common issues
