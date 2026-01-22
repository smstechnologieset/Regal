# Design Document: Google OAuth Login

## Overview

This design implements Google OAuth 2.0 authentication for the Regal Platform using Supabase Auth. Users will be able to sign in with their Google account through a single button click, with automatic profile creation and session management.

## Architecture

### Authentication Flow

```
User clicks "Google" button
    ↓
Client calls signInWithOAuth()
    ↓
Supabase redirects to Google OAuth
    ↓
User authenticates with Google
    ↓
Google redirects back to app with code
    ↓
Supabase exchanges code for session
    ↓
Database trigger creates/updates profile
    ↓
Client receives session and user data
    ↓
App redirects to appropriate page
```

### Components

1. **Login Page** (`/login/page.tsx`)
   - Renders Google OAuth button
   - Handles OAuth initiation
   - Displays loading states and errors

2. **Auth Context** (`/context/AuthContext.tsx`)
   - Adds `signInWithGoogle()` method
   - Handles OAuth callbacks
   - Manages session state

3. **Auth Callback Route** (`/auth/callback/route.ts`)
   - Processes OAuth redirect
   - Exchanges code for session
   - Handles errors

4. **Database Trigger** (existing)
   - Creates profile on new user signup
   - Populates metadata from OAuth provider

## Data Models

### OAuth User Metadata

When a user signs in with Google, Supabase provides:

```typescript
{
  user: {
    id: string,
    email: string,
    user_metadata: {
      full_name: string,
      avatar_url: string,
      email: string,
      email_verified: boolean,
      phone_verified: boolean,
      sub: string  // Google user ID
    },
    app_metadata: {
      provider: 'google',
      providers: ['google']
    }
  }
}
```

### Profile Creation

The existing database trigger will create a profile using:

- `full_name` from `user_metadata.full_name`
- `avatar_url` from `user_metadata.avatar_url`
- `role` defaults to 'user'

## Implementation Details

### 1. Auth Context Enhancement

Add a new method to AuthContext:

```typescript
const signInWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });
  return { error };
};
```

### 2. Login Page Update

Update the Google button to call the new method:

```typescript
const handleGoogleSignIn = async () => {
  setIsLoading(true);
  const { error } = await signInWithGoogle();

  if (error) {
    setErrors({ general: error.message });
    setIsLoading(false);
  }
  // If successful, user will be redirected to Google
};
```

### 3. Auth Callback Route

Create `/app/auth/callback/route.ts`:

```typescript
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/account";

  if (code) {
    const supabase = createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL(next, request.url));
}
```

### 4. Loading States

Add loading state management:

- Show spinner on button during OAuth initiation
- Disable button during OAuth flow
- Show loading overlay during redirect

## Error Handling

### Error Types

1. **User Cancellation**
   - User closes Google popup
   - No error message shown
   - Return to login page

2. **Network Errors**
   - Connection timeout
   - Show: "Unable to connect. Please check your internet connection."

3. **OAuth Errors**
   - Invalid credentials
   - Scope rejection
   - Show: "Google sign-in failed. Please try again."

4. **Profile Creation Errors**
   - Database trigger fails
   - Retry with exponential backoff (handled by AuthContext)

### Error Display

Errors are displayed in the existing error banner:

