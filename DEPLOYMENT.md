# 📦 Cloud Services Deployment Guide

## 🎯 Overview

This guide covers deploying **JosePauloCamp using cloud platforms** with managed services (Vercel + Render + Cloud PostgreSQL).

**Best for:** Quick production deployment, automatic scaling, zero infrastructure management

> **Alternative:** For Docker deployment on a VPS, see [DEPLOYMENT_DOCKER.md](DEPLOYMENT_DOCKER.md)

---

## 📊 Deployment Options Comparison

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

This project uses a **decoupled microservices architecture** deploying three separate services:

- **Frontend (React SPA)**: Vercel
- **Backend (Express API)**: Render
- **Database**: PostgreSQL (Neon/Supabase/Railway)
- **Image Storage/CDN**: Cloudinary

Both frontend and backend auto-deploy from the `main` branch on GitHub.

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

## �️ Part 0: PostgreSQL Database Setup (Required First!)

**Before deploying backend, you need a PostgreSQL database.**

### Option A: Neon (Recommended - Free Tier)

1. Go to https://neon.tech
2. Sign up and create new project
3. Copy connection string (looks like: `postgresql://user:pass@host.region.neon.tech:5432/dbname?sslmode=require`)
4. ✅ Keep this for Step 4 (Backend Environment Variables)

### Option B: Supabase (Alternative)

1. Go to https://supabase.com
2. Create new project
3. Go to Settings → Database
4. Copy "Connection string" (Transaction mode)
5. ✅ Keep this for Step 4

### Option C: Railway (Alternative)

1. Go to https://railway.app
2. New Project → Add PostgreSQL
3. Copy `DATABASE_URL` from Variables tab
4. ✅ Keep this for Step 4

---

## �🚀 Part 1: Backend Deployment (Render)

### Step 1: Prepare Repository

✅ Already done — codebase ready for deployment.

### Step 2: Create Render Account

1. Go to https://render.com
2. Sign up / log in and connect GitHub

### Step 3: Create Web Service

1. In Render dashboard click "New +" → "Web Service"
2. Select repository `YelpCamp-React`
3. Configuration:
   - **Name**: `josepaulocamp-backend` (or similar)
   - **Region**: Nearest available (e.g. US West)
   - **Branch**: `main`
   - **Root Directory**: (leave blank)
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npx prisma generate && npx prisma migrate deploy`
   - **Start Command**: `node app.js`
   - **Plan**: Free (upgrade later if needed)

> **Important:** The build command includes:
>
> - `npm install` - Install dependencies
> - `npx prisma generate` - Generate Prisma Client
> - `npx prisma migrate deploy` - Run database migrations

### Step 4: Environment Variables

Add under "Environment":

```
NODE_ENV=production
DATABASE_URL=postgresql://<user>:<pass>@<host>.region.provider.com:5432/yelpcamp
SECRET=<your-32+char-random-session-secret>
CLOUDINARY_CLOUD_NAME=<cloudinary-cloud-name>
CLOUDINARY_KEY=<cloudinary-api-key>
CLOUDINARY_SECRET=<cloudinary-api-secret>
MAPBOX_TOKEN=<mapbox-token>
FRONTEND_URL=http://localhost:5173   # temporary until frontend deploy
```

**Important Notes:**

- `DATABASE_URL` - Use the PostgreSQL connection string from Part 0 (Neon/Supabase/Railway)
- `SECRET` - Generate with: `openssl rand -base64 32` or use a random 32+ character string
- Sessions are stored in PostgreSQL via `connect-pg-simple` (persistent across restarts)
- Session table auto-created on first startup

After frontend deploy, update `FRONTEND_URL` to the Vercel URL.

### Step 5: Deploy

1. Click "Create Web Service"
2. Wait for build (~2–3 min)
3. ✅ Note backend URL: `https://josepaulocamp-backend.onrender.com` (or similar)

---

## 🎨 Part 2: Frontend Deployment (Vercel)

### Step 1: Create Vercel Account

1. Go to https://vercel.com
2. Sign up / log in and connect GitHub

### Step 2: Import Project

1. Click "Add New…" → "Project"
2. Select repository `YelpCamp-React`
3. Settings:
   - **Framework Preset**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Step 3: Environment Variables (Frontend)

