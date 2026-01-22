# Google OAuth Setup Guide

This guide walks you through configuring Google OAuth authentication for the Regal Platform.

## Prerequisites

- Access to [Google Cloud Console](https://console.cloud.google.com/)
- Access to your Supabase project dashboard
- Admin access to the application

## Step 1: Create Google OAuth Credentials

### 1.1 Create or Select a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown at the top
3. Either:
   - Select an existing project, OR
   - Click "New Project" and create one (e.g., "Regal Platform")

### 1.2 Enable Google+ API

1. In the left sidebar, go to **APIs & Services** → **Library**
2. Search for "Google+ API"
3. Click on it and click **Enable**

### 1.3 Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **External** user type (unless you have a Google Workspace)
3. Click **Create**
4. Fill in the required fields:
   - **App name**: Regal Platform
   - **User support email**: Your email address
   - **App logo**: (Optional) Upload your logo
   - **Authorized domains**: Add your domain (e.g., `yourdomain.com`)
   - **Developer contact information**: Your email address
5. Click **Save and Continue**
6. On the **Scopes** page:
   - Click **Add or Remove Scopes**
   - Select these scopes:
     - `.../auth/userinfo.email`
     - `.../auth/userinfo.profile`
     - `openid`
   - Click **Update** then **Save and Continue**
7. On **Test users** page (if in testing mode):
   - Add test user emails
   - Click **Save and Continue**
8. Review and click **Back to Dashboard**

### 1.4 Create OAuth 2.0 Client ID

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth 2.0 Client ID**
3. Select **Application type**: Web application
4. Enter **Name**: Regal Platform Web Client
5. Under **Authorized redirect URIs**, add:
   - **Development**: `https://dziapuidlqvqqkedudme.supabase.co/auth/v1/callback`
   - **Production** (when ready): `https://yourdomain.com/auth/callback`

   > **Important**: The redirect URI must match exactly. For Supabase, use the format:
   > `https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback`

6. Click **Create**
7. A dialog will appear with your credentials:
   - **Client ID**: Copy this (looks like `123456789-abc...xyz.apps.googleusercontent.com`)
   - **Client Secret**: Copy this (looks like `GOCSPX-...`)
8. Click **OK**

## Step 2: Configure Supabase

### 2.1 Add Google Provider

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Go to **Authentication** → **Providers**
4. Find **Google** in the list
5. Toggle **Enable Sign in with Google** to ON
6. Paste your credentials:
   - **Client ID**: Paste the Client ID from Google
   - **Client Secret**: Paste the Client Secret from Google
7. Click **Save**

### 2.2 Verify Redirect URL

1. In the same Google provider settings, you'll see the **Callback URL (for OAuth)**
2. It should be: `https://dziapuidlqvqqkedudme.supabase.co/auth/v1/callback`
3. Make sure this EXACTLY matches what you added in Google Cloud Console

## Step 3: Test the Configuration

### 3.1 Test in Development

1. Start your development server:

   ```bash
   cd attire
   npm run dev
   ```

2. Navigate to `http://localhost:3000/login`

3. Click the **Google** button

4. You should be redirected to Google's sign-in page

5. Sign in with a test Google account

6. After authentication, you should be redirected back to your app at `/account`

7. Check the database:
   - Go to Supabase Dashboard → **Table Editor** → **profiles**
   - You should see a new profile created with your Google name and avatar

### 3.2 Troubleshooting

**Issue: "Redirect URI mismatch"**

- **Solution**: Double-check that the redirect URI in Google Cloud Console exactly matches the Supabase callback URL
- Common mistake: Missing `/auth/v1/callback` at the end

**Issue: "Access blocked: This app's request is invalid"**

- **Solution**: Complete the OAuth consent screen configuration in Google Cloud Console
- Make sure you've added all required scopes

**Issue: "Error 400: invalid_request"**

- **Solution**: Verify that Google+ API is enabled in Google Cloud Console

**Issue: "Profile not created in database"**

- **Solution**: Check that the database trigger `on_auth_user_created` exists and is active
- Check Supabase logs for any errors

**Issue: "Session not persisting after login"**

- **Solution**:
  - Verify cookies are enabled in your browser
  - Check that you're not blocking third-party cookies
  - In development, make sure you're using `http://localhost` (not `127.0.0.1`)

**Issue: "Google button does nothing when clicked"**

- **Solution**:
  - Open browser console and check for errors
  - Verify that `signInWithGoogle` is properly imported in the login page
  - Check that the AuthContext is providing the method

## Step 4: Production Deployment

When deploying to production:

### 4.1 Update Google Cloud Console

1. Go to **APIs & Services** → **Credentials**
2. Click on your OAuth 2.0 Client ID
3. Under **Authorized redirect URIs**, add your production URL:
   - `https://yourdomain.com/auth/callback`
4. Click **Save**

### 4.2 Update OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Click **Publish App** to make it available to all users
3. Google may require verification if you're requesting sensitive scopes

### 4.3 Update Environment Variables

Make sure your production environment has the correct Supabase URL and keys.

## Security Best Practices

1. **Never commit credentials**: Keep Client ID and Secret secure
2. **Use HTTPS**: OAuth only works over HTTPS in production
3. **Minimal scopes**: Only request email and profile scopes
4. **Regular rotation**: Rotate Client Secret periodically
5. **Monitor usage**: Check Google Cloud Console for unusual activity

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Supabase Google OAuth Guide](https://supabase.com/docs/guides/auth/social-login/auth-google)

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review Supabase logs in the dashboard
3. Check browser console for client-side errors
4. Verify all configuration steps were completed

## Implementation Status

✅ AuthContext updated with `signInWithGoogle()` method
✅ OAuth callback route created at `/auth/callback`
✅ Login page updated with Google button and loading states
✅ Error handling implemented
✅ Session management configured

**Next Steps:**

1. Complete Google OAuth configuration in Google Cloud Console
2. Add credentials to Supabase
3. Test the OAuth flow
4. Deploy to production