```typescript
{errors.general && (
  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
    <AlertCircle size={18} />
    {errors.general}
  </div>
)}
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: OAuth Initiation Success

_For any_ valid user interaction with the Google button, the system should successfully initiate the OAuth flow and redirect to Google's authentication page.
**Validates: Requirements 1.1**

### Property 2: Session Creation on Success

_For any_ successful OAuth authentication, the system should create a valid session with user data populated from Google.
**Validates: Requirements 1.2, 3.1**

### Property 3: Profile Creation for New Users

_For any_ new user authenticating with Google, the system should create a profile record with their Google display name and avatar.
**Validates: Requirements 1.3, 4.1, 4.2**

### Property 4: Profile Preservation for Existing Users

_For any_ existing user authenticating with Google, the system should retrieve their existing profile without modification.
**Validates: Requirements 1.4, 4.3**

### Property 5: Error Recovery

_For any_ OAuth error, the system should display an appropriate error message and allow immediate retry without page reload.
**Validates: Requirements 2.3, 2.5**

### Property 6: Redirect Correctness

_For any_ successful authentication, the system should redirect users to the correct destination based on their role (admin → /admin, user → /account).
**Validates: Requirements 1.5**

### Property 7: Session Persistence

_For any_ authenticated user, closing and reopening the browser should restore their session without requiring re-authentication.
**Validates: Requirements 3.2**

### Property 8: Secure Token Handling

_For any_ OAuth flow, the system should never expose OAuth tokens to client-side JavaScript or browser console.
**Validates: Requirements 5.4, 5.5**

## Testing Strategy

### Unit Tests

1. **Auth Context Tests**
   - Test `signInWithGoogle()` method
   - Mock Supabase client responses
   - Verify error handling

2. **Callback Route Tests**
   - Test code exchange
   - Test redirect logic
   - Test error scenarios

### Integration Tests

1. **OAuth Flow Test**
   - Mock Google OAuth provider
   - Test complete flow from button click to session creation
   - Verify profile creation

2. **Error Handling Test**
   - Simulate network failures
   - Simulate OAuth errors
   - Verify error messages displayed

### Manual Testing

1. **New User Flow**
   - Sign in with new Google account
   - Verify profile created with correct data
   - Verify redirect to /account

2. **Existing User Flow**
   - Sign in with existing Google account
   - Verify existing profile preserved
   - Verify correct redirect

3. **Admin User Flow**
   - Sign in as admin with Google
   - Verify redirect to /admin

4. **Error Scenarios**
   - Cancel OAuth popup
   - Disconnect internet during flow
   - Use invalid credentials

## Supabase Configuration Guide

### Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure OAuth consent screen:
   - User Type: External
   - App name: Regal Platform
   - User support email: your email
   - Authorized domains: your domain
   - Scopes: email, profile, openid
6. Create OAuth Client ID:
   - Application type: Web application
   - Name: Regal Platform
   - Authorized redirect URIs:
     - Development: `https://dziapuidlqvqqkedudme.supabase.co/auth/v1/callback`
     - Production: `https://your-domain.com/auth/callback`
7. Copy Client ID and Client Secret

### Step 2: Configure Supabase

1. Go to Supabase Dashboard → Authentication → Providers
2. Enable Google provider
3. Paste Client ID and Client Secret
4. Save configuration

### Step 3: Test Configuration

1. Run the application locally
2. Click "Google" button on login page
3. Verify redirect to Google
4. Authenticate with test account
5. Verify redirect back to application
6. Check profile created in database

### Troubleshooting

**Issue: "Redirect URI mismatch"**

- Solution: Verify redirect URI in Google Console matches Supabase callback URL exactly

**Issue: "Access blocked: This app's request is invalid"**

- Solution: Complete OAuth consent screen configuration in Google Console

**Issue: "Profile not created"**

- Solution: Check database trigger is active and logs for errors

**Issue: "Session not persisting"**

- Solution: Verify cookies are enabled and not blocked by browser

## Security Considerations

1. **PKCE Flow**: Supabase automatically uses PKCE for OAuth, preventing authorization code interception
2. **State Parameter**: Supabase validates state parameter to prevent CSRF attacks
3. **Minimal Scopes**: Only request email and profile scopes, no additional permissions
4. **Secure Storage**: Tokens stored in httpOnly cookies, not accessible to JavaScript
5. **HTTPS Only**: OAuth only works over HTTPS in production

## Performance Considerations

1. **Redirect Speed**: OAuth redirect is near-instant, no optimization needed
2. **Profile Creation**: Database trigger executes in <100ms
3. **Session Restoration**: Cached in AuthContext, no additional requests
4. **Error Recovery**: Immediate retry without page reload

## Future Enhancements

1. **Additional Providers**: Facebook, Apple, Microsoft
2. **Account Linking**: Link multiple OAuth providers to one account
3. **Profile Sync**: Periodically update avatar from Google
4. **OAuth Scope Expansion**: Request additional permissions for calendar integration
