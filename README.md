# JosePauloCamp 🏕️

> A modern, full-stack campground review platform built with React, Express, and PostgreSQL.

[![Live Demo](https://img.shields.io/badge/demo-live-success)](https://josepaulocamp.vercel.app)
[![GitHub](https://img.shields.io/badge/github-source-blue)](https://github.com/ppconrado/YelpCamp-React)

[View Live Application](https://josepaulocamp.vercel.app) | [Technical Documentation](./ARCHITECTURE.md) | [Cloud Deployment](./DEPLOYMENT.md) | [Docker Deployment](./DEPLOYMENT_DOCKER.md)

---

## 📖 Overview

JosePauloCamp is a full-featured campground review application where users can discover, share, and review campgrounds. Built as a modern Single Page Application (SPA) with React on the frontend and Express on the backend, it showcases best practices in full-stack development, security, and cloud deployment.

### ✨ Key Features

#### 🏕️ Campground Management

- **Browse & Search**: Paginated campground listing with 12 items per page
- **Interactive Maps**: Mapbox integration with cluster visualization and detailed location views
- **Rich Details**: Multi-image carousels, pricing, descriptions, and author information
- **CRUD Operations**: Create, read, update, and delete campgrounds (with authorization)

#### 👤 User System

- **Secure Authentication**: Session-based auth with encrypted cookies
- **User Profiles**: Track campgrounds and reviews by author
- **Authorization**: Owner-only edit/delete permissions
- **Password Security**: Strong password requirements (8+ chars, uppercase, lowercase, number)

#### ⭐ Review System

- **Star Ratings**: 1-5 star rating system with visual display
- **Rich Reviews**: Text reviews with author attribution
- **Moderation**: Owner-only review deletion

#### 🎨 Modern UX/UI

- **Responsive Design**: Mobile-first, works on all devices
- **Loading States**: Skeleton screens and smooth transitions
- **Form Validation**: Real-time validation with React Hook Form + Zod
- **Toast Notifications**: Non-intrusive success/error messages
- **Confirmation Modals**: Safe delete operations
- **Unsaved Changes Warning**: Prevents accidental data loss
- **Breadcrumb Navigation**: Preserve pagination context

#### 🔒 Security

- **Session Management**: HttpOnly cookies with cross-domain support
- **Rate Limiting**: API abuse protection (100 req/15min, auth: 5 req/15min)
- **Input Validation**: Both frontend (Zod) and backend (Joi) validation
- **SQL Injection Protection**: Query sanitization via Prisma
- **HTTPS Enforcement**: Secure cookies in production
- **CSP Headers**: Content Security Policy with Helmet
- **Password Hashing**: bcrypt encryption

#### 📸 Media Management

- **Multi-Image Upload**: Up to 10 images per campground
- **Cloudinary Integration**: Cloud storage with CDN delivery
- **Image Optimization**: Automatic resizing and compression
- **Carousel Display**: Thumbnail navigation with smooth transitions

---

## 🛠️ Technology Stack

### Frontend

- **React 19** - UI framework
- **Vite 7** - Build tool and dev server
- **React Router v6** - Client-side routing
- **Axios** - HTTP client
- **React Hook Form** - Form management
- **Zod** - Schema validation
- **React Hot Toast** - Notifications
- **Bootstrap 5** - UI components
- **Mapbox GL JS** - Interactive maps

### Backend

- **Node.js 18+** - Runtime
- **Express.js 4** - Web framework
- **bcrypt** - Password hashing
- **Prisma 7** - PostgreSQL ORM (Type-safe database client)
- **PostgreSQL** - Relational database
- **Multer** - File uploads
- **Joi** - Schema validation
- **express-session** - Session management
- **connect-pg-simple** - PostgreSQL session store
- **@prisma/adapter-pg** - Prisma database adapter
- **Helmet** - Security headers
- **CORS** - Cross-origin configuration

#### 🔐 Session Management Architecture

**Both `express-session` and `connect-pg-simple` work together:**

- **`express-session`** (Core middleware):

  - Handles session lifecycle (create, read, update, destroy)
  - Manages session cookies
  - Provides `req.session` object
  - Handles cookie signing and encryption

- **`connect-pg-simple`** (Storage adapter):
  - Tells `express-session` WHERE to save session data (PostgreSQL)
  - Creates and manages the `session` table automatically
  - Handles read/write operations to database
  - Replaces the default memory store

**How they work together:**

```javascript
const session = require('express-session'); // Core session middleware
const pgSession = require('connect-pg-simple')(session); // Pass session to pgSession

const store = new pgSession({
  // Create PostgreSQL store
  pool: pgPool,
  tableName: 'session',
  createTableIfMissing: true, // Auto-creates session table
});

app.use(
  session({
    // Use express-session with store
    store: store, // Connect the PostgreSQL store
    secret: process.env.SECRET,
    // ... other options
  })
);
```

**Analogy**: Think of `express-session` as the engine and `connect-pg-simple` as the fuel tank. You need both - the engine does the work, the tank stores the fuel (session data).

- ❌ Without `express-session`: No session functionality at all
- ❌ Without `connect-pg-simple`: Sessions work but stored in memory (lost on restart)
- ✅ Together: Persistent sessions that survive container restarts

### Services & Infrastructure

- **PostgreSQL** - Database (Neon/Supabase/Railway/Local)
- **Cloudinary** - Image hosting/CDN
- **Mapbox** - Maps and geocoding
- **Vercel** - Frontend hosting
- **Render** - Backend hosting
- **GitHub** - Version control & CI/CD

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+ (local or cloud: Neon, Supabase, Railway)
- Cloudinary account
- Mapbox API token

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/ppconrado/YelpCamp-React.git
cd YelpCamp-React
```

2. **Install dependencies**

```bash
# Backend dependencies
npm install

# Frontend dependencies
cd client
npm install
cd ..
```

3. **Configure environment variables**

Create `.env` in the root directory:

```env
# Database (PostgreSQL)
DATABASE_URL=postgresql://username:password@localhost:5432/yelpcamp
# or Cloud PostgreSQL:
# DATABASE_URL=postgresql://username:password@host.region.provider.com:5432/yelpcamp

# Security
SECRET=your-session-secret-here

# External Services
MAPBOX_TOKEN=pk.your_mapbox_token_here
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_KEY=your-cloudinary-key
CLOUDINARY_SECRET=your-cloudinary-secret

# Production (Render deployment)
FRONTEND_URL=https://your-frontend-url.vercel.app
NODE_ENV=production
PORT=3000
```

Create `client/.env.local`:

```env
VITE_API_URL=http://localhost:3000/api
VITE_MAPBOX_TOKEN=pk.your_mapbox_token_here
```

4. **Setup database**

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# (Optional) Seed with sample data
npm run seed
```

5. **Start development servers**

```bash
# Run both frontend and backend concurrently
npm run dev:full
```

- Backend API: http://localhost:3000
- Frontend SPA: http://localhost:5173

---

## � Docker Quick Start

If you prefer using Docker for containerized development:

### Prerequisites

- Docker Desktop installed and running
- Docker Compose v2.0+

### Launch Application

```bash
# Start all containers (PostgreSQL, Backend, Frontend)
docker compose up

# Start in detached mode (background)
docker compose up -d

# Rebuild and start (after code changes)
docker compose up --build
```

### Stop Application

```bash
# Stop all containers (keeps data)
docker compose down

# Stop and remove volumes (⚠️ deletes database data)
docker compose down -v

# Stop containers without removing them
docker compose stop
```

### Manage Containers

```bash
# View running containers
docker compose ps

# View logs
docker compose logs -f

# View logs for specific service
docker compose logs -f backend
docker compose logs -f frontend --tail=50

# Restart specific service
docker compose restart backend

# Access backend shell
docker compose exec backend sh

# Access database
docker compose exec postgres psql -U yelpcamp -d yelpcamp

# Open Prisma Studio (Database GUI)
docker compose exec backend npx prisma studio
```

### Access URLs (Docker)

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api
- **Health Check**: http://localhost:3000/api/health
- **Prisma Studio**: http://localhost:5555

### Docker Development Workflow

1. **Start containers**: `docker compose up -d`
2. **Make code changes**:
   - Frontend: Hot-reload automatic ✅
   - Backend: Restart with `docker compose restart backend`
3. **View logs**: `docker compose logs -f backend`
4. **Stop**: `docker compose down`

See [DOCKER.md](./DOCKER.md) for comprehensive Docker documentation.

---

## �📁 Project Structure

```
├── app.js                      # Express application entry
├── middleware.js               # Custom middleware (auth, validation)
├── schemas.js                  # Joi validation schemas
├── package.json                # Backend dependencies
│
├── prisma/                     # Prisma ORM
│   ├── schema.prisma           # Database schema (models & relationships)
│   └── migrations/             # Database migrations

📊 **Database Relationships:**
- User → Campground (1:N) - authorId FK
- User → Review (1:N) - authorId FK
- Campground → Image (1:N) - campgroundId FK
- Campground → Review (1:N) - campgroundId FK
- User ↔ Campground (M:N) - via Review junction table

├── lib/                        # Shared libraries
│   └── prisma.js               # Prisma Client singleton
│
├── generated/                  # Generated Prisma Client
│   └── prisma/                 # Auto-generated from schema
│
├── routes/                     # Express routes
│   ├── campgrounds.js          # Campground CRUD
│   ├── reviews.js              # Review CRUD
│   └── users.js                # Auth routes
│
├── controllers/                # Route handlers
│   ├── campgrounds.prisma.js   # Campground business logic
│   ├── reviews.prisma.js       # Review business logic
│   └── users.prisma.js         # Auth business logic
│
├── utils/                      # Helper functions
│   ├── catchAsync.js           # Async error wrapper
│   ├── ExpressError.js         # Custom error class
│   ├── validateEnv.js          # Environment validation
│   └── campgroundHelpers.js    # Campground utilities
│
├── cloudinary/                 # Cloudinary configuration
│   └── index.js
│
├── seeds/                      # Database seeding
│   ├── index.js                # Seed script
│   ├── cities.js               # US cities data
│   └── seedHelpers.js          # Random data generators
│
└── client/                     # React frontend
    ├── package.json            # Frontend dependencies
    ├── vite.config.js          # Vite configuration
    ├── index.html              # HTML template
    ├── vercel.json             # Vercel deployment config
    │
    ├── src/
    │   ├── main.jsx            # React entry point
    │   ├── App.jsx             # Root component
    │   ├── index.css           # Global styles
    │   │
    │   ├── api/                # API client modules
    │   │   ├── http.js         # Axios instance
    │   │   ├── auth.js         # Auth API calls
    │   │   ├── campgrounds.js  # Campground API calls
    │   │   └── reviews.js      # Review API calls
    │   │
    │   ├── components/         # React components
    │   │   ├── Layout.jsx              # App layout wrapper
    │   │   ├── MapboxMap.jsx           # Map component
    │   │   ├── CampgroundForm.jsx      # Create/edit form
    │   │   ├── ReviewForm.jsx          # Review form
    │   │   ├── ImageCarousel.jsx       # Image gallery
    │   │   ├── ProtectedRoute.jsx      # Auth guard
    │   │   └── ui/                     # Reusable UI components
    │   │       ├── FormInput.jsx
    │   │       ├── SubmitButton.jsx
    │   │       ├── ConfirmModal.jsx
    │   │       ├── CardSkeleton.jsx
    │   │       ├── DetailSkeleton.jsx
    │   │       └── CenteredCard.jsx
    │   │
    │   ├── context/            # React Context providers
    │   │   ├── AuthContext.jsx         # Authentication state
    │   │   └── FlashContext.jsx        # Toast notifications
    │   │
    │   ├── hooks/              # Custom React hooks
    │   │   └── useUnsavedChanges.js    # Form dirty state warning
    │   │
    │   └── pages/              # Page components
    │       ├── Home.jsx                # Landing page
    │       ├── campgrounds/
    │       │   ├── CampgroundIndex.jsx # List view with pagination
    │       │   ├── CampgroundShow.jsx  # Detail view
    │       │   ├── CampgroundNew.jsx   # Create form
    │       │   └── CampgroundEdit.jsx  # Edit form
    │       └── users/
    │           ├── Login.jsx           # Login form
    │           └── Register.jsx        # Registration form
    │
    └── dist/                   # Production build (generated)
```

---

## 🔧 Development

### Available Scripts

**Root (Backend + Full Stack)**

```bash
npm start              # Start production server
npm run dev            # Start backend with nodemon
npm run dev:full       # Start both frontend and backend (concurrently)
npx prisma generate    # Generate Prisma Client
npx prisma migrate dev # Run database migrations
npx prisma studio      # Open Prisma Studio (database GUI)
npm run seed           # Populate database with sample data
npm run build:client   # Build frontend for production
```

**Client (Frontend only - run from `client/` directory)**

```bash
npm run dev            # Start Vite dev server
npm run build          # Build for production
npm run preview        # Preview production build locally
```

### Development Workflow

1. **Run the full stack**:

   ```bash
   npm run dev:full
   ```

   This starts:

   - Backend on `http://localhost:3000` (with auto-restart)
   - Frontend on `http://localhost:5173` (with HMR)

2. **Make changes**:

   - Frontend changes: Auto-reload with Vite HMR
   - Backend changes: Auto-restart with nodemon

3. **Test authentication**:

   - CORS is configured for localhost
   - Cookies use `sameSite: 'lax'` in development

4. **View API directly**:
   - Health check: `http://localhost:3000/health`
   - API endpoints: `http://localhost:3000/api/*`

---

## 🌐 Deployment

The application is configured for deployment on free-tier cloud services:

- **Frontend**: Vercel (automatic deployment from GitHub)
- **Backend**: Render (automatic deployment from GitHub)
- **Database**: PostgreSQL (Neon/Supabase/Railway - free tiers available)
- **Images**: Cloudinary (free tier, 25GB storage)

### Deployment Options

Choose the deployment strategy that fits your needs:

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Cloud services deployment (Vercel + Render + Cloud PostgreSQL)

  - ✅ Easiest setup (15-30 minutes)
  - ✅ Free tier available
  - ✅ Auto-deploy from GitHub
  - ✅ Best for production apps

- **[DEPLOYMENT_DOCKER.md](./DEPLOYMENT_DOCKER.md)** - Docker deployment on VPS
  - ✅ Full infrastructure control
  - ✅ Single server ($6-12/mo)
  - ✅ Best for learning DevOps
  - ✅ Self-hosting option

### Production URLs

- Frontend: https://josepaulocamp.vercel.app
- Backend: https://josepaulocamp-backend.onrender.com

---

## 📚 Documentation

### Technical Guides

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Comprehensive technical documentation with diagrams and database relationships
- **[DB_CONVERSION_PLAN.md](./DB_CONVERSION_PLAN.md)** - Detailed entity-relationship documentation and schema design

### Deployment

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Cloud services deployment (Vercel + Render + Cloud PostgreSQL) - **Recommended for production**
- **[DEPLOYMENT_DOCKER.md](./DEPLOYMENT_DOCKER.md)** - Docker deployment on single VPS - **Best for learning & self-hosting**

### Migration & Development

- **[PRISMA_REFACTOR_PROGRESS.md](./PRISMA_REFACTOR_PROGRESS.md)** - MongoDB to PostgreSQL migration journey
- **[MONGODB_TO_POSTGRESQL_GUIDE.md](./MONGODB_TO_POSTGRESQL_GUIDE.md)** - Complete conversion learning guide
- **[BACKEND_IMPROVEMENTS.md](./BACKEND_IMPROVEMENTS.md)** - Backend optimization details

---

## 🔐 Security Features

- ✅ **Session-based authentication** (more secure than JWT for web apps)
- ✅ **PostgreSQL session persistence** (survives container restarts)
- ✅ **HttpOnly cookies** (prevents XSS attacks)
- ✅ **HTTPS-only cookies** in production
- ✅ **Cross-domain cookie support** (SameSite=None)
- ✅ **CSRF protection** via SameSite cookies
- ✅ **Rate limiting** on all API endpoints
- ✅ **Input sanitization** (SQL injection prevention via Prisma)
- ✅ **Password hashing** with bcrypt
- ✅ **Strong password policy** enforcement
- ✅ **Security headers** with Helmet (CSP, XSS protection, etc.)
- ✅ **CORS** with whitelist configuration
- ✅ **Trust proxy** configuration for cloud deployment

---

## 🎨 UI/UX Features

### Modern SPA Experience

- ✅ Single Page Application (no full page reloads)
- ✅ Client-side routing with React Router
- ✅ Smooth page transitions
- ✅ Loading skeletons (better perceived performance)
- ✅ Optimistic UI updates

### Form Experience

- ✅ Real-time validation with error messages
- ✅ Floating labels that animate on focus
- ✅ Password visibility toggle
- ✅ Unsaved changes warning (prevents accidental data loss)
- ✅ Disabled submit during processing

### Mobile Optimization

- ✅ Responsive design (mobile-first approach)
- ✅ Touch-friendly buttons and inputs
- ✅ Fixed mobile pagination controls
- ✅ Optimized map interactions on touch devices
- ✅ Safe area insets for notched devices
- ✅ Momentum scrolling on iOS

### Visual Polish

- ✅ Toast notifications (non-intrusive feedback)
- ✅ Confirmation modals for destructive actions
- ✅ Image carousels with thumbnails
- ✅ Star rating visualization
- ✅ Breadcrumb navigation
- ✅ Card hover effects
- ✅ Skeleton loading states

---

## 🐛 Troubleshooting

### Common Issues

**1. Cannot connect to PostgreSQL**

```bash
# Error: Can't reach database server
```

- Ensure PostgreSQL is running locally: `sudo service postgresql start` (Linux) or `brew services start postgresql` (Mac)
- Verify `DATABASE_URL` in `.env` is correct
- Check connection string format: `postgresql://user:password@host:5432/database`

**2. Images not uploading**

```bash
# Error: Cloudinary configuration error
```

- Verify `CLOUDINARY_*` variables in `.env`
- Check Cloudinary console for correct credentials

**3. Map not displaying**

```bash
# Blank map or "Error loading Mapbox"
```

- Check `VITE_MAPBOX_TOKEN` in `client/.env.local`
- Verify token is valid on Mapbox dashboard

**4. CORS errors in development**

```bash
# Access-Control-Allow-Origin error
```

- Ensure frontend is running on `http://localhost:5173`
- Check backend CORS config includes localhost:5173

**5. Session not persisting**

```bash
# 401 Unauthorized after login
```

- Sessions are stored in PostgreSQL via `connect-pg-simple` (survives restarts)
- In production: Verify `FRONTEND_URL` has no trailing slash
- Check cookie settings: `secure: true` requires HTTPS
- Verify `trust proxy` is set in production
- Session table auto-created on first use

**6. Render backend slow on first request**

- **Expected behavior**: Free tier spins down after 15min inactivity
- First request wakes up the server (~30s delay)
- Subsequent requests are fast

---

## 🚧 Future Enhancements

### Planned Features

- [ ] Advanced search and filtering (price range, rating, amenities)
- [ ] User profiles with avatar upload
- [ ] Favorite/bookmark campgrounds
- [ ] Email notifications
- [ ] Social authentication (Google, GitHub OAuth)
- [ ] Campground availability calendar
- [ ] Reservation system
- [ ] Photo upload from mobile camera
- [ ] Offline support (PWA)
- [ ] Dark mode toggle

### Technical Improvements

- [ ] Migrate to TypeScript
- [ ] Add unit tests (Jest, React Testing Library)
- [ ] Add E2E tests (Playwright)
- [ ] Implement Redis caching
- [ ] Add GraphQL API
- [ ] Cursor-based pagination
- [ ] Elasticsearch for advanced search
- [ ] WebSocket for real-time features
- [ ] GitHub Actions CI/CD pipeline
- [x] Docker containerization (see [DOCKER.md](DOCKER.md))
- [ ] Kubernetes orchestration

---

## 📄 License

MIT License - feel free to use this project for learning or your own applications!

---

## 👨‍💻 Author

**Jose Paulo Conrado**

- GitHub: [@ppconrado](https://github.com/ppconrado)

---

## 🙏 Acknowledgments

- Original YelpCamp project concept by Colt Steele
- Modernized and enhanced with React, improved security, and cloud deployment
- AI assistance by GitHub Copilot for development and documentation

---

## 📞 Support

If you have questions or run into issues:

1. Check the [ARCHITECTURE.md](./ARCHITECTURE.md) for technical details
2. Review deployment guides: [Cloud Services](./DEPLOYMENT.md) or [Docker](./DEPLOYMENT_DOCKER.md)
3. Search existing [GitHub Issues](https://github.com/ppconrado/YelpCamp-React/issues)
4. Open a new issue with details about your problem

---

**Last Updated**: December 16, 2025  
**Version**: 2.0.0 - PostgreSQL Edition
