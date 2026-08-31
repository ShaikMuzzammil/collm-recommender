# Google OAuth Setup — CoLLM Platform

## Why it's not working
Google OAuth requires the correct callback URL registered in Google Cloud Console.
If the URL doesn't match exactly, you get "redirect_uri_mismatch" error.

## Step-by-step Setup

### 1. Google Cloud Console
Go to: https://console.cloud.google.com/apis/credentials

### 2. Create OAuth 2.0 Client ID
- Click **Create Credentials** → **OAuth 2.0 Client IDs**
- Application type: **Web application**
- Name: `CoLLM Platform`

### 3. Add Authorized Redirect URIs
**CRITICAL — must match exactly:**
```
https://collm-recommender.vercel.app/api/auth/callback/google
http://localhost:3000/api/auth/callback/google
```

If your Vercel URL is different, replace `collm-recommender.vercel.app` with your actual domain.

### 4. Copy Credentials
Copy:
- Client ID: `123456789-abc.apps.googleusercontent.com`
- Client Secret: `GOCSPX-xxxxxx`

### 5. Add to Vercel Environment Variables
Vercel → Project → Settings → Environment Variables:
```
GOOGLE_CLIENT_ID     = 123456789-abc.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET = GOCSPX-xxxxxx
```

### 6. Redeploy
After saving env vars, click **Redeploy** in Vercel → Deployments.

## Testing
1. Go to your app → Sign Up or Sign In
2. Click **Continue with Google** / **Sign up with Google**
3. Google picker appears → select account → redirected to dashboard ✓

## Troubleshooting

### "redirect_uri_mismatch"
The URL in Google Console doesn't match. Check:
- No trailing slash
- Correct protocol (https vs http)
- Exact domain match

### "OAuth consent screen not configured"
Go to: APIs & Services → OAuth consent screen
- User Type: **External**
- Fill app name, support email
- Add scopes: `email`, `profile`
- Add your email as test user (while in testing mode)

### "Access blocked: This app's request is invalid"
Your OAuth consent screen is in "Testing" mode and your email isn't a test user.
Solution: Add your email as a test user, OR publish the app.

### Works locally but not on Vercel
You only added `http://localhost:3000/...` but not the production URL.
Add BOTH URLs to Authorized Redirect URIs in Google Console.