```
VITE_API_URL=https://josepaulocamp-backend.onrender.com/api
VITE_MAPBOX_TOKEN=<mapbox-token>
```

### Step 4: Deploy

1. Click "Deploy"
2. Wait (~1–2 min)
3. ✅ Note frontend URL: `https://josepaulocamp.vercel.app`

---

## 🔄 Part 3: Wire Frontend and Backend

Update backend CORS whitelist:

1. In Render service settings → Environment
2. Change `FRONTEND_URL`:

```
FRONTEND_URL=https://josepaulocamp.vercel.app
```

3. Save → triggers automatic redeploy.

---

## ✅ Part 4: Verification Checklist

Visit and test:

- Backend API: `GET /api/campgrounds` responds JSON
- Frontend loads without console errors
- Login & session cookie set (inspect Storage > Cookies)
- Create campground (images upload to Cloudinary)
- Map renders (Mapbox tiles load)
- Reviews can be created and deleted
- Pagination metadata present in list response

### CORS Test

Open DevTools Console on frontend — confirm no CORS or cookie warnings.

---

## 🐛 Common Troubleshooting

### Backend cannot connect to PostgreSQL

- Ensure PostgreSQL provider (Neon/Supabase/Railway) allows external connections (usually enabled by default)
- Verify `DATABASE_URL` uses correct credentials and host
- PostgreSQL cloud providers require SSL - connection string should include `?sslmode=require`
- Check Prisma migrations ran during build: `npx prisma migrate deploy`
- Verify session table was auto-created (check PostgreSQL provider dashboard)

### Prisma/Database issues

- Build command must include: `npx prisma generate && npx prisma migrate deploy`
- If migrations fail, check DATABASE_URL is accessible from Render
- Session table created automatically by `connect-pg-simple` on first startup
- Check Render logs for Prisma connection errors

### Frontend cannot reach backend

- Check `VITE_API_URL` points to backend `/api`
- Verify `FRONTEND_URL` on Render matches exact Vercel URL (no trailing slash)
- Confirm cookies use `SameSite=None; Secure` in production

### Slow first backend response

- Render free tier spins down after ~15 min idle; first request may take ~30s
- Subsequent requests are fast

### Session/Cookie issues (401 after login)

- Axios instance must use `withCredentials: true`
- Ensure `trust proxy` is set (`app.set('trust proxy', 1)`) in production
- Cookie must be `Secure` + `SameSite=None` for cross-domain
- Sessions stored in PostgreSQL (not memory) - check session table exists
- Session table auto-created on first login attempt
- Verify `DATABASE_URL` is accessible and migrations ran successfully

---

## 🐳 Alternative Deployment: Docker

**Want full control over infrastructure?** See [DEPLOYMENT_DOCKER.md](DEPLOYMENT_DOCKER.md) for deploying all services on a single VPS with Docker.

**Docker deployment includes:**

- Single-server setup (PostgreSQL, Backend, Frontend all in containers)
- Complete control over infrastructure
- Manual SSL setup and maintenance
- Best for learning DevOps and Docker

---

## 🔄 Automatic Deployment

✅ Configured:

- Push to `main` ⇒ Vercel & Render auto-redeploy
- Local dev uses uncommitted `.env` + `client/.env.local`
- Production uses platform environment variable UIs

---

## 📝 Environment Variable Summary

### Backend (Render)

```
NODE_ENV=production
DATABASE_URL=postgresql://<user>:<pass>@<host>.region.provider.com:5432/yelpcamp
SECRET=<session-secret>
CLOUDINARY_CLOUD_NAME=<cloud-name>
CLOUDINARY_KEY=<cloud-key>
CLOUDINARY_SECRET=<cloud-secret>
MAPBOX_TOKEN=<mapbox-token>
FRONTEND_URL=https://josepaulocamp.vercel.app
```

### Frontend (Vercel)

```
VITE_API_URL=https://josepaulocamp-backend.onrender.com/api
VITE_MAPBOX_TOKEN=<mapbox-token>
```

---

## 🎉 Done!

Production URLs:

- Frontend: https://josepaulocamp.vercel.app
- Backend: https://josepaulocamp-backend.onrender.com

Any push to `main` redeploys automatically. 🚀
