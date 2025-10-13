# 🔧 Build Process - Environment Variable Injection

## Overview

This document explains how environment variables are injected into the application at build time for deployment to static hosting platforms like Netlify.

## How It Works

### 1. Build Script (`scripts/inject-env.js`)

The build script reads environment variables from the deployment platform (e.g., Netlify) and generates a JavaScript file that exposes them to the browser.

**Process:**
1. Reads `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `NODE_ENV` from `process.env`
2. Generates `src/utils/env.js` with these values assigned to `window.ENV`
3. This file is loaded by the browser before `config.js`

### 2. Script Loading Order

The HTML must load scripts in this order:

```html
<!-- 1. Environment variables (generated at build time) -->
<script src="/src/utils/env.js"></script>

<!-- 2. Configuration (uses window.ENV) -->
<script src="/src/utils/config.js"></script>

<!-- 3. Supabase client (uses config) -->
<script src="/src/utils/supabaseClient.js"></script>
```

### 3. Configuration Flow

```
Environment Variables (Netlify/Vercel)
    ↓
npm run build (scripts/inject-env.js)
    ↓
src/utils/env.js (generated)
    ↓
window.ENV (available in browser)
    ↓
config.js (reads window.ENV)
    ↓
window.APP_ENV (available to app)
    ↓
supabaseClient.js (uses window.APP_ENV)
```

## Local Development

For local development, you have two options:

### Option 1: Create a .env file (Recommended)

```bash
# Copy the example
cp .env.example .env

# Edit with your credentials
nano .env
```

Then run the build script:
```bash
npm run build
```

### Option 2: Set environment variables inline

```bash
SUPABASE_URL="https://your-project.supabase.co" \
SUPABASE_ANON_KEY="your_key_here" \
npm run build
```

## Production Deployment

### Netlify

1. **Set Environment Variables:**
   - Go to: Site settings → Environment variables
   - Add:
     - `SUPABASE_URL` = `https://qtrbojicgwzbnolktwjp.supabase.co`
     - `SUPABASE_ANON_KEY` = Your anon key from Supabase

2. **Build Settings:**
   - Build command: `npm run build`
   - Publish directory: `.` (root)

3. **Deploy:**
   - Netlify will run `npm run build` automatically
   - The `env.js` file will be generated with your environment variables
   - The app will work correctly

### Vercel

1. **Set Environment Variables:**
   - Go to: Project Settings → Environment Variables
   - Add the same variables as Netlify

2. **Build Settings:**
   - Build Command: `npm run build`
   - Output Directory: `.`

### GitHub Pages

For GitHub Pages (which doesn't support environment variables), you'll need to:

1. Create `src/utils/env.js` manually with your values
2. Commit it to the repository (⚠️ Only safe for public anon keys)

```javascript
window.ENV = {
    SUPABASE_URL: 'https://qtrbojicgwzbnolktwjp.supabase.co',
    SUPABASE_ANON_KEY: 'your_anon_key_here',
    NODE_ENV: 'production'
};
```

## Important Notes

### Security

- ✅ **Safe to expose:** `SUPABASE_URL` and `SUPABASE_ANON_KEY` (protected by RLS)
- ❌ **Never expose:** `SUPABASE_SERVICE_KEY` or other sensitive keys

### Git Ignore

The generated `src/utils/env.js` file is in `.gitignore` and should not be committed (except for GitHub Pages deployments).

### Troubleshooting

**Error: "Missing required environment variables"**

Solution: Set the environment variables in your deployment platform:
- Netlify: Site settings → Environment variables
- Vercel: Project Settings → Environment Variables
- Local: Create a `.env` file and run `npm run build`

**Error: "env.js not found"**

Solution: Run `npm run build` before starting the app. This generates the `env.js` file.

## Files

- `scripts/inject-env.js` - Build script that generates env.js
- `src/utils/env.js` - Generated file (not in git)
- `src/utils/config.js` - Loads from window.ENV
- `src/utils/supabaseClient.js` - Uses configuration

## Testing

To test the build process locally:

```bash
# Set test values and run build
SUPABASE_URL="https://test.supabase.co" \
SUPABASE_ANON_KEY="test_key" \
npm run build

# Check the generated file
cat src/utils/env.js

# Start server
npm start
```
