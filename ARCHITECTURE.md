# JosePauloCamp - Technical Architecture Documentation

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Data Flow](#data-flow)
6. [Database Migration](#database-migration)
7. [Authentication Flow](#authentication-flow)
8. [File Upload Flow](#file-upload-flow)
9. [Database Schema](#database-schema)
10. [API Endpoints](#api-endpoints)
11. [Security Features](#security-features)
12. [Deployment Architecture](#deployment-architecture)
13. [Performance Optimizations](#performance-optimizations)
14. [Future Enhancements](#future-enhancements)
15. [Troubleshooting Guide](#troubleshooting-guide)

---

## System Overview

JosePauloCamp is a full-stack campground review platform built as a Single Page Application (SPA). The application has been migrated from MongoDB/Mongoose to PostgreSQL/Prisma 7 for better data integrity, relationships, and type safety. Users can browse campgrounds, view locations on interactive maps, create accounts, add new campgrounds with images, and leave reviews.

### Key Features

- 🏕️ Browse and search campgrounds with pagination
- 🗺️ Interactive Mapbox maps with cluster visualization
- 👤 User authentication and authorization (bcrypt + express-session)
- 📸 Multi-image upload with Cloudinary integration (max 10 images)
- ⭐ Star rating and review system (1-5 stars)
- 📱 Fully responsive design (mobile-first with Bootstrap 5.3.8)
- 🔒 Secure session-based authentication (PostgreSQL session store)
- 🌐 Cross-domain cookie support (SameSite=None)
- 🗄️ PostgreSQL database with Prisma ORM (custom output path)
- 🔄 Database migration from MongoDB to PostgreSQL completed
- ⚡ Prisma 7.1.0 with PostgreSQL Driver Adapter for optimal performance

---

## Architecture Diagram

### 🌐 CLIENT TIER (Frontend)

| Component      | Technology                | Details                                      |
| -------------- | ------------------------- | -------------------------------------------- |
| **Framework**  | React 19.1.1 + Vite 7.1.7 | Single Page Application                      |
| **Pages**      | React Router DOM 7.9.5    | Home, Index, Show, New/Edit, Auth            |
| **Components** | React 19.1.1              | Forms, MapboxMap, Layout, Carousel, Modals   |
| **Context**    | React Context API         | Auth, Flash messages                         |
| **API Client** | Axios 1.13.1              | withCredentials: true, baseURL: VITE_API_URL |
| **Deployment** | Vercel                    | vercel.josepaulocamp.app                     |

**Connection**: HTTPS with Cookies (SameSite=None; Secure)

---

### ⚙️ APPLICATION TIER (Backend)

| Component      | Technology      | Description                        |
| -------------- | --------------- | ---------------------------------- |
| **Runtime**    | Node.js 22.20.0 | Express.js 4.17.1                  |
| **Deployment** | Render          | josepaulocamp-backend.onrender.com |

**Middleware Stack:**

1. 🔒 CORS (credentials, dynamic origin)
2. 🍪 express-session (PostgreSQL store)
3. 🔐 Manual authentication (bcrypt 6.0)
4. ⏱️ Rate Limiting (100 req/15min)
5. 🛡️ Helmet (CSP, security headers)
6. 🧹 Input sanitization & validation

**Application Structure:**

| Routes       | Controllers           | Middleware     |
| ------------ | --------------------- | -------------- |
| /users       | users.prisma.js       | isLoggedIn     |
| /campgrounds | campgrounds.prisma.js | isAuthor       |
| /reviews     | reviews.prisma.js     | validateReview |
| /admin       | admin.prisma.js       | -              |

---

### 🗄️ DATA TIER

**PostgreSQL 16+**

| Tables      | Purpose                        |
| ----------- | ------------------------------ |
| users       | User accounts & authentication |
| campgrounds | Campground listings            |
| reviews     | User reviews                   |
| images      | Campground images              |
| session     | Express session storage        |

**Prisma Configuration:**

- 📦 Output: `./generated/prisma`
- 🔌 Adapter: `@prisma/adapter-pg`
- 🏊 Pool: pg connection pool
- ⚙️ Config: `prisma.config.ts`
- 🔄 Singleton: `lib/prisma.js`

**Cloud Providers**: Neon / Supabase / Railway / Local

---

### ☁️ EXTERNAL SERVICES

| Service               | Purpose            | Features                                                                                            |
| --------------------- | ------------------ | --------------------------------------------------------------------------------------------------- |
| **🖼️ Cloudinary CDN** | Image Management   | • Image hosting & storage<br>• Automatic transformations<br>• CDN delivery<br>• Format optimization |
| **🗺️ Mapbox API**     | Maps & Geolocation | • Geocoding service<br>• Maps GL JS<br>• Cluster visualization<br>• Location search                 |
| **🐘 PostgreSQL**     | Database Hosting   | • Neon<br>• Supabase<br>• Railway                                                                   |

---

## Technology Stack

### Frontend

- **Framework**: React 19.1.1
- **Build Tool**: Vite 7.1.7
- **UI Library**: Bootstrap 5.3.8
- **HTTP Client**: Axios 1.13.1
- **Form Management**: React Hook Form 7.66.0 + @hookform/resolvers 5.2.2
- **Validation**: Zod 4.1.12
- **Notifications**: React Hot Toast 2.6.0
- **Maps**: Mapbox GL JS 3.16.0 + react-map-gl 8.1.0
- **Routing**: React Router DOM 7.9.5
- **Image Processing**: browser-image-compression 2.0.2

### Backend

- **Runtime**: Node.js 18+ (v22.20.0)
- **Framework**: Express.js 4.17.1
- **Authentication**: Manual bcrypt 6.0 + express-session 1.17.1
- **Session Store**: connect-pg-simple 10.0 (PostgreSQL)
- **Database ORM**: Prisma 7.1.0 with PostgreSQL Driver Adapter (@prisma/adapter-pg)
- **Database Client**: Custom output path (`./generated/prisma`)
- **Database Connection**: pg 8.16.3 connection pool
- **File Upload**: Multer 2.0.2 + multer-storage-cloudinary 4.0.0
- **Validation**: Joi 17.2.1 (backend) + Zod 4.1.12 (frontend)
- **Security**: Helmet 4.1.1, CORS 2.8.5, express-rate-limit 8.2.1, express-mongo-sanitize 2.0.0, sanitize-html 2.17.0

### Database & Services

- **Database**: PostgreSQL 16+ (Neon/Supabase/Railway/Local)
- **ORM**: Prisma 7.1.0 with PostgreSQL Driver Adapter
- **Connection Pool**: node-postgres (pg) 8.16.3
- **Session Storage**: PostgreSQL (connect-pg-simple)
- **Image Storage**: Cloudinary 2.8.0
- **Maps & Geocoding**: Mapbox SDK 0.16.2 (backend), Mapbox GL JS 3.16.0 (frontend)

### Deployment

- **Frontend**: Vercel
- **Backend**: Render
- **Version Control**: GitHub

---

## Project Structure

### Backend Structure

```

josepaulocamp/
├── app.js # Express server entry point
├── package.json # Backend dependencies
├── prisma.config.ts # Prisma 7 configuration
│
├── lib/
│ └── prisma.js # Prisma Client singleton with pg adapter
│
├── prisma/
│ ├── schema.prisma # Database schema definition
│ └── migrations/ # Database migration history
│ └── 20251215221814_initial_setup/
│
├── generated/
│ └── prisma/ # Generated Prisma Client (custom output)
│ ├── client.ts
│ ├── enums.ts
│ ├── models.ts
│ └── models/
│ ├── User.ts
│ ├── Campground.ts
│ ├── Review.ts
│ └── Image.ts
│
├── controllers/ # Business logic (all using Prisma)
│ ├── users.prisma.js # User authentication & registration
│ ├── campgrounds.prisma.js # Campground CRUD operations
│ ├── reviews.prisma.js # Review management
│ └── admin.prisma.js # Admin operations
│
├── routes/ # Express route handlers
│ ├── users.js # /api/register, /api/login, /api/logout
│ ├── campgrounds.js # /api/campgrounds
│ ├── reviews.js # /api/campgrounds/:id/reviews
│ └── admin.js # /api/admin
│
├── middleware.js # Authentication & authorization middleware
├── schemas.js # Joi validation schemas
│
├── cloudinary/
│ └── index.js # Cloudinary configuration & storage
│
├── utils/
│ ├── catchAsync.js # Async error handler wrapper
│ ├── ExpressError.js # Custom error class
│ ├── validateEnv.js # Environment variable validation
│ └── campgroundHelpers.js # Helper functions
│
├── scripts/
│ └── backfill-timestamps.js # Migration utility scripts
│
└── seeds/
├── index.js # Seed database with sample data
├── cities.js # City data for seeding
└── seedHelpers.js # Seed helper functions

```

### Frontend Structure (React SPA)

```

client/
├── package.json # Frontend dependencies
├── vite.config.js # Vite configuration
├── index.html # HTML entry point
├── vercel.json # Vercel deployment config
│
└── src/
├── main.jsx # React app entry point
├── App.jsx # Root component with routes
├── App.css # Global styles
├── index.css # Base styles
│
├── pages/ # Page components
│ ├── Home.jsx # Landing page
│ ├── campgrounds/
│ │ ├── CampgroundIndex.jsx # List all campgrounds
│ │ ├── CampgroundShow.jsx # Single campground details
│ │ ├── CampgroundNew.jsx # Create new campground
│ │ └── CampgroundEdit.jsx # Edit campground
│ └── users/
│ ├── Register.jsx # User registration
│ └── Login.jsx # User login
│
├── components/ # Reusable components
│ ├── Layout.jsx # App layout with navbar
│ ├── ProtectedRoute.jsx # Route guard for auth
│ ├── CampgroundForm.jsx # Campground form (new/edit)
│ ├── ReviewForm.jsx # Review submission form
│ ├── ImageCarousel.jsx # Image slideshow
│ ├── MapboxMap.jsx # Mapbox map display
│ ├── MapboxGeocoder.jsx # Location search
│ └── ui/ # UI components
│ ├── FormInput.jsx
│ ├── SubmitButton.jsx
│ ├── ConfirmModal.jsx
│ ├── CenteredCard.jsx
│ ├── CardSkeleton.jsx
│ └── DetailSkeleton.jsx
│
├── context/ # React Context providers
│ ├── AuthContext.jsx # User authentication state
│ └── FlashContext.jsx # Toast notifications
│
├── api/ # API client functions
│ ├── http.js # Axios instance with config
│ ├── auth.js # Auth API calls
│ ├── campgrounds.js # Campground API calls
│ └── reviews.js # Review API calls
│
├── hooks/ # Custom React hooks
│ └── useUnsavedChanges.js # Warn on navigation with unsaved changes
│
├── utils/ # Utility functions
│ ├── imageCompression.js # Client-side image compression
│ └── timeAgo.js # Relative time formatting
│
└── assets/ # Static assets (images, icons)

```

### Key Files Explained

**Backend:**

- [`app.js`](app.js) - Main Express server with middleware, CORS, session config, and routes
- [`lib/prisma.js`](lib/prisma.js) - Prisma Client singleton with PostgreSQL adapter (prevents multiple instances)
- [`prisma.config.ts`](prisma.config.ts) - Prisma 7 configuration with environment variable loading
- [`middleware.js`](middleware.js) - isLoggedIn, isAuthor, isReviewAuthor middleware
- Controllers (`.prisma.js`) - All use Prisma for database operations

**Frontend:**

- [`main.jsx`](client/src/main.jsx) - React app bootstrap with Router and Context providers
- [`App.jsx`](client/src/App.jsx) - Route definitions and layout structure
- [`api/http.js`](client/src/api/http.js) - Axios instance with baseURL and credentials config
- [`context/AuthContext.jsx`](client/src/context/AuthContext.jsx) - Global authentication state management

---

## Data Flow

### 1. Page Load Flow

```

User Browser
│
├─► GET / (React SPA)
│ └─► Vercel serves index.html + bundled JS/CSS
│
├─► Check Authentication
│ └─► GET /api/current-user (with cookies)
│ └─► Backend validates session
│ └─► Returns user data or 401
│
└─► Load Campgrounds
└─► GET /api/campgrounds?page=1&limit=12
└─► Backend queries PostgreSQL via Prisma
└─► Returns paginated results + metadata

```

### 2. Create Campground Flow

```

User fills form with images
│
├─► Frontend validation (Zod schema)
│ └─► If invalid: show error toast
│
└─► POST /api/campgrounds (multipart/form-data)
│
├─► Middleware: isLoggedIn
│ └─► Check req.user exists
│
├─► Multer: parse file uploads
│ └─► Store in memory buffer
│
├─► Cloudinary: upload images
│ └─► Returns URLs + public IDs
│
├─► Mapbox: geocode location
│ └─► Returns coordinates
│
└─► Prisma: save campground
├─► prisma.campground.create()
│ ├─► Connect to author (userId)
│ ├─► Create nested images
│ └─► Store geometry as JSON
└─► Returns created document
└─► Frontend: redirect to campground page

```

### 3. Review Creation Flow

```

User submits review (rating + text)
│
├─► POST /api/campgrounds/:id/reviews
│ └─► Middleware: isLoggedIn
│ └─► Validates session cookie
│
├─► Middleware: validateReview (Joi)
│ └─► Validates rating (1-5) and body
│
├─► Controller: createReview (Prisma)
│ └─► prisma.review.create()
│ ├─► Connect to author (userId)
│ ├─► Connect to campground (campgroundId)
│ └─► Set rating and body
│
└─► Response: 201 + review data
└─► Frontend: add review to UI + toast

```

---

## Database Migration

### From MongoDB to PostgreSQL

The application was successfully migrated from MongoDB/Mongoose to PostgreSQL/Prisma 7 in December 2025. This migration provides several benefits:

#### Why PostgreSQL?

- **Data Integrity**: Foreign key constraints ensure referential integrity
- **ACID Compliance**: Guaranteed transactional consistency
- **Better Relationships**: Native support for complex relations
- **Type Safety**: Prisma generates fully typed client from schema
- **Performance**: Efficient joins and indexing
- **Standard SQL**: Industry-standard query language

#### Migration Process

1. **Schema Design**: Converted Mongoose schemas to Prisma schema

   - User → User table with bcrypt password hashing
   - Campground → Campground table with foreign key to User
   - Review → Review table with foreign keys to User and Campground
   - Embedded images → Separate Image table with foreign key to Campground

2. **Prisma 7 Setup**: Custom configuration for compatibility

   - Generator output: `./generated/prisma` (custom path)
   - PostgreSQL Driver Adapter: `@prisma/adapter-pg` for Prisma 7
   - Connection Pool: `pg` library for efficient connections
   - Configuration: `prisma.config.ts` for environment-based setup

3. **Controllers Refactor**: All controllers migrated to Prisma

   - `controllers/users.prisma.js` - User authentication with bcrypt
   - `controllers/campgrounds.prisma.js` - CRUD operations
   - `controllers/reviews.prisma.js` - Review management
   - `controllers/admin.prisma.js` - Admin operations

4. **Session Storage**: Migrated to PostgreSQL
   - Uses `connect-pg-simple` for session storage
   - Session table automatically created and managed
   - Better scalability than memory-based sessions

#### Key Changes

**Before (Mongoose)**:

```javascript
const Campground = require('./models/campground');
const campground = await Campground.findById(id)
  .populate('author')
  .populate('reviews');
```

**After (Prisma)**:

```javascript
const prisma = require('./lib/prisma');
const campground = await prisma.campground.findUnique({
  where: { id: parseInt(id) },
  include: { author: true, reviews: { include: { author: true } } },
});
```

#### Prisma Commands

```bash
# Generate Prisma Client (after schema changes)
npx prisma generate

# Create and apply migrations
npx prisma migrate dev --name description_of_change

# Check migration status
npx prisma migrate status

# Open Prisma Studio (database GUI)
npx prisma studio

# Reset database (development only)
npx prisma migrate reset
```

---

## Authentication Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    LOGIN PROCESS                              │
└──────────────────────────────────────────────────────────────┘

User enters credentials
    │
    └─► POST /api/login { username, password }
        │
        ├─► Manual Authentication (controllers/users.prisma.js)
        │   ├─► Prisma: prisma.user.findUnique({ where: { username } })
        │   ├─► bcrypt.compare(password, user.password)
        │   └─► If valid: return user
        │
        ├─► Set session userId
        │   └─► req.session.userId = user.id
        │
        ├─► req.session.save()
        │   └─► PostgreSQL: store session record (connect-pg-simple)
        │       └─► session table: { sid, sess, expire }
        │
        └─► Set-Cookie: yelpcamp.sid=<session_id>
            └─► httpOnly: true
            └─► secure: true (production)
            └─► sameSite: 'none' (cross-domain)
            └─► path: /
            └─► maxAge: 7 days

╔═══════════════════════════════════════════════════════════════════════════╗
║              🔐 AUTHENTICATED REQUEST FLOW                               ║
╚═══════════════════════════════════════════════════════════════════════════╝

┌────────────────────────────────────────────────────────────────────────┐
│  👤 User Requests Protected Resource                                   │
└────────────────────────────────────────────────────────────────────────┘
         │
         │  POST /api/campgrounds/:id/reviews
         │  🍪 Cookie: yelpcamp.sid=<session_id>
         │
         ▼
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  MIDDLEWARE PIPELINE                                                ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
         │
         │  ① express-session middleware
         ├───────────────────────────────────────────────────────────────┐
         │  ┌────────────────────────────────────────────────────────┐    │
         │  │ 📋 Read session_id from cookie                     │    │
         │  │ 🔍 Query PostgreSQL session table:                 │    │
         │  │    SELECT * FROM session WHERE sid = <session_id>  │    │
         │  │ ✅ Attach session data to req.session              │    │
         │  └────────────────────────────────────────────────────────┘    │
         │                                                             │
         ▼                                                             │
         │  ② User Loading Middleware (app.js)                        │
         ├───────────────────────────────────────────────────────────────┤
         │  ┌────────────────────────────────────────────────────────┐    │
         │  │ 📖 Read req.session.userId                         │    │
         │  │ 🐘 Prisma Query:                                   │    │
         │  │    prisma.user.findUnique({                        │    │
         │  │      where: { id: userId },                        │    │
         │  │      select: { id, username, email }               │    │
         │  │    })                                              │    │
         │  │ ✅ Attach user object to req.user                  │    │
         │  └────────────────────────────────────────────────────────┘    │
         │                                                             │
         ▼                                                             │
         │  ③ isLoggedIn Middleware (middleware.js)                   │
         ├───────────────────────────────────────────────────────────────┤
         │  ┌────────────────────────────────────────────────────────┐    │
         │  │ ❓ Check: Does req.user exist?                     │    │
         │  │                                                    │    │
         │  │ ✅ YES: Continue to controller                     │    │
         │  │                                                    │    │
         │  │ ❌ NO:  Return 401 Unauthorized                    │    │
         │  │         { error: "Please login first" }           │    │
         │  └────────────────────────────────────────────────────────┘    │
         │                                                             │
         ▼                                                             │
┌────────────────────────────────────────────────────────────────────────┐
│  🎮 CONTROLLER EXECUTES                                            │
│  ✓ req.user available: { id, username, email }                    │
│  ✓ req.session available                                          │
└────────────────────────────────────────────────────────────────────────┘
```

### Session Configuration (Production)

```javascript
{
  store: PostgresStore,          // Persist sessions in PostgreSQL
  name: 'yelpcamp.sid',          // Cookie name
  secret: process.env.SECRET,    // Encryption key
  resave: false,
  saveUninitialized: false,      // Don't create session until login
  proxy: true,                   // Trust Render proxy
  cookie: {
    httpOnly: true,              // No JS access
    secure: true,                // HTTPS only
    sameSite: 'none',            // Cross-domain allowed
    maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days
  }
}
```

---

## File Upload Flow

```
┌──────────────────────────────────────────────────────────────┐
│                 IMAGE UPLOAD PROCESS                          │
└──────────────────────────────────────────────────────────────┘

1. User selects images in form
    │
    └─► React: File input (accept="image/*" multiple)
        └─► FormData with files

2. Frontend sends request
    │
    └─► POST /api/campgrounds
        │   Content-Type: multipart/form-data
        │   Body: { title, location, price, description, images[] }

3. Backend receives upload
    │
    ├─► Multer middleware
    │   ├─► Parse multipart data
    │   ├─► Validate file types (images only)
    │   ├─► Store in memory buffer
    │   └─► Attach to req.files[]
    │
    └─► Controller processes files
        │
        ├─► For each file in req.files:
        │   │
        │   └─► Cloudinary upload
        │       ├─► Upload buffer to cloud
        │       ├─► Apply transformations (resize, optimize)
        │       └─► Return: { url, filename, public_id }
        │
        └─► Save to PostgreSQL via Prisma
            └─► campground.images = [
                  { url: "https://res.cloudinary.com/...",
                    filename: "YelpCamp/abc123" }
                ]

4. Frontend displays images
    │
    └─► Image Carousel component
        └─► Fetch from Cloudinary CDN
            └─► Cached, optimized delivery
```

---

## Database Schema

### Entity Relationship Diagram (ERD)

#### 📊 Database Tables

**🧑 USER**
| Column | Type | Constraints |
|--------|------|-------------|
| 🔑 id | Integer | PRIMARY KEY, AUTO INCREMENT |
| 📧 email | String | UNIQUE, NOT NULL |
| 👤 username | String | UNIQUE, NOT NULL |
| 🔒 password | String | NOT NULL (bcrypt hash) |
| 📅 createdAt | DateTime | DEFAULT now() |
| 📅 updatedAt | DateTime | AUTO UPDATE |

**🏕️ CAMPGROUND**
| Column | Type | Constraints |
|--------|------|-------------|
| 🔑 id | Integer | PRIMARY KEY, AUTO INCREMENT |
| 📝 title | String | NOT NULL |
| 📄 description | String | NOT NULL |
| 💰 price | Float | NOT NULL |
| 📍 location | String | NOT NULL |
| 🗺️ geometry | JSON | GeoJSON Point |
| 🔗 authorId | Integer | FOREIGN KEY → User.id |
| 📅 createdAt | DateTime | DEFAULT now() |
| 📅 updatedAt | DateTime | AUTO UPDATE |

**⭐ REVIEW**
| Column | Type | Constraints |
|--------|------|-------------|
| 🔑 id | Integer | PRIMARY KEY, AUTO INCREMENT |
| 💬 body | String | NOT NULL |
| ⭐ rating | Integer | 1-5, NOT NULL |
| 🔗 authorId | Integer | FOREIGN KEY → User.id |
| 🔗 campgroundId | Integer | FOREIGN KEY → Campground.id |
| 📅 createdAt | DateTime | DEFAULT now() |
| 📅 updatedAt | DateTime | AUTO UPDATE |

**🖼️ IMAGE**
| Column | Type | Constraints |
|--------|------|-------------|
| 🔑 id | Integer | PRIMARY KEY, AUTO INCREMENT |
| 🌐 url | String | NOT NULL (Cloudinary URL) |
| 📁 filename | String | NOT NULL |
| 🔗 campgroundId | Integer | FOREIGN KEY → Campground.id |

**🍪 SESSION**
| Column | Type | Constraints |
|--------|------|-------------|
| 🔑 sid | VARCHAR(255) | PRIMARY KEY |
| 📦 sess | JSON | NOT NULL |
| ⏰ expire | TIMESTAMP | NOT NULL, INDEXED |

---

#### 🔗 Relationships

| #   | Relationship        | Type             | Description                                                                           |
| --- | ------------------- | ---------------- | ------------------------------------------------------------------------------------- |
| 1️⃣  | User → Campground   | **One-to-Many**  | One user creates many campgrounds<br>CASCADE: Delete user → delete campgrounds        |
| 2️⃣  | User → Review       | **One-to-Many**  | One user writes many reviews<br>CASCADE: Delete user → delete reviews                 |
| 3️⃣  | Campground → Image  | **One-to-Many**  | One campground has many images (max 10)<br>CASCADE: Delete campground → delete images |
| 4️⃣  | Campground → Review | **One-to-Many**  | One campground has many reviews<br>CASCADE: Delete campground → delete reviews        |
| 5️⃣  | User ↔ Campground   | **Many-to-Many** | Via Review table (junction)<br>Business Rule: One review per user per campground      |

---

    ┌─────────────────────┐
    │       USER          │
    ├─────────────────────┤
    │ PK  id              │
    │     username        │
    │     email           │
    │     password        │
    │     createdAt       │
    │     updatedAt       │
    └─────────────────────┘
            │       │
            │       │
          1 │       │ 1
            │       │
            │       └─────────────────┐
            │                         │
            │ creates                 │ writes
            │                         │
            │                         │
            ○                         ○
            │                         │
          N │                       N │
            │                         │
    ┌───────┴──────────┐      ┌───────┴──────────┐
    │   CAMPGROUND     │      │     REVIEW       │
    ├──────────────────┤      ├──────────────────┤
    │ PK  id           │      │ PK  id           │
    │     title        │      │     body         │
    │     description  │◄─────┤ FK  campgroundId │
    │     price        │  1:N │     rating       │
    │     location     │      │ FK  authorId     │
    │     geometry     │      │     createdAt    │
    │ FK  authorId     │      │     updatedAt    │
    │     createdAt    │      └──────────────────┘
    │     updatedAt    │              │
    └──────────────────┘              │
            │                         │
            │                         │ about
          1 │                         │
            │                       N │
            ○                         │
            │                         │
          N │                         │
            │                         │
    ┌───────┴──────────┐              │
    │      IMAGE       │              │
    ├──────────────────┤              │
    │ PK  id           │              │
    │     url          │              │
    │     filename     │              │
    │ FK  campgroundId │──────────────┘
    └──────────────────┘


    ┌──────────────────┐
    │   SESSION        │
    ├──────────────────┤
    │ PK  sid          │
    │     sess         │
    │     expire       │
    └──────────────────┘

LEGEND:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PK = Primary Key
FK = Foreign Key
1 = One (mandatory)
N = Many
○ = Optional/Zero
│ = Relationship line
◄─ = Direction of relationship

RELATIONSHIP SUMMARY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. User (1) ──creates──> (N) Campground
2. User (1) ──writes───> (N) Review
3. Campground (1) ──has─> (N) Image
4. Campground (1) ──has─> (N) Review
5. User (M) ←─Review──> (N) Campground [Many-to-Many via Review]

````

### Relationship Details

**User to Campground (One-to-Many)**

- One user can create many campgrounds
- Each campground has exactly one author
- Foreign Key: `Campground.authorId → User.id`
- On Delete: CASCADE (delete user → delete their campgrounds)

**User to Review (One-to-Many)**

- One user can write many reviews
- Each review has exactly one author
- Foreign Key: `Review.authorId → User.id`
- On Delete: CASCADE (delete user → delete their reviews)

**Campground to Image (One-to-Many)**

- One campground can have many images (max 10 enforced in app logic)
- Each image belongs to exactly one campground
- Foreign Key: `Image.campgroundId → Campground.id`
- On Delete: CASCADE (delete campground → delete its images)

**Campground to Review (One-to-Many)**

- One campground can have many reviews
- Each review belongs to exactly one campground
- Foreign Key: `Review.campgroundId → Campground.id`
- On Delete: CASCADE (delete campground → delete its reviews)

**User to Campground via Review (Many-to-Many)**

- Users can review multiple campgrounds
- Campgrounds can be reviewed by multiple users
- Junction: Review table links users and campgrounds
- Business Logic: One user can review same campground only once

### Prisma Schema (PostgreSQL)

```prisma
// prisma/schema.prisma
generator client {
  provider   = "prisma-client-js"
  output     = "../generated/prisma"  // Custom output location
  engineType = "library"
}

datasource db {
  provider = "postgresql"
  // URL configured via prisma.config.ts using env("DATABASE_URL")
}

model User {
  id          Int          @id @default(autoincrement())
  email       String       @unique
  username    String       @unique
  password    String       // bcrypt hash
  campgrounds Campground[] @relation("UserCampgrounds")
  reviews     Review[]

  @@index([email])
  @@index([username])
}

model Campground {
  id          Int      @id @default(autoincrement())
  title       String
  description String
  price       Float
  location    String
  authorId    Int
  author      User     @relation("UserCampgrounds", fields: [authorId], references: [id])
  reviews     Review[]
  images      Image[]
  geometry    Json     // { type: "Point", coordinates: [lng, lat] }
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([authorId])
}

model Review {
  id           Int        @id @default(autoincrement())
  body         String
  rating       Int        // 1-5
  authorId     Int
  campgroundId Int
  author       User       @relation(fields: [authorId], references: [id])
  campground   Campground @relation(fields: [campgroundId], references: [id])
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  @@index([authorId])
  @@index([campgroundId])
}

model Image {
  id           Int        @id @default(autoincrement())
  url          String
  filename     String
  campgroundId Int
  campground   Campground @relation(fields: [campgroundId], references: [id])
}
````

### Prisma Client Configuration

The project uses a custom Prisma Client setup with PostgreSQL Driver Adapter for Prisma 7 compatibility:

```javascript
// lib/prisma.js - Singleton pattern for Prisma Client
const { PrismaClient } = require('../generated/prisma');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Prisma adapter for PostgreSQL
const adapter = new PrismaPg(pool);

// Singleton to prevent multiple instances
let prisma;
if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({ adapter });
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient({ adapter });
  }
  prisma = global.prisma;
}

module.exports = prisma;
```

```typescript
// prisma.config.ts - Prisma 7 configuration
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
```

---

## API Endpoints

### Authentication

```
POST   /api/register       - Create new user account
POST   /api/login          - Authenticate user
GET    /api/logout         - Destroy session
GET    /api/current-user   - Get logged-in user info
```

### Campgrounds

```
GET    /api/campgrounds              - List all (paginated)
  Query params: ?page=1&limit=12&sort=-createdAt
  Response: { items: [], page, limit, total, totalPages, hasNext, hasPrev }

POST   /api/campgrounds              - Create new (auth required)
  Body: multipart/form-data
  Files: images[] (max 10)

GET    /api/campgrounds/:id          - Get single campground
  Populates: author, reviews.author

PUT    /api/campgrounds/:id          - Update campground (owner only)
DELETE /api/campgrounds/:id          - Delete campground (owner only)
```

### Reviews

```
POST   /api/campgrounds/:id/reviews         - Create review (auth required)
  Body: { review: { rating, body } }

DELETE /api/campgrounds/:id/reviews/:reviewId - Delete review (owner only)
```

### Health & Debug

```
GET    /health                      - Health check
  Response: { status: 'ok', uptime, timestamp }

GET    /version                     - App version info
  Response: { name, version, node, env }

GET    /api/debug/session           - Session debug info (development)
```

---

## Security Features

### 1. Authentication & Authorization

- ✅ Secure password hashing (bcrypt)
- ✅ Session-based authentication (not JWT for better security)
- ✅ HttpOnly cookies (XSS protection)
- ✅ CSRF protection via SameSite cookies
- ✅ Password requirements: 8+ chars, uppercase, lowercase, number

### 2. Rate Limiting

```javascript
// General API: 100 requests per 15 minutes
// Auth endpoints: 5 requests per 15 minutes
```

### 3. Input Validation & Sanitization

- ✅ Joi schema validation (backend)
- ✅ Zod schema validation (frontend)
- ✅ Prisma parameterized queries (prevents SQL injection)
- ✅ HTML/XSS sanitization

### 4. HTTP Security Headers (Helmet)

```
Content-Security-Policy
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
```

### 5. CORS Configuration

```javascript
{
  origin: [localhost, FRONTEND_URL],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}
```

### 6. File Upload Security

- ✅ File type validation (images only)
- ✅ File size limits
- ✅ Cloudinary virus scanning
- ✅ No local file storage

---

## Deployment Architecture

### Production Environment

```
┌────────────────────────────────────────────────────────────┐
│                  VERCEL (Frontend CDN)                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  • Auto-deploy from GitHub (main branch)            │  │
│  │  • Global CDN edge network                          │  │
│  │  • Automatic HTTPS                                  │  │
│  │  • Environment variables: VITE_API_URL              │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
                             │
                             │ HTTPS
                             ▼
┌────────────────────────────────────────────────────────────┐
│                  RENDER (Backend Service)                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  • Auto-deploy from GitHub (main branch)            │  │
│  │  • Free tier (spins down after 15min inactivity)    │  │
│  │  • Automatic HTTPS                                  │  │
│  │  • Environment variables:                           │  │
│  │    - NODE_ENV=production                            │  │
│  │  │    - DATABASE_URL (PostgreSQL connection string)    │  │
│  │    - SECRET (session encryption key)                │  │
│  │    - FRONTEND_URL (Vercel URL for CORS)             │  │
│  │    - CLOUDINARY_* (image upload credentials)        │  │
│  │    - MAPBOX_TOKEN (maps API key)                    │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
                             │
                ┌────────────┼────────────┐
                │            │            │
                ▼            ▼            ▼
         ┌──────────┐  ┌──────────┐  ┌──────────┐
         │PostgreSQL│  │Cloudinary│  │  Mapbox  │
         │   Neon   │  │   CDN    │  │   API    │
         └──────────┘  └──────────┘  └──────────┘
```

### Deployment Flow

```
Developer pushes to GitHub
    │
    ├─► GitHub triggers webhooks
    │
    ├─► Vercel: builds frontend
    │   └─► npm run build
    │       └─► Outputs: client/dist/
    │           └─► Deployed to CDN
    │
    └─► Render: builds backend
        └─► npm install
            └─► Starts: node app.js
                └─► Listens on $PORT
```

### Environment-Specific Configuration

**Development**

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`
- Cookies: `sameSite: 'lax'`, `secure: false`

**Production**

- Frontend: `https://josepaulocamp.vercel.app`
- Backend: `https://josepaulocamp-backend.onrender.com`
- Cookies: `sameSite: 'none'`, `secure: true`
- Proxy: `trust proxy: 1` (for Render)

---

## Performance Optimizations

### Backend

- ✅ PostgreSQL indexes on frequently queried fields (email, username, authorId, campgroundId)
- ✅ Prisma connection pooling (pg pool with @prisma/adapter-pg)
- ✅ Custom Prisma client output path for optimized builds
- ✅ Pagination with efficient queries (limits query size)
- ✅ Session store in PostgreSQL (not memory) for horizontal scaling
- ✅ Cloudinary CDN for images (offloads server bandwidth)
- ✅ Singleton pattern for Prisma Client (prevents multiple instances)

### Frontend

- ✅ Code splitting (React.lazy)
- ✅ Image lazy loading
- ✅ Vite's aggressive tree-shaking and HMR
- ✅ CDN delivery (Vercel Edge Network)
- ✅ Loading skeletons for better UX
- ✅ Browser-side image compression before upload

### Database

- ✅ Indexes on foreign keys: authorId, campgroundId
- ✅ Compound indexes for common query patterns
- ✅ Session expiration handling (auto-cleanup)
- ✅ JSON type for geometry (efficient storage)
- ✅ Auto-increment primary keys (better than UUIDs for joins)

---

## Future Enhancements

### Planned Features

- [ ] Full-text search on campgrounds (PostgreSQL full-text search)
- [ ] User profiles with avatar upload
- [ ] Favorite/bookmark campgrounds
- [ ] Advanced filtering (price range, rating, amenities)
- [ ] Email notifications (nodemailer + PostgreSQL job queue)
- [ ] Social authentication (Google, GitHub OAuth)
- [ ] Real-time chat between users (WebSocket)
- [ ] Mobile native app (React Native)
- [ ] Campground availability calendar
- [ ] Photo gallery with lightbox

### Technical Improvements

- [ ] Migrate to TypeScript (full type safety)
- [ ] Add end-to-end tests (Playwright)
- [ ] Implement Redis caching layer
- [ ] Add GraphQL API option (Prisma supports it)
- [ ] Implement cursor-based pagination (better performance)
- [ ] Add Elasticsearch for advanced search
- [ ] Implement WebSocket for real-time features
- [ ] Add CI/CD pipeline with GitHub Actions
- [ ] Database replication for read scaling
- [ ] Monitoring with Sentry and Datadog

---

## Troubleshooting Guide

### Common Issues

**1. Error: Cannot find module '.prisma/client/default'**

- **Cause**: Prisma Client not generated or using wrong import path
- **Solution**:
  ```bash
  npx prisma generate
  ```
  Ensure imports use: `require('../generated/prisma')` not `@prisma/client`

**2. 401 Unauthorized on Review Creation**

- **Cause**: Session cookies not persisting across domains
- **Solution**: Ensure `trust proxy: 1` is set in production and `sameSite: 'none'` for cookies

**3. CORS Errors**

- **Cause**: FRONTEND_URL not set correctly on Render
- **Solution**: Check environment variable matches exact Vercel URL (no trailing slash)

**4. Images Not Uploading**

- **Cause**: Cloudinary credentials missing or incorrect
- **Solution**: Verify all `CLOUDINARY_*` variables are set in environment

**5. Map Not Displaying**

- **Cause**: Invalid Mapbox token or missing in environment
- **Solution**: Check `VITE_MAPBOX_TOKEN` on frontend, `MAPBOX_TOKEN` on backend

**6. Slow Backend Response on First Request**

- **Cause**: Render free tier spins down after inactivity
- **Solution**: Expected behavior - subsequent requests will be fast

**7. Prisma Migration Errors**

- **Cause**: Schema changes not migrated or migration conflicts
- **Solution**:
  ```bash
  npx prisma migrate status
  npx prisma migrate dev --name fix_description
  ```

**8. Session Not Persisting**

- **Cause**: PostgreSQL session table not created or connection issues
- **Solution**: Check DATABASE_URL is correct and session table exists (connect-pg-simple creates it automatically)

---

## License

MIT

## Contributors

- Jose Paulo Conrado
- GitHub Copilot (AI Assistant)

---

**Documentation Version**: 2.0  
**Last Updated**: December 18, 2025  
**Major Changes**: MongoDB to PostgreSQL migration completed, Prisma 7 integration with custom output path
