# Chorus Deployment Guide

**Version:** 1.0
**Last Updated:** November 13, 2025
**Epic:** 1 (Foundation Infrastructure)

This document provides step-by-step instructions for deploying Chorus to production, including Supabase configuration, Google OAuth setup, and Vercel deployment.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Supabase Setup](#supabase-setup)
3. [Google OAuth Configuration](#google-oauth-configuration)
4. [Environment Variables](#environment-variables)
5. [Database Migrations](#database-migrations)
6. [Vercel Deployment](#vercel-deployment)
7. [Post-Deployment Verification](#post-deployment-verification)
8. [Monitoring and Observability](#monitoring-and-observability)
9. [Rollback Procedures](#rollback-procedures)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting deployment, ensure you have:

- [ ] Node.js 18+ installed locally
- [ ] Supabase account ([sign up](https://supabase.com))
- [ ] Vercel account ([sign up](https://vercel.com))
- [ ] Google Cloud Console account ([sign up](https://console.cloud.google.com))
- [ ] Git repository access
- [ ] `supabase` CLI installed (`npm install -g supabase`)
- [ ] `vercel` CLI installed (optional, `npm install -g vercel`)

---

## Supabase Setup

### 1. Create Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Fill in project details:
   - **Name:** `chorus-production` (or your preferred name)
   - **Database Password:** Generate a strong password (save it securely)
   - **Region:** Choose closest to your users (e.g., `us-east-1`)
4. Click "Create new project"
5. Wait for project initialization (~2 minutes)

### 2. Get Supabase Credentials

Once the project is ready, navigate to **Settings > API**:

- **Project URL:** `https://xxxxx.supabase.co` (copy this)
- **anon public key:** `eyJhbGc...` (copy this)
- **service_role key:** `eyJhbGc...` (copy this, keep it secret)

Save these values for the environment variables step.

### 3. Configure Authentication Settings

Navigate to **Authentication > Settings**:

1. **Site URL:** Set to your production domain (e.g., `https://chorus.example.com`)
2. **Redirect URLs:** Add:
   - `https://chorus.example.com/api/auth/callback`
   - `http://localhost:3000/api/auth/callback` (for local development)
3. **JWT Expiry:** 604800 seconds (7 days) - default is fine
4. **Email Auth:** Enabled by default
5. **Confirm Email:** Enable for production (recommended)

Click "Save" at the bottom.

---

## Google OAuth Configuration

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click **Select a Project** → **New Project**
3. **Project Name:** `Chorus Chat` (or your preference)
4. Click **Create**

### Step 2: Configure OAuth Consent Screen

1. In the left menu, navigate to **APIs & Services** → **OAuth consent screen**
2. Select **External** user type (unless you have Google Workspace)
3. Click **Create**
4. Fill in required fields:
   - **App name:** Chorus
   - **User support email:** Your email
   - **Developer contact information:** Your email
5. Click **Save and Continue**
6. **Scopes:** Click **Add or Remove Scopes**
   - Select `.../auth/userinfo.email`
   - Select `.../auth/userinfo.profile`
7. Click **Save and Continue**
8. **Test users:** Add your email for testing
9. Click **Save and Continue**, then **Back to Dashboard**

### Step 3: Create OAuth Credentials

1. Navigate to **APIs & Services** → **Credentials**
2. Click **+ Create Credentials** → **OAuth Client ID**
3. **Application type:** Web application
4. **Name:** Chorus Production
5. **Authorized JavaScript origins:**
   - `https://chorus.example.com` (your production domain)
   - `http://localhost:3000` (for local development)
6. **Authorized redirect URIs:**
   - `https://xxxxx.supabase.co/auth/v1/callback` (replace with your Supabase URL)
   - `http://localhost:54321/auth/v1/callback` (for local Supabase)
7. Click **Create**
8. **Copy** the **Client ID** and **Client Secret** (you'll need these next)

### Step 4: Configure Google OAuth in Supabase

1. Go to Supabase Dashboard → **Authentication** → **Providers**
2. Find **Google** in the list and toggle it **ON**
3. Paste your **Client ID** from Google Cloud Console
4. Paste your **Client Secret** from Google Cloud Console
5. Click **Save**

### Step 5: Test OAuth Flow

1. Start your local development server: `npm run dev`
2. Navigate to `http://localhost:3000/login`
3. Click "Sign in with Google"
4. Verify redirect to Google consent screen
5. After consent, verify redirect back to `/servers` with session
6. Check Supabase Dashboard → **Authentication** → **Users** to see the new user

✅ If the test succeeds, OAuth is configured correctly!

---

## Environment Variables

### Local Development (`.env.local`)

Create a `.env.local` file in the project root:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Supabase Service Role (for server-side operations)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Gemini AI (for Epic 2 - AI Integration)
GEMINI_API_KEY=your_gemini_api_key_here

# Node Environment
NODE_ENV=development
```

### Production Environment (Vercel)

You'll configure these in Vercel's dashboard (see [Vercel Deployment](#vercel-deployment) section).

**Required Environment Variables:**

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon public key | `eyJhbGciOiJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (secret) | `eyJhbGciOiJ...` |
| `GEMINI_API_KEY` | Google Gemini API key (Epic 2+) | `AIzaSyC...` |
| `NODE_ENV` | Node environment | `production` |

---

## Database Migrations

### Apply Migrations to Supabase

Chorus uses Supabase migrations to manage database schema. You need to apply these migrations to your production database.

#### Method 1: Using Supabase CLI (Recommended)

1. **Link your local project to Supabase:**
   ```bash
   supabase link --project-ref xxxxx
   ```
   (Replace `xxxxx` with your project ID from Supabase Dashboard URL)

2. **Apply all migrations:**
   ```bash
   supabase db push
   ```

3. **Verify migrations:**
   ```bash
   supabase db diff
   ```
   (Should show "No changes detected")

#### Method 2: Manual SQL Execution (Alternative)

If the CLI doesn't work, you can manually apply migrations:

1. Go to Supabase Dashboard → **SQL Editor**
2. Open `supabase/migrations/20251113000000_initial_schema.sql` from your repo
3. Copy the entire SQL content and paste into the SQL Editor
4. Click **Run**
5. Repeat for `supabase/migrations/20251113000001_add_missing_fields.sql`
6. Verify tables exist in **Database** → **Tables**

#### Verify Database Schema

After applying migrations, verify the following tables exist:

- [x] `profiles` (with `display_name` field)
- [x] `servers` (with `description`, `icon_url`, `invite_code`)
- [x] `server_members` (with `role` field)
- [x] `channels` (with `description`, `position`, `agents_md`)
- [x] `messages` (with `embedding` vector field)

Run this query in SQL Editor to check:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

---

## Vercel Deployment

### Step 1: Import Project to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New...** → **Project**
3. Import your Git repository (GitHub, GitLab, or Bitbucket)
4. **Framework Preset:** Next.js (auto-detected)
5. **Root Directory:** `./` (default)
6. Click **Deploy** (will fail without environment variables - that's expected)

### Step 2: Configure Environment Variables

1. Go to **Project Settings** → **Environment Variables**
2. Add all variables from the [Environment Variables](#environment-variables) section
3. Set environment to **Production, Preview, Development** for all variables
4. Click **Save**

### Step 3: Redeploy

1. Go to **Deployments** tab
2. Click the failed deployment
3. Click **...** → **Redeploy**
4. Wait for build to complete (~2-3 minutes)

### Step 4: Configure Custom Domain (Optional)

1. Go to **Project Settings** → **Domains**
2. Add your custom domain (e.g., `chorus.example.com`)
3. Follow DNS configuration instructions
4. Wait for SSL certificate provisioning (~5 minutes)
5. **Update Supabase Site URL** to your custom domain (see [Supabase Setup](#supabase-setup))

### Step 5: Configure Production Branch

1. Go to **Project Settings** → **Git**
2. **Production Branch:** `main` or `master` (default)
3. Enable **Automatic Deployments** for production branch
4. Click **Save**

---

## Post-Deployment Verification

### Checklist

After deployment, verify the following:

- [ ] **Home page loads:** Visit your production URL and verify landing page
- [ ] **Signup flow works:** Create a new account with email/password
- [ ] **Google OAuth works:** Sign in with Google
- [ ] **Profile creation:** Check Supabase Dashboard → Authentication → Users
- [ ] **Server creation:** Create a new server
- [ ] **Channel creation:** Create a channel within the server
- [ ] **Invite system:** Generate invite link and join from another account
- [ ] **Real-time messaging:** Send messages and verify instant delivery
- [ ] **Message history:** Scroll up to load older messages (pagination)
- [ ] **Session persistence:** Refresh page and verify still authenticated

### Testing Critical Flows

#### Flow 1: New User Onboarding
```
1. Navigate to /signup
2. Fill form: email, password, username
3. Submit → Verify redirect to /servers
4. Create server "Test Server"
5. Create channel "general"
6. Send message "Hello world"
7. Verify message appears instantly
```

#### Flow 2: Invite & Join
```
1. User A: Generate invite link from server settings
2. User B: Open invite link (logged out)
3. User B: Sign up → Verify auto-join after auth
4. User B: Navigate to server → Verify membership
5. User B: Send message → User A sees it in real-time
```

---

## Monitoring and Observability

### Vercel Analytics (Built-in)

1. Go to **Project** → **Analytics**
2. Verify **Web Vitals** tab shows data after traffic
3. Monitor:
   - Page load times (target: < 2s)
   - API endpoint latencies (target: < 500ms)
   - Error rates (target: < 1%)

### Supabase Logging

1. Go to Supabase Dashboard → **Logs**
2. **Database Logs:** Monitor slow queries (> 1s)
3. **Auth Logs:** Monitor failed login attempts
4. **Realtime Logs:** Monitor connection failures

### Error Tracking (Future: Sentry)

For production, integrate Sentry for error tracking:

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

### Custom Monitoring (Future)

Set up alerts for:
- High error rates (> 1% of requests)
- Slow database queries (> 1s)
- Failed Realtime connections (> 5%)
- High API latency (p95 > 1s)

---

## Rollback Procedures

### Rollback Vercel Deployment

If a deployment causes issues:

1. Go to **Deployments** tab
2. Find the last known good deployment
3. Click **...** → **Promote to Production**
4. Verify rollback successful

### Rollback Database Migration

If a migration causes issues:

1. Create a rollback migration file:
   ```sql
   -- Example: Rollback adding display_name
   ALTER TABLE public.profiles DROP COLUMN display_name;
   ```

2. Apply rollback via Supabase SQL Editor or CLI:
   ```bash
   supabase db push
   ```

3. Verify schema restored:
   ```bash
   supabase db diff
   ```

**Note:** Always test migrations in staging before production.

---

## Troubleshooting

### Issue: OAuth Redirect Not Working

**Symptoms:** After Google consent, user redirected to error page or infinite loop.

**Solutions:**
1. Verify **Authorized redirect URIs** in Google Cloud Console match Supabase callback URL exactly
2. Check Supabase **Redirect URLs** include your production domain
3. Clear browser cookies and try again
4. Check Vercel logs for error details: `vercel logs --production`

### Issue: Database Connection Errors

**Symptoms:** API routes return 500 errors with "Database connection failed"

**Solutions:**
1. Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set correctly in Vercel
2. Check Supabase project status: Dashboard → **Project Settings**
3. Verify RLS policies: Supabase Dashboard → **Database** → **Policies**
4. Check Supabase logs for policy failures

### Issue: Realtime Messages Not Delivering

**Symptoms:** Messages sent but not appearing for other users.

**Solutions:**
1. Verify Realtime enabled: Supabase Dashboard → **Database** → **Replication**
2. Check browser console for WebSocket connection errors
3. Verify broadcast channel naming: `broadcast:channel:{channelId}`
4. Test Realtime connection: Supabase Dashboard → **Realtime** → **Inspector**

### Issue: Build Failures on Vercel

**Symptoms:** Deployment fails during build step.

**Solutions:**
1. Check build logs in Vercel deployment details
2. Verify all dependencies in `package.json` are correct versions
3. Run `npm run build` locally to reproduce error
4. Check for TypeScript errors: `npm run type-check`
5. Verify Node.js version matches: `.nvmrc` or `package.json` engines

### Issue: Environment Variables Not Loading

**Symptoms:** API routes fail with "Missing environment variable" errors.

**Solutions:**
1. Verify all required variables set in Vercel → **Environment Variables**
2. Check variable names match exactly (case-sensitive)
3. Redeploy after adding variables (variables not applied to existing deployments)
4. Use `vercel env pull` to sync local environment with Vercel

### Getting Help

- **Supabase Support:** [supabase.com/docs](https://supabase.com/docs)
- **Vercel Support:** [vercel.com/docs](https://vercel.com/docs)
- **Project Issues:** File an issue in the GitHub repository
- **Emergency Contact:** [Your team's contact information]

---

## Deployment Checklist

Use this checklist for every production deployment:

### Pre-Deployment
- [ ] All tests passing locally
- [ ] Database migrations tested in staging
- [ ] Environment variables verified
- [ ] Google OAuth credentials updated (if changed)
- [ ] Code review completed
- [ ] Git branch merged to production branch

### Deployment
- [ ] Vercel deployment successful
- [ ] No build errors or warnings
- [ ] Environment variables loaded correctly
- [ ] Database migrations applied
- [ ] Custom domain SSL active

### Post-Deployment
- [ ] All critical flows tested (signup, messaging, invite)
- [ ] OAuth flow tested
- [ ] Realtime messaging verified
- [ ] Error tracking enabled
- [ ] Monitoring dashboards checked
- [ ] Team notified of deployment

### Rollback Ready
- [ ] Last known good deployment identified
- [ ] Rollback procedure documented
- [ ] On-call engineer available for 2 hours post-deployment

---

**Document Version:** 1.0
**Maintained By:** Development Team
**Last Review:** November 13, 2025
**Next Review:** December 13, 2025
