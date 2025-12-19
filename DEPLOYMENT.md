# 📦 Cloud Services Deployment Guide

## 🎯 Overview

This guide covers deploying **JosePauloCamp** on **100% FREE cloud platforms** with managed services for production use.

**Stack**: Vercel (Frontend) + Render (Backend) + Neon/Supabase (PostgreSQL) + Cloudinary (Images) + Mapbox (Maps)

**Best for:** Production-ready deployment, automatic scaling, zero infrastructure management, zero cost

> **Alternative:** For Docker deployment on a VPS, see [DEPLOYMENT_DOCKER.md](DEPLOYMENT_DOCKER.md)

---

## 💰 Free Tier Limits

All services used have generous free tiers suitable for small to medium traffic:

| Service                 | Free Tier Limits                                                  | Best For         |
| ----------------------- | ----------------------------------------------------------------- | ---------------- |
| **Neon PostgreSQL**     | 3 projects, 0.5 GB storage, 100 hours compute/month               | Database hosting |
| **Supabase PostgreSQL** | 2 projects, 500 MB storage, 1 GB transfer, unlimited API requests | Database + auth  |
| **Render**              | 750 hours/month, sleeps after 15 min idle, 0.1 CPU, 512 MB RAM    | Backend API      |
| **Vercel**              | 100 GB bandwidth, unlimited deployments, unlimited sites          | Frontend SPA     |
| **Cloudinary**          | 25 GB storage, 25 GB bandwidth/month                              | Image hosting    |
| **Mapbox**              | 50,000 map loads/month, 100,000 geocoding requests                | Maps & geocoding |

**Estimated monthly cost for hobby/portfolio project: $0** 🎉

---

## �️ Prerequisites - External Service Setup

Before deploying, you need to set up these free external services and collect API credentials.

### 1️⃣ Cloudinary (Image Hosting)

**Why:** Store and deliver campground images via CDN

1. Go to https://cloudinary.com/users/register_free
2. Sign up for free account (25 GB storage + 25 GB bandwidth/month)
3. After login, go to **Dashboard**
4. Copy these credentials:
   - **Cloud Name** (e.g., `ppconrado`)
   - **API Key** (e.g., `123456789012345`)
   - **API Secret** (e.g., `abcdefghijklmnopqrstuvwxyz`)
5. ✅ Save these for backend environment variables

**Free Tier:** 25 GB storage, 25 GB bandwidth/month, 10,000 transformations

### 2️⃣ Mapbox (Maps & Geocoding)

**Why:** Display interactive maps and geocode campground locations

1. Go to https://account.mapbox.com/auth/signup/
2. Sign up for free account
3. After login, go to **Account** → **Access Tokens**
4. Copy the **Default public token** (starts with `pk.`)
5. ✅ Save this for both frontend and backend environment variables

**Free Tier:** 50,000 map loads/month, 100,000 geocoding requests/month

**Note:** The same token works for both frontend (map display) and backend (geocoding)

---

## �📊 Deployment Options Comparison

| Aspect             | Cloud Services (This Guide) | Docker ([DEPLOYMENT_DOCKER.md](DEPLOYMENT_DOCKER.md)) |
| ------------------ | --------------------------- | ----------------------------------------------------- |
| **Cost**           | Free tier available         | $6-12/mo (VPS)                                        |
| **Setup Time**     | 15-30 minutes               | 1-2 hours                                             |
| **Maintenance**    | Automatic updates           | Manual updates                                        |
| **Scalability**    | Auto-scaling                | Limited to server                                     |
| **SSL/HTTPS**      | Automatic                   | Manual setup                                          |
| **Learning Curve** | Low (GUI-based)             | High (Docker, Linux)                                  |
| **Control**        | Limited                     | Full control                                          |
| **Best For**       | Production apps             | Learning, self-hosting                                |

---

## 🏗️ Architecture

This project uses a **decoupled microservices architecture** deploying four separate free services:

- **Frontend (React SPA)**: Vercel (Free)
- **Backend (Express API)**: Render (Free)
- **Database**: PostgreSQL on Neon/Supabase/Railway (Free)
- **Image CDN**: Cloudinary (Free)
- **Maps**: Mapbox API (Free)

**Deployment Flow:**

1. Set up external services (Cloudinary + Mapbox)
2. Deploy PostgreSQL database
3. Deploy backend API (connects to database)
4. Deploy frontend (connects to backend API)
5. Connect everything via environment variables

