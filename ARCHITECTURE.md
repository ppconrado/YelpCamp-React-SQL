# JosePauloCamp - Technical Architecture Documentation

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Technology Stack](#technology-stack)
4. [Data Flow](#data-flow)
5. [Authentication Flow](#authentication-flow)
6. [File Upload Flow](#file-upload-flow)
7. [Database Schema](#database-schema)
8. [API Endpoints](#api-endpoints)
9. [Security Features](#security-features)
10. [Deployment Architecture](#deployment-architecture)

---

## System Overview

JosePauloCamp is a full-stack campground review platform built as a Single Page Application (SPA). Users can browse campgrounds, view locations on interactive maps, create accounts, add new campgrounds with images, and leave reviews.

### Key Features

- 🏕️ Browse and search campgrounds with pagination
- 🗺️ Interactive Mapbox maps with cluster visualization
- 👤 User authentication and authorization
- 📸 Multi-image upload with Cloudinary integration
- ⭐ Star rating and review system
- 📱 Fully responsive design (mobile-first)
- 🔒 Secure session-based authentication
- 🌐 Cross-domain cookie support (SameSite=None)

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                          CLIENT TIER                             │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │            React 19 + Vite 7 (SPA)                      │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐              │    │
│  │  │  Pages   │  │Components│  │ Context  │              │    │
│  │  │  - Home  │  │  - Forms │  │  - Auth  │              │    │
│  │  │  - Index │  │  - Map   │  │  - Flash │              │    │
│  │  │  - Show  │  │  - Layout│  │          │              │    │
│  │  │  - Auth  │  │  - Modals│  │          │              │    │
│  │  └──────────┘  └──────────┘  └──────────┘              │    │
│  │                                                          │    │
│  │  ┌────────────────────────────────────────────────┐    │    │
│  │  │  API Client (Axios)                            │    │    │
│  │  │  - withCredentials: true                       │    │    │
│  │  │  - baseURL: VITE_API_URL                       │    │    │
│  │  └────────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Deployed on: Vercel (vercel.josepaulocamp.app)                │
└──────────────────────────┬───────────────────────────────────────┘
                           │ HTTPS
                           │ Cookies (SameSite=None; Secure)
                           │
┌──────────────────────────▼───────────────────────────────────────┐
│                        APPLICATION TIER                           │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │          Express.js 4.x + Node.js 18+                   │    │
│  │  ┌──────────────────────────────────────────────────┐   │    │
│  │  │  Middleware Stack                                │   │    │
│  │  │  1. CORS (credentials, dynamic origin)           │   │    │
│  │  │  2. express-session (PostgreSQL store)           │   │    │
│  │  │  3. Manual authentication (bcrypt)               │   │    │
│  │  │  4. Rate Limiting (express-rate-limit)           │   │    │
│  │  │  5. Helmet (CSP, security headers)               │   │    │
│  │  │  6. Input sanitization (SQL injection prevention)│   │    │
│  │  └──────────────────────────────────────────────────┘   │    │
│  │                                                          │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐              │    │
│  │  │  Routes  │  │Controllers│ │Middleware│              │    │
│  │  │  - users │  │  - users  │ │-isLoggedIn│             │    │
│  │  │  - camps │  │  - camps  │ │-isAuthor │              │    │
│  │  │  -reviews│  │  - reviews│ │-validate │              │    │
│  │  └──────────┘  └──────────┘  └──────────┘              │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Deployed on: Render (josepaulocamp-backend.onrender.com)      │
└──────────────────────────┬──────────────┬────────────────────────┘
                           │              │
                ┌──────────▼─────┐  ┌─────▼──────┐
                │                │  │            │
┌───────────────▼──────────────┐ │  │ ┌──────────▼─────────────┐
│      DATA TIER               │ │  │ │   EXTERNAL SERVICES    │
│  ┌─────────────────────┐    │ │  │ │  ┌──────────────────┐  │
│  │   MongoDB Atlas     │    │ │  │ │  │ Cloudinary CDN   │  │
│  │  ┌──────────────┐   │    │ │  │ │  │  - Image hosting │  │
│  │  │ Collections  │   │    │ │  │ │  │  - Transformations│ │
│  │  │  - users     │   │    │ │  │ │  └──────────────────┘  │
│  │  │  - campgrounds│  │    │ │  │ │                         │
│  │  │  - reviews   │   │    │ │  │ │  ┌──────────────────┐  │
│  │  │  - sessions  │   │    │ │  │ │  │  Mapbox API      │  │
│  │  └──────────────┘   │    │ │  │ │  │  - Geocoding     │  │
│  │                     │    │ │  │ │  │  - Maps GL JS    │  │
│  └─────────────────────┘    │ │  │ │  └──────────────────┘  │
│                              │ │  │ └────────────────────────┘
│  Cloud: MongoDB Atlas        │ │  │
└──────────────────────────────┘ │  │
                                 │  │
                                 └──┘
```

---

## Technology Stack

### Frontend

- **Framework**: React 19.0
- **Build Tool**: Vite 7.0
- **UI Library**: Bootstrap 5.3
- **HTTP Client**: Axios 1.7
- **Form Management**: React Hook Form + Zod validation
- **Notifications**: React Hot Toast
- **Maps**: Mapbox GL JS
- **Routing**: React Router DOM v6

### Backend

- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.x
- **Authentication**: Manual bcrypt + express-session
- **Session Store**: connect-pg-simple
- **Database ORM**: Prisma 7.x
- **File Upload**: Multer
- **Validation**: Joi
- **Security**: Helmet, CORS, express-rate-limit

### Database & Services

- **Database**: PostgreSQL (Neon/Supabase/Railway/Local)
- **Image Storage**: Cloudinary
- **Maps & Geocoding**: Mapbox API

### Deployment

- **Frontend**: Vercel
- **Backend**: Render
- **Version Control**: GitHub

---

## Data Flow

### 1. Page Load Flow

```
User Browser
    │
    ├─► GET / (React SPA)
    │   └─► Vercel serves index.html + bundled JS/CSS
    │
    ├─► Check Authentication
    │   └─► GET /api/current-user (with cookies)
    │       └─► Backend validates session
    │           └─► Returns user data or 401
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
    │   └─► If invalid: show error toast
    │
    └─► POST /api/campgrounds (multipart/form-data)
        │
        ├─► Middleware: isLoggedIn
        │   └─► Check req.isAuthenticated()
        │
        ├─► Multer: parse file uploads
        │   └─► Store in memory buffer
        │
        ├─► Cloudinary: upload images
        │   └─► Returns URLs + public IDs
        │
        ├─► Mapbox: geocode location
        │   └─► Returns coordinates
        │
        └─► MongoDB: save campground
            └─► Returns created document
                └─► Frontend: redirect to campground page
```

### 3. Review Creation Flow

```
User submits review (rating + text)
    │
    ├─► POST /api/campgrounds/:id/reviews
    │   └─► Middleware: isLoggedIn
    │       └─► Validates session cookie
    │
    ├─► Middleware: validateReview (Joi)
    │   └─► Validates rating (1-5) and body
    │
    ├─► Controller: createReview
    │   ├─► Create Review document
    │   │   └─► Set author = req.user._id
    │   │
    │   └─► Update Campground
    │       └─► Push review ID to campground.reviews[]
    │
    └─► Response: 201 + review data
        └─► Frontend: add review to UI + toast
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
        ├─► Manual Authentication
        │   ├─► Prisma: User.findUnique({ where: { username } })
        │   ├─► bcrypt.compare(password, user.password)
        │   └─► If valid: return user
        │
        ├─► Set session userId
        │   └─► req.session.userId = user.id
        │
        ├─► req.session.save()
        │   └─► PostgreSQL: store session record
        │       └─► session_id: { userId: <id> }
        │
        └─► Set-Cookie: yelpcamp.sid=<session_id>
            └─► httpOnly: true
            └─► secure: true (production)
            └─► sameSite: 'none' (cross-domain)
            └─► path: /
            └─► maxAge: 7 days

┌──────────────────────────────────────────────────────────────┐
│              AUTHENTICATED REQUEST                            │
└──────────────────────────────────────────────────────────────┘

User requests protected resource
    │
    └─► POST /api/campgrounds/:id/reviews
        │   Cookie: yelpcamp.sid=<session_id>
        │
        ├─► express-session middleware
        │   ├─► Read session_id from cookie
        │   ├─► PostgreSQL: find session record
        │   └─► Attach session to req.session
        │
        ├─► User loading middleware
        │   ├─► Read req.session.userId
        │   ├─► Prisma: User.findUnique({ where: { id: userId } })
        │   └─► Attach user to req.user
        │
        ├─► isLoggedIn middleware
        │   └─► Check req.user exists
        │       └─► If false: return 401
        │
        └─► Controller executes with req.user available
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

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ENTITY RELATIONSHIP DIAGRAM                              │
│                      (Crow's Foot Notation)                                 │
└─────────────────────────────────────────────────────────────────────────────┘

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
  PK  = Primary Key
  FK  = Foreign Key
  1   = One (mandatory)
  N   = Many
  ○   = Optional/Zero
  │   = Relationship line
  ◄─  = Direction of relationship

RELATIONSHIP SUMMARY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. User (1) ──creates──> (N) Campground
2. User (1) ──writes───> (N) Review
3. Campground (1) ──has─> (N) Image
4. Campground (1) ──has─> (N) Review
5. User (M) ←─Review──> (N) Campground  [Many-to-Many via Review]
```

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
model User {
  id           Int          @id @default(autoincrement())
  username     String       @unique
  email        String       @unique
  password     String       // bcrypt hash
  campgrounds  Campground[]
  reviews      Review[]
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt

  @@index([email])
  @@index([username])
}

model Campground {
  id          Int      @id @default(autoincrement())
  title       String
  price       Float
  description String
  location    String
  geometry    Json     // { type: "Point", coordinates: [lng, lat] }
  images      Image[]
  author      User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  authorId    Int
  reviews     Review[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([authorId])
}

model Image {
  id            Int        @id @default(autoincrement())
  url           String
  filename      String
  campground    Campground @relation(fields: [campgroundId], references: [id], onDelete: Cascade)
  campgroundId  Int
}

model Review {
  id            Int        @id @default(autoincrement())
  body          String
  rating        Int        // 1-5
  author        User       @relation(fields: [authorId], references: [id], onDelete: Cascade)
  authorId      Int
  campground    Campground @relation(fields: [campgroundId], references: [id], onDelete: Cascade)
  campgroundId  Int
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt

  @@index([authorId])
  @@index([campgroundId])
}

model Session {
  sid    String   @id
  sess   Json
  expire DateTime

  @@index([expire])
}
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

### Frontend

- ✅ Code splitting (React.lazy)
- ✅ Image lazy loading
- ✅ Vite's aggressive tree-shaking
- ✅ CDN delivery (Vercel Edge Network)
- ✅ Loading skeletons for better UX

### Backend

- ✅ PostgreSQL indexes on frequently queried fields
- ✅ Pagination (limits query size)
- ✅ Connection pooling (Prisma default)
- ✅ Session store in PostgreSQL (not memory)
- ✅ Cloudinary CDN for images

### Database

- ✅ Indexes on foreign keys and commonly queried columns
- ✅ Compound indexes for common query patterns
- ✅ Session expiration handling (auto-cleanup)

---

## Future Enhancements

### Planned Features

- [ ] Full-text search on campgrounds
- [ ] User profiles with avatar upload
- [ ] Favorite/bookmark campgrounds
- [ ] Advanced filtering (price range, rating, amenities)
- [ ] Email notifications
- [ ] Social authentication (Google, GitHub)
- [ ] Real-time chat between users
- [ ] Mobile native app (React Native)

### Technical Improvements

- [ ] Migrate to TypeScript
- [ ] Add end-to-end tests (Playwright)
- [ ] Implement Redis caching layer
- [ ] Add GraphQL API option
- [ ] Implement cursor-based pagination
- [ ] Add Elasticsearch for advanced search
- [ ] Implement WebSocket for real-time features
- [ ] Add CI/CD pipeline with GitHub Actions

---

## Troubleshooting Guide

### Common Issues

**1. 401 Unauthorized on Review Creation**

- **Cause**: Session cookies not persisting across domains
- **Solution**: Ensure `trust proxy: 1` is set in production

**2. CORS Errors**

- **Cause**: FRONTEND_URL not set correctly on Render
- **Solution**: Check environment variable matches exact Vercel URL (no trailing slash)

**3. Images Not Uploading**

- **Cause**: Cloudinary credentials missing or incorrect
- **Solution**: Verify all `CLOUDINARY_*` variables are set

**4. Map Not Displaying**

- **Cause**: Invalid Mapbox token or missing in environment
- **Solution**: Check `VITE_MAPBOX_TOKEN` on frontend, `MAPBOX_TOKEN` on backend

**5. Slow Backend Response on First Request**

- **Cause**: Render free tier spins down after inactivity
- **Solution**: Expected behavior - subsequent requests will be fast

---

## License

MIT

## Contributors

- Jose Paulo Conrado
- GitHub Copilot (AI Assistant)

---

**Documentation Version**: 1.0  
**Last Updated**: November 6, 2025
