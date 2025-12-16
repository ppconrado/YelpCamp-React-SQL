# 📦 DEPLOYMENT.md - Deployment Guide

## 🎯 Overview

This project uses a decoupled architecture deploying frontend and backend separately:

- **Frontend (React SPA)**: Vercel
- **Backend (Express API)**: Render
- **Database**: PostgreSQL (Neon/Supabase/Railway)
- **Image Storage/CDN**: Cloudinary

Both services auto-deploy from the `main` branch on GitHub.

---

## 🚀 Part 1: Backend Deployment (Render)

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
   - **Build Command**: `npm install`
   - **Start Command**: `node app.js`
   - **Plan**: Free (upgrade later if needed)

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

- Ensure PostgreSQL provider (Neon/Supabase/Railway) allows external connections
- Verify `DATABASE_URL` uses correct credentials and host
- Check if SSL/TLS is required in connection string

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
