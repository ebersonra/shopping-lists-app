# 🔧 Netlify Functions Environment Variables Setup

## Overview

This guide helps you fix the "Supabase credentials are required" error that occurs when Netlify Functions (Lambda) cannot access environment variables.

## The Problem

When you deploy to Netlify, the frontend and backend are separate:

- **Frontend** (HTML pages): Uses `SUPABASE_ANON_KEY` (public key)
- **Backend** (Netlify Functions in `src/api/`): Uses `SUPABASE_SERVICE_API_KEY` (service role key)

The error occurs when the backend functions don't have the required environment variables configured.

## Error Symptoms

```
GET /.netlify/functions/get-shopping-lists 500 (Internal Server Error)

{
  "error": "Supabase credentials are required",
  "details": "Error: Supabase credentials are required\n    at getClient (/var/task/src/repositories/shoppingListRepository.js:17:11)"
}
```

## Solution

### Step 1: Get Your Supabase Keys

1. Go to your Supabase project dashboard: https://app.supabase.com
2. Navigate to: **Settings → API**
3. You need TWO keys:
   - **anon/public key** - for frontend (safe to expose)
   - **service_role key** - for backend (⚠️ NEVER expose in frontend!)

### Step 2: Configure Netlify Environment Variables

#### Option A: Via Netlify Dashboard (Recommended)

1. Go to your Netlify site dashboard
2. Navigate to: **Site settings → Environment variables**
3. Click **"Add a variable"** or **"Add environment variables"**
4. Add the following variables:

```
Key: SUPABASE_URL
Value: https://your-project-id.supabase.co
Scopes: All scopes (or at least Production and Deploy Preview)

Key: SUPABASE_ANON_KEY
Value: your_anon_key_here
Scopes: All scopes

Key: SUPABASE_SERVICE_API_KEY
Value: your_service_role_key_here
Scopes: All scopes
```

5. Click **"Save"**

#### Option B: Via Netlify CLI

```bash
netlify env:set SUPABASE_URL "https://your-project-id.supabase.co"
netlify env:set SUPABASE_ANON_KEY "your_anon_key_here"
netlify env:set SUPABASE_SERVICE_API_KEY "your_service_role_key_here"
```

### Step 3: Redeploy Your Site

After setting environment variables, you must redeploy:

#### Option A: Trigger a new deploy via Git

```bash
git commit --allow-empty -m "Trigger redeploy for env vars"
git push
```

#### Option B: Manual redeploy via Netlify

1. Go to: **Deploys**
2. Click **"Trigger deploy"**
3. Select **"Deploy site"**

### Step 4: Verify the Fix

1. Wait for the deploy to complete
2. Visit your site and try to load shopping lists
3. Check the browser console (F12) for errors
4. If it works, you should see shopping lists loading without errors

## Local Development

To test the Netlify Functions locally, create a `.env` file in the project root:

```bash
# Create .env file
cat > .env << EOF
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_API_KEY=your_service_role_key_here
NODE_ENV=development
EOF

# Run Netlify Dev
netlify dev
```

The site will be available at http://localhost:8888

## Supported Environment Variable Names

The code supports multiple names for backward compatibility. In priority order:

1. `SUPABASE_SERVICE_API_KEY` (recommended)
2. `SUPABASE_SERVICE_ROLE_KEY` (Supabase official name)
3. `SUPABASE_SERVICE_KEY`
4. `SUPABASE_ANON_KEY` (fallback, not recommended for backend)

You only need to set **ONE** of these (preferably `SUPABASE_SERVICE_API_KEY`).

## Security Notes

⚠️ **IMPORTANT:**

- ✅ `SUPABASE_ANON_KEY` is safe for frontend (it has Row Level Security)
- ❌ `SUPABASE_SERVICE_API_KEY` must NEVER be exposed in frontend code
- ❌ `SUPABASE_SERVICE_API_KEY` bypasses all Row Level Security
- ✅ Only use `SUPABASE_SERVICE_API_KEY` in backend/serverless functions

## Troubleshooting

### Still getting the error after setting variables?

1. **Check if variables are actually set:**
   - In Netlify: Site settings → Environment variables
   - Verify all three variables are present

2. **Check deploy logs:**
   - Deploys → Latest deploy → Deploy log
   - Look for environment variable warnings

3. **Clear deploy cache and retry:**
   ```bash
   netlify deploy --prod --clear-cache
   ```

4. **Verify .gitignore:**
   - Make sure `.env` is in `.gitignore`
   - Never commit real credentials to git

### Local development not working?

1. **Make sure `.env` file exists in project root:**
   ```bash
   ls -la .env
   ```

2. **Check file permissions:**
   ```bash
   chmod 600 .env
   ```

3. **Verify environment variables are loaded:**
   ```bash
   netlify dev --debug
   ```

## Need Help?

If you're still experiencing issues:

1. Check the [main environment configuration docs](./ENVIRONMENT_CONFIG.md)
2. Review the [Netlify Functions documentation](https://docs.netlify.com/functions/get-started/)
3. Check [Supabase authentication docs](https://supabase.com/docs/guides/auth)

## Related Files

- `.env.example` - Template for environment variables
- `docs/ENVIRONMENT_CONFIG.md` - Complete environment setup guide
- `src/repositories/shoppingListRepository.js` - Where credentials are used
- `netlify.toml` - Netlify configuration
