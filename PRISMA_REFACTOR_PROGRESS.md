# Prisma/PostgreSQL Refactor Progress

This document tracks the step-by-step refactor from MongoDB/Mongoose to Prisma/PostgreSQL for each model/controller.

## User Model/Controller

### Old (Mongoose)

- Used Mongoose schema and passport-local-mongoose for authentication.
- User registration and login handled with `User.register()` and `User.authenticate()`.
- Passwords hashed automatically by the plugin.

### New (Prisma)

- Created `controllers/users.prisma.js` using Prisma Client and bcrypt.
- Registration:
  - Validates strong password (min 8 chars, upper/lower/number).
  - Checks for existing user by email or username.
  - Hashes password with bcrypt.
  - Creates user in PostgreSQL via Prisma.
- Login:
  - Looks up user by username.
  - Compares password with bcrypt.
- Logout:
  - Placeholder for session destroy logic.

### Next Steps

- Update Express routes to use the new Prisma-based controller.
- Repeat the process for Campground and Review models/controllers.
- Document each refactor step here for learning and traceability.

## 2025-12-15: User Routes Refactor

- Updated `routes/users.js` to use the new Prisma-based controller (`controllers/users.prisma.js`).
- Removed Mongoose/Passport dependencies for register, login, and logout.
- Now all user registration and authentication is handled via Prisma and bcrypt.

**Next:** Test the new endpoints and proceed to refactor Campground and Review models/controllers.

## 2025-12-15: Campground Model/Controller Refactor

- Extracted the original Mongoose Campground schema and controller logic.
- Created `controllers/campgrounds.prisma.js` using Prisma Client for all CRUD operations.
- Handles:
  - Listing campgrounds with pagination and relations (author, reviews, images)
  - Creating campgrounds (with Mapbox geocoding and image upload)
  - Showing a single campground (with nested relations)
  - Updating campgrounds (including image management and geocoding)
  - Deleting campgrounds
- All MongoDB/Mongoose logic replaced with Prisma/PostgreSQL queries.

**Next:** Update routes to use the new Prisma-based Campground controller, then test endpoints.

## 2025-12-15: Campground Routes Refactor

- Updated `routes/campgrounds.js` to use the new Prisma-based controller (`controllers/campgrounds.prisma.js`).
- All Campground CRUD operations now handled via Prisma/PostgreSQL.
- Mongoose model/controller is no longer used for campgrounds.

**Next:** Test the new endpoints and proceed to refactor the Review model/controller.

---

_Last updated: 2025-12-15_
