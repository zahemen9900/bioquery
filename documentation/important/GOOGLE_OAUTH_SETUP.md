# Google OAuth Setup for BioQuery

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Name it something like "BioQuery" or "BioQuery Auth"

## Step 2: Enable Google+ API

1. In the sidebar, go to **APIs & Services** > **Library**
2. Search for "Google+ API" (or "Google Identity")
3. Click **Enable**

## Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen**
2. Choose **External** (unless you have a Google Workspace)
3. Fill in the required fields:
   - **App name**: BioQuery
   - **User support email**: your email
   - **Developer contact email**: your email
   - **App logo** (optional): upload your BioQuery logo
4. Add scopes:
   - `userinfo.email`
   - `userinfo.profile`
5. Add test users (your email addresses that can sign in during development)
6. Click **Save and Continue**

## Step 4: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. Choose **Web application**
4. Configure:
   - **Name**: BioQuery Web Client
   - **Authorized JavaScript origins**: 
     - `http://localhost:5173` (for local dev)
     - `https://yourdomain.com` (your production URL)
   - **Authorized redirect URIs**:
     - `https://oqdxoazjsgudggihwsmr.supabase.co/auth/v1/callback`
     - (This is your Supabase project's callback URL)
5. Click **Create**

## Step 5: Copy Credentials

After creating, you'll see a modal with:
- **Client ID**: Something like `123456789-abc123def456.apps.googleusercontent.com`
- **Client Secret**: Something like `GOCSPX-abc123def456ghi789`

**Copy both values!**

## Step 6: Configure Supabase

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `oqdxoazjsgudggihwsmr`
3. Navigate to **Authentication** > **Providers**
4. Find **Google** and click to configure
5. Paste your credentials:
   - **Client ID** (from Step 5)
   - **Client Secret** (from Step 5)
6. Click **Save**

## Step 7: Update Your .env File

Add these to your `.env` file (though they're not needed in the frontend, Supabase handles it):

```bash
# Already in your .env
VITE_SUPABASE_URL=https://oqdxoazjsgudggihwsmr.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional: For reference only (Supabase uses these server-side)
# GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
# GOOGLE_CLIENT_SECRET=GOCSPX-your-secret
```

## Step 8: Test Sign In

1. Run your app: `npm run dev`
2. Navigate to `/auth`
3. Click "Continue with Google"
4. You should see the Google sign-in prompt
5. After successful authentication, Supabase will:
   - Create an entry in `auth.users`
   - Trigger `handle_new_user()` function
   - Create entries in `public.users` and `public.user_settings`

## Redirect URI Pattern

Your Supabase callback URL follows this pattern:
\`\`\`
https://{SUPABASE_PROJECT_REF}.supabase.co/auth/v1/callback
\`\`\`

For your project:
\`\`\`
https://oqdxoazjsgudggihwsmr.supabase.co/auth/v1/callback
\`\`\`

## Testing with Multiple Accounts

During development (before publishing the OAuth consent screen):
1. Add test users in Google Cloud Console
2. Only these users can sign in
3. Once published, anyone with a Google account can sign in

## Production Checklist

Before going live:
- [ ] Verify OAuth consent screen is complete
- [ ] Submit for verification if needed (for logo, sensitive scopes)
- [ ] Add production domain to authorized origins
- [ ] Update redirect URIs with production Supabase URL
- [ ] Test with non-test user accounts

## Troubleshooting

**Error: "redirect_uri_mismatch"**
- Check that the callback URL exactly matches what's in Google Cloud Console
- Format: `https://{project-ref}.supabase.co/auth/v1/callback`

**Error: "access_denied"**
- User might not be added as a test user (if app not published)
- Check OAuth consent screen status

**Error: "invalid_client"**
- Double-check Client ID and Secret in Supabase Dashboard
- Make sure credentials weren't regenerated in Google Cloud Console

## Current Setup

Your Supabase project: `oqdxoazjsgudggihwsmr`
Your callback URL: `https://oqdxoazjsgudggihwsmr.supabase.co/auth/v1/callback`

**Next Steps:**
1. Get your Client ID and Secret from Google Cloud Console
2. Add them to Supabase Authentication > Providers > Google
3. Test the sign-in flow!
