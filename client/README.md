# JosePauloCamp Frontend (Client)

> Modern React 19 + Vite 7 Single Page Application (SPA) for campground discovery and reviews

[![React](https://img.shields.io/badge/React-19.1.1-61DAFB?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7.1.7-646CFF?logo=vite)](https://vite.dev/)
[![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3.8-7952B3?logo=bootstrap)](https://getbootstrap.com/)

---

## 📖 Overview

This is the frontend client for JosePauloCamp - a full-featured, responsive Single Page Application built with React 19 and Vite 7. It provides an intuitive interface for discovering, creating, and reviewing campgrounds with interactive maps, image galleries, and real-time form validation.

### ✨ Key Features

- 🎨 **Modern React 19** - Latest React features with concurrent rendering
- ⚡ **Lightning-fast Vite 7** - Instant HMR and optimized production builds
- 🎯 **Type-safe Forms** - React Hook Form + Zod validation
- 🗺️ **Interactive Maps** - Mapbox GL with cluster visualization
- 📱 **Fully Responsive** - Mobile-first design with Bootstrap 5
- 🔐 **Session-based Auth** - Secure cookie-based authentication
- 🖼️ **Image Management** - Client-side compression before upload
- 🎭 **Smooth UX** - Loading skeletons, toast notifications, confirm modals
- 🔄 **Real-time Updates** - Live timestamps and dynamic content

---

## 🏗️ Architecture

### Technology Stack

| Category             | Technology                | Version  | Purpose                             |
| -------------------- | ------------------------- | -------- | ----------------------------------- |
| **Core**             | React                     | 19.1.1   | UI library with concurrent features |
|                      | React DOM                 | 19.1.1   | DOM rendering                       |
|                      | Vite                      | 7.1.7    | Build tool & dev server             |
| **Routing**          | React Router DOM          | 7.9.5    | Client-side routing & navigation    |
| **State Management** | React Context API         | Built-in | Global state (auth, flash)          |
| **Forms**            | React Hook Form           | 7.66.0   | Form state management               |
|                      | Zod                       | 4.1.12   | Schema validation                   |
|                      | @hookform/resolvers       | 5.2.2    | Zod integration                     |
| **HTTP Client**      | Axios                     | 1.13.1   | API requests with interceptors      |
| **UI Framework**     | Bootstrap                 | 5.3.8    | Responsive components & grid        |
| **Notifications**    | React Hot Toast           | 2.6.0    | Toast notifications                 |
| **Maps**             | Mapbox GL JS              | 3.16.0   | Interactive maps                    |
|                      | react-map-gl              | 8.1.0    | React wrapper for Mapbox            |
| **Image Processing** | browser-image-compression | 2.0.2    | Client-side image compression       |
| **Development**      | ESLint                    | 9.36.0   | Code linting                        |

### Project Structure

```
client/
├── public/                      # Static assets
├── src/
│   ├── api/                     # API communication layer
│   │   ├── http.js              # Axios instance configuration
│   │   ├── auth.js              # Authentication endpoints
│   │   ├── campgrounds.js       # Campground CRUD operations
│   │   └── reviews.js           # Review operations
│   │
│   ├── components/              # Reusable React components
│   │   ├── Layout.jsx           # Main layout with navbar/footer
│   │   ├── ProtectedRoute.jsx   # Auth-protected route wrapper
│   │   ├── CampgroundForm.jsx   # Form for create/edit campground
│   │   ├── ReviewForm.jsx       # Form for creating reviews
│   │   ├── ImageCarousel.jsx    # Bootstrap image carousel
│   │   ├── MapboxMap.jsx        # Mapbox map component (cluster + single)
│   │   ├── MapboxGeocoder.jsx   # Location search/autocomplete
│   │   │
│   │   └── ui/                  # Reusable UI components
│   │       ├── FormInput.jsx    # Styled input with error display
│   │       ├── SubmitButton.jsx # Submit button with loading state
│   │       ├── ConfirmModal.jsx # Confirmation dialog
│   │       ├── CardSkeleton.jsx # Loading skeleton for cards
│   │       ├── DetailSkeleton.jsx # Loading skeleton for details
│   │       └── CenteredCard.jsx # Centered card container
│   │
│   ├── context/                 # React Context providers
│   │   ├── AuthContext.jsx      # User authentication state
│   │   └── FlashContext.jsx     # Toast notifications wrapper
│   │
│   ├── hooks/                   # Custom React hooks
│   │   └── useUnsavedChanges.js # Warn on navigation with unsaved data
│   │
│   ├── pages/                   # Route components
│   │   ├── Home.jsx             # Landing page
│   │   ├── campgrounds/
│   │   │   ├── CampgroundIndex.jsx  # List with map & pagination
│   │   │   ├── CampgroundShow.jsx   # Detail view with reviews
│   │   │   ├── CampgroundNew.jsx    # Create new campground
│   │   │   └── CampgroundEdit.jsx   # Edit existing campground
│   │   │
│   │   └── users/
│   │       ├── Register.jsx     # User registration
│   │       └── Login.jsx        # User login
│   │
│   ├── utils/                   # Utility functions
│   │   ├── imageCompression.js  # Image compression helper
│   │   └── timeAgo.js           # Relative time formatting
│   │
│   ├── App.jsx                  # Root component with routes
│   ├── main.jsx                 # Entry point
│   ├── App.css                  # Application styles
│   └── index.css                # Global styles
│
├── index.html                   # HTML template
├── vite.config.js               # Vite configuration
├── package.json                 # Dependencies & scripts
└── eslint.config.js             # ESLint configuration
```

---

## 🔄 Data Flow Architecture

### Component Hierarchy

```
main.jsx
└── <BrowserRouter>
    └── <FlashProvider>          # Toast notifications context
        └── <AuthProvider>       # User authentication context
            └── <App>            # Route definitions
                └── <Layout>     # Navbar + Footer + Outlet
                    └── <Outlet> # Route components
```

### Data Flow Patterns

#### 1️⃣ **Authentication Flow**

```
User Action → Login Page
    ↓
    POST /api/login (with credentials)
    ↓
Backend validates → Sets HttpOnly cookie
    ↓
Frontend receives user data
    ↓
AuthContext updates currentUser state
    ↓
Protected routes become accessible
    ↓
Navbar shows user info
```

#### 2️⃣ **Campground Creation Flow**

```
User → CampgroundNew page
    ↓
CampgroundForm component loads
    ↓
User fills form:
    - Title, Description, Price
    - Location (via MapboxGeocoder → geocoding API)
    - Image file (compressed via browser-image-compression)
    ↓
Form validation (Zod schema)
    ↓
Submit → FormData creation:
    - Text fields
    - Geometry (Point with coordinates)
    - Compressed image file
    ↓
POST /api/campgrounds (multipart/form-data)
    ↓
Backend processes:
    - Saves to PostgreSQL
    - Uploads image to Cloudinary
    - Returns campground with image URLs
    ↓
Navigate to campground detail page
    ↓
Toast notification shows success
```

#### 3️⃣ **Campground List with Map Flow**

```
CampgroundIndex loads
    ↓
Parallel requests:
    1. getCampgrounds({ page, limit })    # Paginated list
    2. getAllCampgroundsForMap()          # All campgrounds for map
    ↓
State updates:
    - campgrounds: current page items
    - allCampgroundsForMap: all items
    - meta: { page, totalPages, hasNext, hasPrev }
    ↓
Render:
    - MapboxMap with cluster view (all campgrounds)
    - Card grid (current page only)
    - Pagination controls
    ↓
User clicks page → URL updates → useEffect triggers
    ↓
Fetch new page → Update campgrounds state
    ↓
Smooth scroll to top
```

#### 4️⃣ **Review Creation Flow**

```
CampgroundShow page loads campground details
    ↓
User sees ReviewForm component
    ↓
User enters rating (1-5 stars) and body text
    ↓
Submit → POST /api/campgrounds/:id/reviews
    ↓
Backend creates review in PostgreSQL
    ↓
Frontend receives new review data
    ↓
handleReviewAdded callback updates local state
    ↓
New review appears immediately (optimistic update)
    ↓
Toast notification shows success
```

---

## 🌐 API Communication

### HTTP Client Configuration

**File:** `src/api/http.js`

```javascript
// Axios instance with base configuration
const http = axios.create({
  baseURL: `${apiBaseUrl}/api`, // Auto-detected based on environment
  withCredentials: true, // Send cookies with requests
});
```

**Environment-based URL resolution:**

| Environment     | Base URL                                  | Description                        |
| --------------- | ----------------------------------------- | ---------------------------------- |
| **Production**  | Same origin                               | Uses current domain (Vercel proxy) |
| **Development** | `VITE_API_URL` or `http://localhost:3000` | Connects to local/remote backend   |

### API Modules

#### Auth API (`src/api/auth.js`)

| Function                 | Method | Endpoint            | Purpose                       |
| ------------------------ | ------ | ------------------- | ----------------------------- |
| `registerUser(userData)` | POST   | `/api/register`     | Create new user account       |
| `loginUser(userData)`    | POST   | `/api/login`        | Authenticate user, set cookie |
| `logoutUser()`           | GET    | `/api/logout`       | Clear session                 |
| `getCurrentUser()`       | GET    | `/api/current-user` | Get logged-in user info       |

#### Campgrounds API (`src/api/campgrounds.js`)

| Function                                | Method | Endpoint                      | Purpose           |
| --------------------------------------- | ------ | ----------------------------- | ----------------- |
| `getCampgrounds({ page, limit, sort })` | GET    | `/api/campgrounds`            | Paginated list    |
| `getAllCampgroundsForMap()`             | GET    | `/api/campgrounds?limit=1000` | All for map       |
| `getCampground(id)`                     | GET    | `/api/campgrounds/:id`        | Single campground |
| `createCampground(formData)`            | POST   | `/api/campgrounds`            | Create new        |
| `updateCampground(id, formData)`        | PUT    | `/api/campgrounds/:id`        | Update existing   |
| `deleteCampground(id)`                  | DELETE | `/api/campgrounds/:id`        | Delete            |
| `deleteCampgroundImage(id, filename)`   | PUT    | `/api/campgrounds/:id`        | Remove image      |

**FormData structure for create/update:**

```javascript
{
  "campground[title]": string,
  "campground[location]": string,
  "campground[price]": number,
  "campground[description]": string,
  "campground[geometry][type]": "Point",
  "campground[geometry][coordinates][0]": longitude,
  "campground[geometry][coordinates][1]": latitude,
  "image": File,                    // Optional, compressed
  "deleteImages": [filename, ...]   // Optional, for updates
}
```

#### Reviews API (`src/api/reviews.js`)

| Function                               | Method | Endpoint                                 | Purpose       |
| -------------------------------------- | ------ | ---------------------------------------- | ------------- |
| `createReview(campgroundId, data)`     | POST   | `/api/campgrounds/:id/reviews`           | Add review    |
| `deleteReview(campgroundId, reviewId)` | DELETE | `/api/campgrounds/:id/reviews/:reviewId` | Remove review |

---

## 🎯 State Management

### Context API Architecture

#### 1️⃣ **AuthContext** (`src/context/AuthContext.jsx`)

**Purpose:** Global authentication state management

**State:**

```javascript
{
  currentUser: {
    id: number,
    username: string,
    email: string
  } | null,
  isLoading: boolean  // Initial session check
}
```

**Methods:**

- `login(user)` - Set current user after successful login
- `logout()` - Clear current user on logout

**Usage:**

```javascript
import { useAuth } from '../context/AuthContext';

const { currentUser, isLoading } = useAuth();

if (isLoading) return <Spinner />;
if (!currentUser) navigate('/login');
```

**Session restoration:**

- On app load, calls `getCurrentUser()` API
- If session cookie valid → user auto-logged in
- If invalid → remains logged out

#### 2️⃣ **FlashContext** (`src/context/FlashContext.jsx`)

**Purpose:** Centralized notification system using React Hot Toast

**Methods:**

- `showFlash(message, type)` - Display notification
  - `type`: `'success'` | `'error'` | default
- `clearFlash()` - Dismiss all notifications

**Usage:**

```javascript
import { useFlash } from '../context/FlashContext';

const { showFlash } = useFlash();

// Success
showFlash('Campground created!', 'success');

// Error
showFlash('Failed to load data', 'error');
```

---

## 🛣️ Routing Architecture

### Route Structure

```javascript
<Routes>
  <Route path="/" element={<Layout />}>
    {/* Public routes */}
    <Route index element={<Home />} />
    <Route path="campgrounds" element={<CampgroundIndex />} />
    <Route path="campgrounds/:id" element={<CampgroundShow />} />
    <Route path="register" element={<Register />} />
    <Route path="login" element={<Login />} />

    {/* Protected routes */}
    <Route
      path="campgrounds/new"
      element={
        <ProtectedRoute>
          <CampgroundNew />
        </ProtectedRoute>
      }
    />
    <Route
      path="campgrounds/:id/edit"
      element={
        <ProtectedRoute>
          <CampgroundEdit />
        </ProtectedRoute>
      }
    />

    {/* 404 */}
    <Route path="*" element={<h1>404 - Not Found</h1>} />
  </Route>
</Routes>
```

### Protected Route Logic

**File:** `src/components/ProtectedRoute.jsx`

```javascript
// Redirects to login if not authenticated
if (isLoading) return <Spinner />;
if (!currentUser) return <Navigate to="/login" replace />;
return children;
```

### Navigation Features

**Breadcrumb preservation:**

- Campground index passes current page: `/campgrounds?page=3`
- Detail page remembers: `/campgrounds/:id?from=3`
- Back button returns to correct page

**URL Query Parameters:**

- `?page=N` - Pagination state
- `?from=N` - Return page reference
- Synced with React Router's `useSearchParams`

---

## 📝 Form Management

### Technology: React Hook Form + Zod

#### Validation Schema Example

**File:** `src/components/CampgroundForm.jsx`

```javascript
const campgroundSchema = z.object({
  title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres'),
  location: z.string().min(3, 'Localização deve ter pelo menos 3 caracteres'),
  price: z.coerce.number().min(0, 'Preço deve ser maior ou igual a zero'),
  description: z
    .string()
    .min(10, 'Descrição deve ter pelo menos 10 caracteres'),
});
```

#### Form Setup

```javascript
const {
  register,
  handleSubmit,
  formState: { errors, isDirty },
} = useForm({
  resolver: zodResolver(campgroundSchema),
  defaultValues: initialData,
});
```

#### Features

1. **Real-time Validation**

   - On blur, on change, or on submit
   - Immediate error feedback below fields

2. **Unsaved Changes Warning**

   - Custom hook: `useUnsavedChanges(isDirty)`
   - Browser prompt if navigating away with unsaved data

3. **Loading States**

   - Submit button shows spinner during async operations
   - Disabled state prevents double-submission

4. **Image Compression**
   - Client-side compression before upload
   - Reduces bandwidth and server load
   - Uses `browser-image-compression` library

---

## 🗺️ Mapbox Integration

### Components

#### MapboxMap Component

**File:** `src/components/MapboxMap.jsx`

**Props:**

```javascript
{
  geoJson: FeatureCollection,     // GeoJSON with campground features
  zoom: number,                   // Initial zoom level
  center: [lng, lat],             // Initial center
  height: number,                 // Map container height (px)
  fitToBounds: boolean,           // Auto-fit to show all markers
  projection: 'globe' | 'mercator', // Map projection
  spinOnLoad: boolean,            // Rotate globe on initial load
  fitMaxZoom: number,             // Max zoom when fitting bounds
  disableInteractionOnMobile: boolean,
  animateOnlyOnce: boolean
}
```

**Features:**

- **Cluster visualization** - Groups nearby campgrounds
- **Popup markers** - Click marker to see campground info
- **Globe projection** - 3D earth view
- **Mobile optimization** - Disables interactions on small screens to prevent scroll issues

**GeoJSON Structure:**

```javascript
{
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [longitude, latitude]
      },
      properties: {
        popUpMarkup: "<h5>Title</h5><p>Location</p>"
      }
    }
  ]
}
```

#### MapboxGeocoder Component

**File:** `src/components/MapboxGeocoder.jsx`

**Purpose:** Location search with autocomplete

**Features:**

- Connects to Mapbox Geocoding API
- Real-time suggestions as user types
- Returns: `{ placeName, coordinates [lng, lat], placeType }`
- Integrated with CampgroundForm

**Data Flow:**

```
User types "New York"
  ↓
Debounced API call to Mapbox Geocoding
  ↓
Dropdown shows suggestions
  ↓
User selects option
  ↓
onLocationSelect({ placeName, coordinates })
  ↓
Form updates geometry data
```

---

## 🎨 UI Components & Patterns

### Loading States

#### Skeleton Screens

| Component        | Usage                                           |
| ---------------- | ----------------------------------------------- |
| `CardSkeleton`   | Loading placeholder for campground cards (grid) |
| `DetailSkeleton` | Loading placeholder for campground detail page  |

**Benefits:**

- Better perceived performance
- Reduces layout shift (CLS)
- Maintains page structure while loading

### Modals

#### ConfirmModal

**File:** `src/components/ui/ConfirmModal.jsx`

**Props:**

```javascript
{
  show: boolean,
  title: string,
  message: string,
  confirmText: string,
  cancelText: string,
  onConfirm: Function,
  onCancel: Function,
  variant: 'danger' | 'warning' | 'primary'
}
```

**Use cases:**

- Delete campground confirmation
- Delete review confirmation
- Any destructive action

### Image Components

#### ImageCarousel

**File:** `src/components/ImageCarousel.jsx`

**Features:**

- Bootstrap 5 carousel
- Multiple image support
- Automatic indicators
- Smooth transitions
- Responsive sizing

---

## ⚡ Performance Optimizations

### 1. **Image Compression**

**Implementation:** `src/utils/imageCompression.js`

```javascript
// Before upload:
const compressedImage = await compressImage(file, {
  maxSizeMB: 1, // Max 1MB
  maxWidthOrHeight: 1920, // Max dimension
  quality: 0.8, // 80% quality
  useWebWorker: true, // Non-blocking
});
```

**Benefits:**

- 50-80% file size reduction
- Faster uploads
- Reduced bandwidth
- Lower Cloudinary storage usage

### 2. **Code Splitting**

- React Router lazy loading (when needed)
- Vite automatic chunk splitting
- Vendor bundle separation

### 3. **Optimized Requests**

**Campground Index:**

```javascript
// Parallel requests for faster load
Promise.all([
  getCampgrounds({ page }), // Current page only
  getAllCampgroundsForMap(), // All for map (cached)
]);
```

### 4. **Memoization**

```javascript
// Expensive GeoJSON computation memoized
const geoJson = React.useMemo(
  () => ({ type: "FeatureCollection", features: [...] }),
  [allCampgroundsForMap]
);
```

### 5. **Debouncing**

- Search inputs
- Live timestamp updates (every 60s, not every render)

---

## 🔐 Security Features

### 1. **Cookie-based Authentication**

- HttpOnly cookies (XSS protection)
- Secure flag in production (HTTPS only)
- SameSite=None for cross-domain (Vercel + Render)
- Credentials included in all requests: `withCredentials: true`

### 2. **Protected Routes**

- Server-side authorization check
- Frontend guard via `ProtectedRoute` component
- Redirects to login if not authenticated

### 3. **CORS Configuration**

- Backend validates origin against whitelist
- `FRONTEND_URL` environment variable
- Credentials allowed only from trusted origins

### 4. **Input Validation**

- Client-side: Zod schemas (UX)
- Server-side: Joi schemas (security)
- Never trust client data alone

### 5. **CSP Headers**

- Configured in backend
- Allows only whitelisted scripts/styles
- Prevents XSS attacks

---

## 🚀 Development

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm 9+ or pnpm/yarn
- Backend API running (see root README)

### Environment Variables

Create `client/.env.local`:

```bash
# Backend API URL
VITE_API_URL=http://localhost:3000/api

# Mapbox token (public token starting with pk.)
VITE_MAPBOX_TOKEN=pk.eyJ1IjoieW91ci11c2VybmFtZSIsImEiOiJjbGV4YW1wbGUifQ...
```

**⚠️ Important:**

- All Vite env vars must start with `VITE_`
- Never commit `.env.local` to Git
- Use `.env.local` for development, environment variables UI for production

### Install Dependencies

```bash
cd client
npm install
```

### Development Server

```bash
npm run dev
```

- Opens: http://localhost:5173
- Hot Module Replacement (HMR) enabled
- Proxies `/api/*` to backend (configured in `vite.config.js`)

### Build for Production

```bash
npm run build
```

- Output: `client/dist/`
- Optimized bundle with code splitting
- Minified assets with cache busting

### Preview Production Build

```bash
npm run preview
```

- Serves production build locally
- Tests optimizations before deployment

### Linting

```bash
npm run lint
```

- ESLint with React plugin
- Checks for code quality issues
- Run before committing

---

## 📦 Deployment

### Vercel (Recommended)

**Automatic deployment configured:**

1. **Push to `main` branch**
2. Vercel detects changes
3. Builds: `npm run build` in `client/` directory
4. Deploys to CDN globally

**Settings:**

- Framework: Vite
- Root Directory: `client`
- Build Command: `npm run build`
- Output Directory: `dist`

**Environment Variables:**

```bash
VITE_API_URL=https://your-backend.onrender.com/api
VITE_MAPBOX_TOKEN=pk.your_token
```

See [DEPLOYMENT.md](../DEPLOYMENT.md) for full deployment guide.

---

## 🧪 Testing Strategy

### Manual Testing Checklist

#### Authentication

- [ ] Register new user
- [ ] Login with valid credentials
- [ ] Login fails with invalid credentials
- [ ] Logout clears session
- [ ] Protected routes redirect to login
- [ ] Session persists on page refresh

#### Campgrounds

- [ ] Browse paginated list
- [ ] View campground details
- [ ] Create new campground (auth required)
- [ ] Edit own campground
- [ ] Delete own campground
- [ ] Cannot edit/delete others' campgrounds
- [ ] Map shows all campgrounds with clusters
- [ ] Images upload successfully
- [ ] Image compression works (check network tab)

#### Reviews

- [ ] Add review to campground
- [ ] Star rating displays correctly
- [ ] Delete own review
- [ ] Cannot delete others' reviews

#### Forms

- [ ] Validation errors show on submit
- [ ] Real-time validation on blur
- [ ] Unsaved changes warning works
- [ ] Submit button shows loading state
- [ ] Location geocoder suggests addresses

#### Responsive Design

- [ ] Mobile navigation works
- [ ] Cards stack on mobile
- [ ] Map interactions disabled on mobile (optional)
- [ ] Forms usable on small screens

### Browser Compatibility

Tested and supported:

- ✅ Chrome 120+
- ✅ Firefox 120+
- ✅ Safari 17+
- ✅ Edge 120+

---

## 🐛 Troubleshooting

### Common Issues

#### 1. **"Cannot connect to backend"**

**Symptoms:** Network errors, 404 on API calls

**Solutions:**

- Check backend is running: `http://localhost:3000/api/campgrounds`
- Verify `VITE_API_URL` in `.env.local`
- Check CORS settings on backend
- Ensure `FRONTEND_URL` on backend matches development origin

#### 2. **"Maps not displaying" / Blank map**

**Symptoms:** White box instead of map, console errors

**Solutions:**

- Check `VITE_MAPBOX_TOKEN` is set and valid
- Token must start with `pk.` (public token)
- Verify token on https://account.mapbox.com/access-tokens/
- Check browser console for Mapbox errors
- Ensure token has required scopes: `styles:read`, `fonts:read`

#### 3. **"Login successful but immediately logs out"**

**Symptoms:** Redirects back to login after successful authentication

**Solutions:**

- Check backend `FRONTEND_URL` matches frontend origin exactly
- Verify backend session config has correct cookie settings:
  - `secure: true` in production
  - `sameSite: 'none'` in production
  - `proxy: true` in production
- Check browser allows third-party cookies
- Inspect cookies in DevTools (should see `yelpcamp.sid` on backend domain)

#### 4. **"Image upload fails"**

**Symptoms:** Error on campground creation/update

**Solutions:**

- Check file size < 10MB (Cloudinary default limit)
- Verify image compression is working (check console logs)
- Check backend Cloudinary credentials
- Inspect network tab for specific error message

#### 5. **"Vite dev server crashes" / Port conflicts**

**Solutions:**

```bash
# Kill process on port 5173
npx kill-port 5173

# Or specify different port
vite --port 5174
```

#### 6. **"React Hook Form errors don't show"**

**Solutions:**

- Check `errors` object in component state
- Verify Zod schema is properly defined
- Ensure `zodResolver` is imported and used
- Check field names match schema keys

---

## 📚 Additional Resources

### Documentation

- **React 19**: https://react.dev/
- **Vite 7**: https://vite.dev/
- **React Router**: https://reactrouter.com/
- **React Hook Form**: https://react-hook-form.com/
- **Zod**: https://zod.dev/
- **Mapbox GL JS**: https://docs.mapbox.com/mapbox-gl-js/
- **Bootstrap 5**: https://getbootstrap.com/docs/5.3/
- **Axios**: https://axios-http.com/

### Project Documentation

- [Root README](../README.md) - Full project overview
- [Architecture](../ARCHITECTURE.md) - Technical architecture
- [Deployment Guide](../DEPLOYMENT.md) - Production deployment
- [Backend API](../routes/) - API endpoints documentation

---

## 🤝 Contributing

### Code Style

- Use functional components with hooks
- Prefer arrow functions
- Use `const` over `let` when possible
- Destructure props and state
- Keep components focused and small
- Extract reusable logic to custom hooks

### Component Naming

- PascalCase for components: `CampgroundForm.jsx`
- camelCase for utilities: `imageCompression.js`
- Descriptive names: `handleSubmit`, not `handle`

### Commit Messages

```
feat: add image compression to campground form
fix: resolve pagination state on browser back button
refactor: extract map logic to custom hook
docs: update API documentation
```

---

## 📄 License

ISC - See [LICENSE](../LICENSE) for details

---

**Built with ❤️ by Jose Paulo Archetti Conrado**
