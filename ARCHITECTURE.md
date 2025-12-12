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
│  │  │  2. express-session (MongoDB store)              │   │    │
│  │  │  3. Passport.js (Local Strategy)                 │   │    │
│  │  │  4. Rate Limiting (express-rate-limit)           │   │    │
│  │  │  5. Helmet (CSP, security headers)               │   │    │
│  │  │  6. mongo-sanitize (NoSQL injection protection)  │   │    │
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
- **Authentication**: Passport.js (Local Strategy)
- **Session Store**: connect-mongo
- **Database ODM**: Mongoose 5.x
- **File Upload**: Multer
- **Validation**: Joi
- **Security**: Helmet, CORS, express-rate-limit, express-mongo-sanitize

### Database & Services

- **Database**: MongoDB Atlas (cloud)
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
            └─► Backend queries MongoDB
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
        ├─► Passport Local Strategy
        │   ├─► User.findOne({ username })
        │   ├─► Compare password hash
        │   └─► If valid: return user
        │
        ├─► req.login(user)
        │   └─► Passport serializes user._id to session
        │
        ├─► req.session.save()
        │   └─► MongoDB: store session document
        │       └─► session_id: { passport: { user: "userId" } }
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
        │   ├─► MongoDB: find session document
        │   └─► Attach session to req.session
        │
        ├─► Passport middleware
        │   ├─► Read req.session.passport.user
        │   ├─► User.findById(userId)
        │   └─► Attach user to req.user
        │
        ├─► isLoggedIn middleware
        │   └─► Check req.isAuthenticated()
        │       └─► If false: return 401
        │
        └─► Controller executes with req.user available
```

### Session Configuration (Production)

```javascript
{
  store: MongoDBStore,          // Persist sessions in MongoDB
  name: 'yelpcamp.sid',          // Cookie name
  secret: process.env.SECRET,    // Encryption key
  resave: false,
  saveUninitialized: true,
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
        └─► Save to MongoDB
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

### Users Collection

```javascript
{
  _id: ObjectId,
  username: String,     // Unique, indexed
  email: String,        // Required
  salt: String,         // Passport-local-mongoose
  hash: String,         // Password hash
  createdAt: Date,
  updatedAt: Date
}
```

### Campgrounds Collection

```javascript
{
  _id: ObjectId,
  title: String,
  price: Number,
  description: String,
  location: String,
  geometry: {           // GeoJSON Point
    type: "Point",
    coordinates: [lng, lat]
  },
  images: [{
    url: String,        // Cloudinary URL
    filename: String    // Cloudinary public_id
  }],
  author: ObjectId,     // ref: 'User'
  reviews: [ObjectId],  // ref: 'Review'
  createdAt: Date,
  updatedAt: Date
}

// Indexes
campgrounds.geometry: "2dsphere"  // Geo queries
campgrounds.author: 1              // Fast author lookup
```

### Reviews Collection

```javascript
{
  _id: ObjectId,
  body: String,         // Review text
  rating: Number,       // 1-5 stars
  author: ObjectId,     // ref: 'User'
  createdAt: Date,
  updatedAt: Date
}

// Indexes
reviews.author: 1       // Fast author lookup
```

### Sessions Collection (connect-mongo)

```javascript
{
  _id: String,          // session_id
  expires: Date,        // TTL index
  session: {
    cookie: { ... },
    passport: {
      user: ObjectId    // User._id
    }
  }
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

- ✅ Secure password hashing (pbkdf2)
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
- ✅ MongoDB query sanitization (prevents NoSQL injection)
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
│  │    - DB_URL (MongoDB Atlas connection string)       │  │
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
         │ MongoDB  │  │Cloudinary│  │  Mapbox  │
         │  Atlas   │  │   CDN    │  │   API    │
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

- ✅ MongoDB indexes on frequently queried fields
- ✅ Pagination (limits query size)
- ✅ Connection pooling (Mongoose default)
- ✅ Session store in MongoDB (not memory)
- ✅ Cloudinary CDN for images

### Database

- ✅ Geospatial index (`2dsphere`) for location queries
- ✅ Compound indexes for common query patterns
- ✅ TTL index on sessions (auto-cleanup)

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