All services auto-deploy from the `main` branch on GitHub.

### 🏗️ Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Part 0: PostgreSQL Database (Standalone)               │
│  Provider: Neon / Supabase / Railway                    │
│  - Get DATABASE_URL connection string                   │
│  - Used by backend for data + sessions                  │
│  - Session table auto-created by connect-pg-simple      │
└─────────────────────────────────────────────────────────┘
                          ↓ (DATABASE_URL)
┌─────────────────────────────────────────────────────────┐
│  Part 1: Backend API (Render)                           │
│  Stack: Express.js + Prisma + connect-pg-simple         │
│  - Connects to PostgreSQL                               │
│  - Serves /api/* endpoints                              │
│  - Handles authentication & sessions                    │
│  - Returns BACKEND_URL                                  │
└─────────────────────────────────────────────────────────┘
                          ↓ (VITE_API_URL)
┌─────────────────────────────────────────────────────────┐
│  Part 2: Frontend SPA (Vercel)                          │
│  Stack: React + Vite                                    │
│  - Calls backend API via VITE_API_URL                   │
│  - Static files served via CDN                          │
│  - Client-side routing                                  │
└─────────────────────────────────────────────────────────┘

         ┌──────────────────────────────────┐
         │  Part 3: Wire Everything         │
         │  - Update FRONTEND_URL on backend│
         │  - Verify CORS + cookies working │
         │  - Test authentication flow      │
         └──────────────────────────────────┘
```

**Three independent services on free tiers:**

1. 🗄️ **PostgreSQL** → Cloud provider (database + persistent sessions)
2. ⚙️ **Backend API** → Render (server logic)
3. 🎨 **Frontend** → Vercel (static site with CDN)

Each service deploys independently and communicates via environment variables.

---

## 🗄️ Part 0: PostgreSQL Database Setup (Required First!)

**Before deploying backend, you need a PostgreSQL database.**

Choose one of these **100% FREE** PostgreSQL hosting options:

### Option A: Neon (Recommended ⭐ - Best Free Tier)

**Free Tier:** 3 projects, 0.5 GB storage, 100 hours compute/month

1. Go to https://neon.tech
2. Sign up with GitHub/Google
3. Click **Create Project**
   - **Project name**: `josepaulocamp`
   - **Database name**: `yelpcamp` (or keep default `neondb`)
   - **Region**: Choose closest to your backend (e.g., US East, Europe West)
   - **PostgreSQL version**: 16 (latest)
4. Click **Create Project**
5. Copy the **Connection String** from the dashboard
   - Format: `postgresql://user:pass@ep-xyz-123.region.aws.neon.tech:5432/dbname?sslmode=require`
6. ✅ Save this as `DATABASE_URL` for backend deployment

**Why Neon?**

- Serverless PostgreSQL with instant cold starts
- Auto-suspend when inactive (saves compute hours)
- Built-in connection pooling
- Web UI for database management

### Option B: Supabase (Alternative - More Features)

**Free Tier:** 2 projects, 500 MB storage, 1 GB bandwidth/month, unlimited API requests

1. Go to https://supabase.com
2. Sign up and create **New Project**
   - **Organization**: Create new or select existing
   - **Name**: `josepaulocamp`
   - **Database Password**: Generate strong password (save it!)
   - **Region**: Choose closest to backend
3. Wait ~2 minutes for provisioning
4. Go to **Settings** → **Database**
5. Scroll to **Connection String** section
6. Copy **URI** (Transaction mode) - looks like:
   ```
   postgresql://postgres.xyz:[YOUR-PASSWORD]@aws-0-region.pooler.supabase.com:5432/postgres
   ```
7. Replace `[YOUR-PASSWORD]` with your actual database password
8. ✅ Save this as `DATABASE_URL` for backend deployment

**Why Supabase?**

- PostgreSQL + built-in auth, storage, realtime features
- Web UI with SQL editor and table browser
- Free tier includes 500 MB storage
- Great for future expansion

### Option C: Railway (Alternative - Easiest Setup)

**Free Tier:** $5 credit/month, ~20 GB bandwidth

1. Go to https://railway.app
2. Sign up with GitHub
3. Click **New Project** → **Provision PostgreSQL**
4. Wait for deployment (~30 seconds)
5. Click on the PostgreSQL service
6. Go to **Variables** tab
7. Copy the `DATABASE_URL` value
   - Format: `postgresql://postgres:password@containers-region.railway.app:5432/railway`
8. ✅ Save this for backend deployment

**Why Railway?**

- One-click PostgreSQL deployment
- Simple dashboard
- Generous free tier ($5 credit = ~100 hours)

### ⚠️ Important Database Notes

- All providers use **PostgreSQL 12+** (compatible with Prisma 7)
- Connection strings include `?sslmode=require` - required for remote connections
- Database will be empty initially - Prisma migrations create tables automatically
- Session table is auto-created by `connect-pg-simple` on first backend startup
- Keep your `DATABASE_URL` secret - never commit to GitHub!

---

## 🚀 Part 1: Backend Deployment (Render)

**Free Tier:** 750 hours/month, 0.1 CPU, 512 MB RAM, sleeps after 15 min idle

### Step 1: Prepare Repository

✅ Already done — codebase ready for deployment.

**What's included:**

- Prisma schema with PostgreSQL configuration
- `lib/prisma.js` - Prisma Client singleton with pg adapter
- Migrations in `prisma/migrations/` folder
- Express app with session storage in PostgreSQL

### Step 2: Create Render Account

1. Go to https://render.com
2. Click **Get Started** (top right)
3. Sign up with **GitHub** (recommended for auto-deploy)
4. Authorize Render to access your GitHub repositories

### Step 3: Create Web Service

1. In Render dashboard, click **New +** → **Web Service**
2. Connect your repository:
   - If not visible, click **Configure account** to grant access
   - Search for your repository name (e.g., `YelpCamp-React`)
   - Click **Connect**
3. Configuration:
   - **Name**: `josepaulocamp-backend` (will be part of URL)
   - **Region**: Choose closest to database (e.g., Oregon USA, Frankfurt EU)
   - **Branch**: `main` (auto-deploys on push)
   - **Root Directory**: (leave blank - uses repo root)
   - **Runtime**: `Node`
   - **Build Command**:
     ```bash
     npm install && npx prisma generate && npx prisma migrate deploy
     ```
   - **Start Command**:
     ```bash
     node app.js
     ```
   - **Instance Type**: **Free** (select from dropdown)

> **Important:** The build command includes:
>
> - `npm install` - Install dependencies
> - `npx prisma generate` - Generate Prisma Client
> - `npx prisma migrate deploy` - Run database migrations

### Step 4: Environment Variables

Scroll down to **Environment Variables** section and add these:

| Variable Name           | Value                   | Description                                             |
| ----------------------- | ----------------------- | ------------------------------------------------------- |
| `NODE_ENV`              | `production`            | Enables production optimizations                        |
| `DATABASE_URL`          | From Part 0             | PostgreSQL connection string from Neon/Supabase/Railway |
| `SECRET`                | Generate random         | Session secret (32+ characters)                         |
| `CLOUDINARY_CLOUD_NAME` | From Cloudinary         | Your cloud name (e.g., `ppconrado`)                     |
| `CLOUDINARY_KEY`        | From Cloudinary         | API Key (numeric)                                       |
| `CLOUDINARY_SECRET`     | From Cloudinary         | API Secret (alphanumeric)                               |
| `MAPBOX_TOKEN`          | From Mapbox             | Your public token (starts with `pk.`)                   |
| `FRONTEND_URL`          | `http://localhost:5173` | Temporary - update after frontend deploy                |

**Example values:**

```bash
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@ep-abc-123.us-east-2.aws.neon.tech:5432/yelpcamp?sslmode=require
SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0
CLOUDINARY_CLOUD_NAME=ppconrado
CLOUDINARY_KEY=123456789012345
CLOUDINARY_SECRET=abcdefghijklmnopqrstuvwxyz1234
MAPBOX_TOKEN=pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJjbGV4YW1wbGUifQ.example_token
FRONTEND_URL=http://localhost:5173
```

**How to generate SECRET:**

```bash
# On macOS/Linux:
openssl rand -base64 32

# On Windows PowerShell:
[Convert]::ToBase64String((1..32|%{Get-Random -Maximum 256}))

# Or use any random 32+ character string
```

**Important Notes:**

- `DATABASE_URL` must include `?sslmode=require` for remote PostgreSQL
- Sessions stored in PostgreSQL (persistent across restarts)
- Session table automatically created by `connect-pg-simple` on first startup
- Prisma migrations run automatically during build
- Keep all values secret - never commit to Git
- After frontend deploys, update `FRONTEND_URL` to actual Vercel URL

### Step 5: Deploy Backend

1. Click **Create Web Service** (bottom of page)
2. Wait for deployment (~2-4 minutes)
   - Watch logs in real-time
   - Build runs: `npm install`, `prisma generate`, `prisma migrate deploy`
   - Migrations create database tables automatically
   - App starts: `node app.js`
3. **Deployment successful!** when you see:
   ```
   ==> Your service is live 🎉
   ```
4. ✅ **Copy your backend URL** from the top:
   - Format: `https://josepaulocamp-backend.onrender.com`
   - Or click the URL to test (should show HTML or "Cannot GET /")

**Test your backend:**

```bash
# Should return JSON array of campgrounds (empty or with seed data)
curl https://your-backend-url.onrender.com/api/campgrounds
```

**⚠️ Free Tier Note:**

- Backend sleeps after 15 minutes of inactivity
- First request after sleep takes 30-50 seconds
- Subsequent requests are instant
- This is normal for Render free tier

---

## 🎨 Part 2: Frontend Deployment (Vercel)

**Free Tier:** 100 GB bandwidth/month, unlimited deployments, unlimited sites, automatic SSL

### Step 1: Create Vercel Account

1. Go to https://vercel.com
2. Click **Sign Up**
3. Choose **Continue with GitHub** (recommended for auto-deploy)
4. Authorize Vercel to access your repositories

### Step 2: Import Project

1. From Vercel dashboard, click **Add New...** → **Project**
2. **Import Git Repository:**
   - Find your repository (e.g., `YelpCamp-React`)
   - Click **Import**
3. **Configure Project:**
   - **Framework Preset**: Vite (auto-detected)
   - **Root Directory**: `client` ⚠️ **IMPORTANT - must set this!**
   - **Build Command**: `npm run build` (auto-filled)
   - **Output Directory**: `dist` (auto-filled)
   - **Install Command**: `npm install` (auto-filled)

### Step 3: Environment Variables

Click **Environment Variables** and add:

| Variable Name       | Value                                   | Description                               |
| ------------------- | --------------------------------------- | ----------------------------------------- |
| `VITE_API_URL`      | `https://your-backend.onrender.com/api` | Backend API URL (from Part 1)             |
| `VITE_MAPBOX_TOKEN` | From Mapbox                             | Same token as backend (starts with `pk.`) |

**Example:**

```bash
VITE_API_URL=https://josepaulocamp-backend.onrender.com/api
VITE_MAPBOX_TOKEN=pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJjbGV4YW1wbGUifQ.example_token
```

**⚠️ Important:**

- `VITE_API_URL` must end with `/api` (no trailing slash)
- Use your actual backend URL from Part 1 Step 5
- Must include `https://` protocol
- All Vite env vars must start with `VITE_`

### Step 4: Deploy Frontend

1. Click **Deploy** (bottom of page)
2. Wait for build (~1-2 minutes)
   - Watch build logs
   - Vite builds optimized production bundle
   - Assets uploaded to Vercel CDN
3. **Deployment successful!** when you see:
   ```
   ✅ Production: https://your-app.vercel.app
   ```
4. ✅ **Copy your frontend URL:**
   - Format: `https://josepaulocamp.vercel.app`
   - Or custom domain if configured

**Test your frontend:**

- Click the URL to open your app
- Should load home page
- Check browser console (F12) for errors

---

## 🔄 Part 3: Connect Frontend and Backend

**Important:** Update backend to allow requests from frontend domain

### Step 1: Update Backend CORS

1. Go back to **Render dashboard**
2. Click your backend service (`josepaulocamp-backend`)
3. Go to **Environment** tab
4. Find `FRONTEND_URL` variable
5. **Update value** to your Vercel URL:
   ```
   FRONTEND_URL=https://josepaulocamp.vercel.app
   ```
   ⚠️ No trailing slash!
6. Click **Save Changes**
7. Render will **automatically redeploy** (~30 seconds)

**Why this is needed:**

- Backend CORS middleware checks request origin
- Must match exact frontend URL for cookies to work
- Session cookies require matching origin for cross-domain requests

### Step 2: Verify Connection

1. Open your frontend: `https://your-app.vercel.app`
2. Open browser DevTools (F12) → **Network** tab
3. Try to browse campgrounds or register
4. Check API calls:
   - Should see requests to `your-backend.onrender.com/api/*`
   - Status should be `200 OK` (not 401, 403, or CORS errors)
5. Check **Application** → **Cookies** → `https://your-backend.onrender.com`
   - Should see `yelpcamp.sid` cookie after login
   - Cookie must have `Secure`, `HttpOnly`, `SameSite=None` flags

---

## ✅ Part 4: Complete Verification Checklist

### Backend API Tests

1. **Health Check:**

   ```bash
   curl https://your-backend.onrender.com/api/campgrounds
   ```

   - Expected: JSON array (empty `[]` or with data)
   - If 404: Check backend is deployed and running

2. **Database Connection:**

   - Backend logs should show: "✅ Variáveis de ambiente validadas com sucesso"
   - Prisma migrations completed during build
   - Session table exists in PostgreSQL (check DB provider dashboard)

3. **CORS Configuration:**
   ```bash
   curl -H "Origin: https://your-frontend.vercel.app" \
        -H "Access-Control-Request-Method: GET" \
        -H "Access-Control-Request-Headers: Content-Type" \
        -X OPTIONS https://your-backend.onrender.com/api/campgrounds
   ```
   - Should return CORS headers with your frontend origin

### Frontend Tests

1. **Page Load:**

   - Visit `https://your-app.vercel.app`
   - Home page should load (no blank screen)
   - Check console (F12) - should be no errors

2. **API Connection:**

   - Click "Browse Campgrounds" or go to `/campgrounds`
   - Should load campgrounds (or empty state if no data)
   - Check Network tab - API calls should succeed (200 OK)

3. **Maps Display:**

   - Campground index should show cluster map
   - Individual campground should show location map
   - If blank: Check `VITE_MAPBOX_TOKEN` in Vercel

4. **Authentication Flow:**

   - Try to register new user
   - Should redirect after successful registration
   - Try to login
   - Should set cookie and show logged-in state
   - Check Application → Cookies → backend domain
   - Cookie `yelpcamp.sid` should exist with:
     - `Secure`: ✅
     - `HttpOnly`: ✅
     - `SameSite`: `None`

5. **Image Upload:**

   - Login and create new campground
   - Upload image(s)
   - Should upload to Cloudinary
   - Images should display in campground card/detail
   - Check Network tab: POST to `/api/campgrounds` should include image data

6. **CRUD Operations:**

   - Create campground (requires login)
   - View campground details
   - Edit own campground
   - Delete own campground
   - Add review to any campground
   - Delete own review

7. **Authorization:**
   - Try to edit someone else's campground → should redirect
   - Try to access create page without login → should redirect to login

### Common Issues

❌ **Login succeeds but immediately logs out:**

- Check `FRONTEND_URL` on backend matches exact Vercel URL
- Check cookie settings: must have `SameSite=None` and `Secure=true` in production
- Verify backend has `app.set('trust proxy', 1)` in production mode

❌ **CORS errors:**

- Backend `FRONTEND_URL` must match frontend domain exactly (no trailing slash)
- Check Render environment variables saved correctly
- Backend must have redeployed after changing `FRONTEND_URL`

❌ **"Cannot GET /" on backend:**

- Normal! Backend is API-only, no HTML pages
- Test with `/api/campgrounds` endpoint instead

❌ **Images not uploading:**

- Check all `CLOUDINARY_*` variables set in Render
- Check Cloudinary dashboard for API key validity
- Check backend logs for Cloudinary errors

❌ **Maps not loading:**

- Check `VITE_MAPBOX_TOKEN` in Vercel
- Token must start with `pk.` (public token)
- Check Mapbox dashboard for token validity and permissions

---

## 🐛 Comprehensive Troubleshooting Guide

### Backend Issues

#### 🔴 "Cannot find module '.prisma/client/default'"

**Cause:** Prisma Client not generated or wrong output path

**Solutions:**

1. Check build command includes: `npx prisma generate`
2. Verify `prisma/schema.prisma` has:
   ```prisma
   generator client {
     provider = "prisma-client-js"
     output   = "../generated/prisma"
   }
   ```
3. Check all imports use: `require('../generated/prisma')` or `require('./lib/prisma')`
4. Rebuild on Render: **Manual Deploy** → **Clear build cache & deploy**

#### 🔴 "Error: P1001: Can't reach database server"

**Cause:** Database connection failed

**Solutions:**

1. Verify `DATABASE_URL` in Render environment variables
2. Check connection string includes `?sslmode=require`
3. Test connection string locally:
   ```bash
   psql "postgresql://user:pass@host:5432/db?sslmode=require"
   ```
4. Verify database is running (check provider dashboard)
5. For Neon: ensure project isn't suspended
6. For Supabase: verify password is URL-encoded if contains special chars

#### 🔴 "Migration failed" during deployment

**Cause:** Database schema doesn't match migrations

**Solutions:**

1. Check Render logs for specific migration error
2. Manually run migrations:
   ```bash
   # Locally with production DATABASE_URL
   npx prisma migrate deploy
   ```
3. If schema drift detected:
   - Review what changed in database
   - Create new migration: `npx prisma migrate dev --name fix_drift`
   - Push to GitHub (auto-deploys)
4. **Nuclear option** (only for development!):
   - Drop all tables in database
   - Redeploy (migrations run fresh)

#### 🔴 "Session store disconnected" errors

**Cause:** PostgreSQL connection pool exhausted

**Solutions:**

1. Check database connection limits (Neon free tier: 1 connection)
2. Verify `lib/prisma.js` uses singleton pattern
3. Check app.js reuses same pg pool:
   ```javascript
   const { Pool } = require('pg');
   const pgPool = new Pool({
     connectionString: process.env.DATABASE_URL,
   });
   ```
4. For Neon: use connection pooling URL (includes `?pooler=true`)

### Frontend Issues

#### 🔴 "Network Error" when calling API

**Cause:** Wrong API URL or backend not running

**Solutions:**

1. Check `VITE_API_URL` in Vercel environment variables
2. Must include `/api` at the end: `https://backend.onrender.com/api`
3. Test backend directly: `curl https://backend.onrender.com/api/campgrounds`
4. If backend sleeping (Render free tier): wait 30-50 seconds for first request
5. Check Render logs for errors

#### 🔴 CORS Error: "No 'Access-Control-Allow-Origin' header"

**Cause:** Backend CORS not configured for frontend domain

**Solutions:**

1. Check `FRONTEND_URL` on Render matches Vercel URL exactly
2. No trailing slash: `https://app.vercel.app` not `https://app.vercel.app/`
3. Backend must have redeployed after changing env var
4. Check `app.js` CORS config includes `credentials: true`
5. Verify frontend axios uses `withCredentials: true`

#### 🔴 Login works but user not persisted (logs out on refresh)

**Cause:** Session cookie not being saved

**Solutions:**

1. Check cookie in DevTools → Application → Cookies
2. Cookie must have:
   - Domain: backend domain (not frontend)
   - Secure: true
   - HttpOnly: true
   - SameSite: None
3. Verify backend `sessionConfig.cookie` settings in `app.js`:
   ```javascript
   cookie: {
     httpOnly: true,
     secure: process.env.NODE_ENV === 'production',
     sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
     // ...
   }
   ```
4. Check backend has `app.set('trust proxy', 1)` in production
5. Verify `FRONTEND_URL` matches exact Vercel domain

#### 🔴 "Blank map" or Mapbox errors

**Cause:** Invalid or missing Mapbox token

**Solutions:**

1. Check `VITE_MAPBOX_TOKEN` in Vercel environment variables
2. Token must start with `pk.` (public token)
3. Verify token is valid on https://account.mapbox.com/access-tokens/
4. Check browser console for specific Mapbox error
5. Token must have these scopes: `styles:read`, `fonts:read`, `datasets:read`
6. After updating: **Redeploy** frontend (env vars only apply on build)

#### 🔴 Images not uploading / Cloudinary errors

**Cause:** Cloudinary credentials wrong or missing

**Solutions:**

1. Verify all three variables in Render:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_KEY`
   - `CLOUDINARY_SECRET`
2. Check credentials in Cloudinary dashboard
3. Test locally with same credentials
4. Check Render logs for specific Cloudinary error
5. Verify file size under 10MB (default Cloudinary limit)
6. Check upload preset (if using unsigned uploads)

### Deployment Issues

#### 🔴 Build fails on Render: "Error: Cannot find module"

**Solutions:**

1. Check package.json includes all dependencies
2. Verify `node_modules` not committed to Git
3. Clear build cache: Manual Deploy → **Clear build cache & deploy**
4. Check Node version compatibility (app uses Node 22)
5. Ensure `prisma` is in devDependencies, `@prisma/client` in dependencies

#### 🔴 Build succeeds but app crashes on start

**Solutions:**

1. Check Render logs for crash reason
2. Common causes:
   - Missing environment variable
   - Database connection failed
   - Port binding issue (should use `process.env.PORT` or 3000)
3. Test locally with production env vars
4. Verify `start` command: `node app.js` (not `npm start`)

#### 🔴 Render service keeps restarting

**Solutions:**

1. Check logs for error pattern
2. Usually: database connection or missing env var
3. Verify all required env vars set: `DATABASE_URL`, `SECRET`
4. Check database is accessible from Render region
5. Test connection string with `psql` command

### Performance Issues

#### 🔴 Slow backend response (30-50 seconds)

**Cause:** Render free tier cold start (normal behavior)

**Solutions:**

1. This is expected on free tier
2. Backend sleeps after 15 minutes idle
3. First request wakes it up (30-50s)
4. Subsequent requests are fast
5. Upgrade to paid tier ($7/month) for always-on service
6. Or keep backend warm with uptime monitoring (every 14 min)

#### 🔴 Frontend slow to load

**Solutions:**

1. Vercel CDN should be fast - check Vercel analytics
2. Check browser Network tab for slow assets
3. Optimize images (already using Cloudinary CDN)
4. Check Vite build creates optimized bundle
5. Verify no unnecessary re-renders (React DevTools Profiler)

---

## 🛠️ Additional Resources

### Service Documentation

- **Render:** https://render.com/docs
- **Vercel:** https://vercel.com/docs
- **Neon:** https://neon.tech/docs
- **Supabase:** https://supabase.com/docs
- **Prisma:** https://www.prisma.io/docs
- **Cloudinary:** https://cloudinary.com/documentation
- **Mapbox:** https://docs.mapbox.com/

### Monitoring & Debugging

**Backend Logs:**

- Render Dashboard → Service → Logs tab
- Real-time streaming
- Filter by log level

**Frontend Errors:**

- Vercel Dashboard → Project → Logs
- Check browser console (F12)
- Network tab for API errors

**Database:**

- Neon: Web UI with SQL console
- Supabase: Table Editor + SQL Editor
- Use `psql` CLI for direct access

### Cost Optimization

**Free Tier Limits:**

- Render: 750 hours/month (enough for 1 service 24/7)
- Vercel: 100 GB bandwidth (thousands of visits)
- Neon: 100 compute hours (enough for small projects)
- Cloudinary: 25 GB (hundreds of images)
- Mapbox: 50,000 loads (thousands of visits)

**Staying Free:**

- Render sleeps after 15 min → reduces compute hours
- Use Cloudinary transformations wisely
- Monitor Vercel bandwidth in dashboard
- Neon auto-suspends when inactive
- Set up alerts for approaching limits

---

## 🐳 Alternative Deployment: Docker

**Want full control over infrastructure?** See [DEPLOYMENT_DOCKER.md](DEPLOYMENT_DOCKER.md) for deploying all services on a single VPS with Docker.

**Docker deployment includes:**

- Single-server setup (PostgreSQL, Backend, Frontend all in containers)
- Complete control over infrastructure
- Manual SSL setup and maintenance
- Best for learning DevOps and Docker
- Cost: $6-12/month for VPS

---

## 🔄 Automatic Deployment (CI/CD)

✅ **Already configured!** Your project automatically deploys on every push to `main` branch.

### How it works:

**Backend (Render):**

1. Push code to `main` branch on GitHub
2. Render detects changes via GitHub webhook
3. Automatically runs build: `npm install && npx prisma generate && npx prisma migrate deploy`
4. Restarts service with new code
5. Zero downtime deployment

**Frontend (Vercel):**

1. Push code to `main` branch (especially `client/` folder)
2. Vercel detects changes via GitHub webhook
3. Automatically builds: `npm run build` in `client/` directory
4. Deploys to CDN globally
5. Instant rollback available

### Branch Strategy:

- `main` → Production (auto-deploy to Render + Vercel)
- `dev` → Can configure preview deployments (optional)
- Feature branches → Create for development, merge to `main` when ready

### Manual Deployment:

**Render:**

- Dashboard → Service → **Manual Deploy** → **Deploy latest commit**
- Or **Clear build cache & deploy** if issues

**Vercel:**

- Dashboard → Project → Deployments → **Redeploy** any commit
- Instant rollback to previous deployment

### Environment Variables:

**Local Development:**

- Backend: Root `.env` file (never commit!)
- Frontend: `client/.env.local` file (never commit!)

**Production:**

- Backend: Render dashboard → Environment tab
- Frontend: Vercel dashboard → Settings → Environment Variables
- Changes require redeploy to take effect

---

## 📝 Complete Environment Variable Reference

### Backend Environment Variables (Render)

| Variable                | Required | Example                                               | Description                                |
| ----------------------- | -------- | ----------------------------------------------------- | ------------------------------------------ |
| `NODE_ENV`              | ✅ Yes   | `production`                                          | Enables production mode, security features |
| `DATABASE_URL`          | ✅ Yes   | `postgresql://user:pass@host:5432/db?sslmode=require` | PostgreSQL connection string               |
| `SECRET`                | ✅ Yes   | `a1b2c3d4e5f6...` (32+ chars)                         | Session encryption secret                  |
| `CLOUDINARY_CLOUD_NAME` | ✅ Yes   | `ppconrado`                                           | Your Cloudinary cloud name                 |
| `CLOUDINARY_KEY`        | ✅ Yes   | `123456789012345`                                     | Cloudinary API key                         |
| `CLOUDINARY_SECRET`     | ✅ Yes   | `abcdefghijk...`                                      | Cloudinary API secret                      |
| `MAPBOX_TOKEN`          | ✅ Yes   | `pk.eyJ1Ijoi...`                                      | Mapbox public token (for geocoding)        |
| `FRONTEND_URL`          | ✅ Yes   | `https://app.vercel.app`                              | Exact frontend URL (CORS)                  |
| `PORT`                  | ❌ No    | `3000`                                                | Auto-set by Render                         |

### Frontend Environment Variables (Vercel)

| Variable            | Required | Example                            | Description                            |
| ------------------- | -------- | ---------------------------------- | -------------------------------------- |
| `VITE_API_URL`      | ✅ Yes   | `https://backend.onrender.com/api` | Backend API URL (must end with `/api`) |
| `VITE_MAPBOX_TOKEN` | ✅ Yes   | `pk.eyJ1Ijoi...`                   | Mapbox public token (for map display)  |

### Local Development (.env files)

**Root `.env` (Backend):**

```bash
NODE_ENV=development
DATABASE_URL=postgresql://user:pass@localhost:5432/yelpcamp
SECRET=dev-secret-at-least-32-chars
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_KEY=your-key
CLOUDINARY_SECRET=your-secret
MAPBOX_TOKEN=pk.your-token
FRONTEND_URL=http://localhost:5173
```

**client/.env.local** (Frontend):\*\*

```bash
VITE_API_URL=http://localhost:3000/api
VITE_MAPBOX_TOKEN=pk.your-token
```

---

## 🎉 Deployment Complete!

### Your Production URLs:

- 🎨 **Frontend**: https://josepaulocamp.vercel.app (or your custom domain)
- ⚙️ **Backend**: https://josepaulocamp-backend.onrender.com
- 🗄️ **Database**: Managed by Neon/Supabase/Railway
- 🖼️ **Images**: Cloudinary CDN
- 🗺️ **Maps**: Mapbox API

### What's Deployed:

- ✅ React SPA with Vite build optimization
- ✅ Express API with Prisma ORM
- ✅ PostgreSQL database with migrations
- ✅ Session storage in PostgreSQL
- ✅ Image uploads to Cloudinary
- ✅ Mapbox maps and geocoding
- ✅ Automatic HTTPS/SSL
- ✅ Cross-domain authentication
- ✅ Auto-deploy on Git push

### Next Steps:

1. **Seed Data** (Optional):

   ```bash
   # Connect to your production database and run:
   node seeds/index.js
   ```

   Or manually create campgrounds via the UI

2. **Custom Domain** (Optional):

   - Vercel: Settings → Domains → Add your domain
   - Render: Settings → Custom Domain → Add your domain

3. **Monitor Usage:**

   - Check free tier limits in each service dashboard
   - Set up alerts before hitting limits

4. **Security:**
   - Never commit `.env` files
   - Rotate secrets periodically
   - Keep dependencies updated: `npm audit`

### Support:

- 📖 **Project Docs**: See [README.md](README.md) and [ARCHITECTURE.md](ARCHITECTURE.md)
- 🐛 **Found a bug?**: Check logs in Render/Vercel dashboards
- 💬 **Need help?**: Review troubleshooting section above

---

**Congratulations! Your full-stack app is live! 🚀**
