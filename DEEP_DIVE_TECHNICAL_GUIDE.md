# 🎓 Deep Dive: Technical Architecture Guide

## Overview

This document provides an in-depth technical analysis of three critical aspects of the JosePauloCamp migration:

1. **Docker Multi-Stage Builds** - Optimization and architecture
2. **Prisma Architecture** - Modern ORM design patterns
3. **MongoDB → PostgreSQL Schema Differences** - Data modeling paradigm shift

---

## Table of Contents

- [Part 1: Docker Multi-Stage Builds](#part-1-docker-multi-stage-builds)
- [Part 2: Prisma Architecture](#part-2-prisma-architecture)
- [Part 3: MongoDB → PostgreSQL Schema Differences](#part-3-mongodb--postgresql-schema-differences)

---

# Part 1: Docker Multi-Stage Builds

## What Are Multi-Stage Builds?

Multi-stage builds allow you to use multiple `FROM` statements in a single Dockerfile. Each `FROM` instruction starts a new stage, and you can selectively copy artifacts from one stage to another, leaving behind everything you don't need.

### The Problem They Solve

**Traditional Dockerfile (Single Stage):**

```dockerfile
FROM node:20
WORKDIR /app

# Copy everything
COPY . .

# Install ALL dependencies (dev + prod)
RUN npm install

# Build artifacts
RUN npm run build

# Result: HUGE image with:
# - Source code
# - Dev dependencies
# - Build tools
# - Test files
# - Documentation
# - node_modules (including devDependencies)
```

**Problems:**

- Image size: 800MB - 1.5GB
- Security vulnerabilities in dev dependencies
- Slower deployment and startup
- Attack surface increased

**Multi-Stage Solution:**

```dockerfile
# Stage 1: Build
FROM node:20 AS builder
COPY . .
RUN npm install && npm run build

# Stage 2: Production
FROM node:20-alpine AS production
COPY --from=builder /app/dist ./dist
RUN npm install --production

# Result: Small image with:
# - Only production code
# - Only production dependencies
# - No build tools
```

**Benefits:**

- Image size: 150-250MB (75% reduction!)
- Only production dependencies
- Faster deployments
- Reduced security risk

---

## Our Multi-Stage Dockerfile Architecture

### Backend Dockerfile Analysis

```dockerfile
# ============================================
# STAGE 1: Base Image
# ============================================
FROM node:20-alpine AS base

# Why Alpine?
# - Alpine Linux is minimal (5MB base)
# - node:20-alpine = 120MB vs node:20 = 1GB
# - Contains only essential packages
# - Security-focused minimal attack surface

# ============================================
# STAGE 2: Dependencies (deps)
# ============================================
FROM base AS deps
WORKDIR /app

# Copy ONLY package files first
COPY package*.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Why separate deps stage?
# 1. Docker layer caching optimization
# 2. Dependencies change less than source code
# 3. Faster rebuilds when only code changes
```

**Layer Caching Explained:**

```
Change source code only (app.js):
├── Base image (cached) ✅
├── deps stage (cached) ✅  ← No rebuild needed!
├── Copy new source code
└── Rebuild only changed layers

Change package.json:
├── Base image (cached) ✅
├── deps stage (rebuild) ⚠️  ← Must reinstall
├── Copy source code
└── Complete rebuild
```

**Cache Optimization:**

```dockerfile
# ❌ Poor caching (changes to ANY file invalidate npm install)
COPY . .
RUN npm install

# ✅ Optimal caching (only package.json changes trigger install)
COPY package*.json ./
RUN npm ci
COPY . .
```

### Stage 3: Development Image

```dockerfile
# ============================================
# STAGE 3: Development
# ============================================
FROM base AS development
WORKDIR /app

# Copy dependencies from deps stage (not from local)
COPY --from=deps /app/node_modules ./node_modules

# Copy all source code
COPY . .

# Set dummy DATABASE_URL for Prisma generation
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"

# Generate Prisma Client (type-safe database access)
RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "run", "dev"]
```

**Key Features:**

1. **Hot-Reload Support:**

   ```yaml
   # docker-compose.yml
   volumes:
     - ./:/app # Source code changes sync
     - /app/node_modules # But keep container's node_modules
     - /app/generated # Keep generated Prisma client
   ```

2. **Development Tools Included:**

   - Full node_modules (with devDependencies)
   - Source maps
   - Debugging capabilities
   - nodemon for auto-restart

3. **Size Comparison:**
   ```
   Development Image: ~350MB
   ├── Base Alpine: 120MB
   ├── All Dependencies: 150MB
   ├── Source Code: 50MB
   └── Generated Prisma: 30MB
   ```

### Stage 4: Builder (Production Build)

```dockerfile
# ============================================
# STAGE 4: Builder (Production Build)
# ============================================
FROM base AS builder
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy source
COPY . .

# Set dummy URL for build
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"

# Generate optimized Prisma Client
RUN npx prisma generate

# Optional: Run build steps
# RUN npm run build  # If you have TypeScript or bundling

# Optional: Run tests
# RUN npm test
```

**Purpose:**

- Prepare production-ready artifacts
- Run build/compilation steps
- Validate code before production stage
- Can run tests here (fail fast)

### Stage 5: Production Image

```dockerfile
# ============================================
# STAGE 5: Production (Final Image)
# ============================================
FROM base AS production
WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy ONLY package files
COPY package*.json ./

# Install ONLY production dependencies
RUN npm ci --production --legacy-peer-deps

# Copy built artifacts from builder
COPY --from=builder /app .

# Don't copy node_modules from builder (we just installed prod deps)
# Copy generated Prisma client
COPY --from=builder /app/generated ./generated

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

EXPOSE 3000

CMD ["node", "app.js"]
```

**Security Features:**

1. **Non-Root User:**

   ```dockerfile
   # Why non-root?
   # - Container compromise doesn't give root access
   # - Follows principle of least privilege
   # - Required by many enterprise security policies

   RUN adduser -S nodejs -u 1001
   USER nodejs

   # Now all processes run as 'nodejs' user, not root
   ```

2. **Minimal Dependencies:**

   ```bash
   # Only production dependencies
   npm ci --production

   # Result:
   # - No testing frameworks
   # - No build tools
   # - No linters
   # - Smaller attack surface
   ```

3. **Alpine Base:**
   ```
   Alpine advantages:
   ├── Minimal packages (less vulnerabilities)
   ├── musl libc instead of glibc (lighter)
   ├── apk package manager (simple)
   └── Security-focused distribution
   ```

**Size Comparison:**

```
Production Image: ~180MB (49% smaller than dev!)
├── Base Alpine: 120MB
├── Prod Dependencies ONLY: 40MB
├── Source Code: 15MB
└── Generated Prisma: 5MB

vs Development: ~350MB
```

---

## Frontend Multi-Stage Dockerfile

```dockerfile
# ============================================
# STAGE 1: Base
# ============================================
FROM node:20-alpine AS base

# ============================================
# STAGE 2: Dependencies
# ============================================
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ============================================
# STAGE 3: Development (with Vite HMR)
# ============================================
FROM base AS development
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

EXPOSE 5173

# Vite dev server with hot module replacement
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
```

**Why `--host 0.0.0.0`?**

```
Default: Vite binds to localhost (127.0.0.1)
├── Inside container: localhost = container's localhost
├── Outside container: Can't access ❌
└── Network isolation issue

With --host 0.0.0.0:
├── Binds to all network interfaces
├── Docker can forward port 5173
└── Accessible from host machine ✅
```

### Production Frontend Build

```dockerfile
# ============================================
# STAGE 4: Builder (Static Site Generation)
# ============================================
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build static files with Vite
RUN npm run build
# Output: /app/dist (optimized HTML, CSS, JS)

# ============================================
# STAGE 5: Production (Nginx)
# ============================================
FROM nginx:alpine AS production

# Copy built static files to nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

**Why Nginx for Frontend?**

1. **Lightweight:**

   ```
   Node server (for React): 350MB
   Nginx (static files): 25MB

   Savings: 93% reduction!
   ```

2. **Performance:**

   ```
   Node.js serving static files:
   ├── Event loop overhead
   ├── JavaScript parsing
   └── ~1000 req/sec

   Nginx serving static files:
   ├── Optimized C code
   ├── Direct file system access
   └── ~10,000 req/sec

   10x faster! 🚀
   ```

3. **Features:**
   ```nginx
   # nginx.conf
   server {
       listen 80;

       # Gzip compression
       gzip on;
       gzip_types text/plain text/css application/json application/javascript;

       # Browser caching
       location /assets/ {
           expires 1y;
           add_header Cache-Control "public, immutable";
       }

       # SPA routing (fallback to index.html)
       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```

---

## Multi-Stage Build Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Dockerfile Stages                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐                                            │
│  │ Base Stage  │  node:20-alpine (120MB)                    │
│  └──────┬──────┘                                            │
│         │                                                    │
│         ├────────────┬────────────┬────────────┐            │
│         ↓            ↓            ↓            ↓            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   deps   │  │   deps   │  │   deps   │  │   deps   │   │
│  │ npm ci   │  │ (cached) │  │ (cached) │  │ (cached) │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│       │             │             │             │           │
│       ↓             ↓             ↓             ↓           │
│  ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐    │
│  │   dev   │   │ builder │   │  prod   │   │  nginx  │    │
│  │ +source │   │ +build  │   │ minimal │   │ static  │    │
│  │ (350MB) │   │ (400MB) │   │ (180MB) │   │  (25MB) │    │
│  └─────────┘   └─────────┘   └─────────┘   └─────────┘    │
│                                                              │
│  Target Selection:                                          │
│  └─ docker build --target development → 350MB              │
│  └─ docker build --target production  → 180MB              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Selective Building:**

```bash
# Development only
docker build --target development -t myapp:dev .

# Production only
docker build --target production -t myapp:prod .

# Default (uses last stage)
docker build -t myapp .
```

---

## Advanced Multi-Stage Patterns

### Pattern 1: Parallel Builds

```dockerfile
# Build backend and frontend in parallel
FROM node:20 AS backend-builder
WORKDIR /backend
COPY backend/ .
RUN npm ci && npm run build

FROM node:20 AS frontend-builder
WORKDIR /frontend
COPY frontend/ .
RUN npm ci && npm run build

# Combine in final stage
FROM nginx:alpine AS production
COPY --from=backend-builder /backend/dist /app/api
COPY --from=frontend-builder /frontend/dist /usr/share/nginx/html
```

### Pattern 2: Testing Stage

```dockerfile
FROM base AS deps
RUN npm ci

FROM deps AS test
COPY . .
RUN npm test
RUN npm run lint
# If tests fail, build stops here!

FROM deps AS production
COPY . .
# Tests passed, continue with production build
```

**CI/CD Integration:**

```yaml
# GitHub Actions
- name: Run tests in Docker
  run: docker build --target test .

- name: Build production if tests pass
  run: docker build --target production -t myapp:latest .
```

### Pattern 3: Build Arguments

```dockerfile
# Flexible builds with ARG
ARG NODE_VERSION=20
FROM node:${NODE_VERSION}-alpine AS base

ARG BUILD_ENV=production
ENV NODE_ENV=${BUILD_ENV}

FROM base AS builder
ARG ENABLE_TESTS=false
RUN if [ "$ENABLE_TESTS" = "true" ]; then npm test; fi
```

**Usage:**

```bash
# Different Node versions
docker build --build-arg NODE_VERSION=18 .

# Enable tests
docker build --build-arg ENABLE_TESTS=true .
```

---

## Best Practices for Multi-Stage Builds

### 1. Layer Ordering (Most to Least Likely to Change)

```dockerfile
# ✅ Optimal ordering
FROM node:20-alpine
WORKDIR /app

# 1. System packages (rarely change)
RUN apk add --no-cache git

# 2. Package files (change occasionally)
COPY package*.json ./
RUN npm ci

# 3. Source code (changes frequently)
COPY . .

# Result: When code changes, only last layers rebuild
```

```dockerfile
# ❌ Poor ordering
FROM node:20-alpine
WORKDIR /app

# 1. Source code copied first
COPY . .  # Changes frequently

# 2. Then install deps
RUN npm install  # Runs every time code changes!

# Result: npm install runs on EVERY code change (slow!)
```

### 2. .dockerignore File

```
# .dockerignore (like .gitignore for Docker)
node_modules
npm-debug.log
dist
.env
.git
.vscode
*.md
test/
coverage/
.github/
```

**Impact:**

```
Without .dockerignore:
COPY . . → Copies 500MB (includes node_modules)

With .dockerignore:
COPY . . → Copies 50MB (only source code)

Build time: 60s → 5s (12x faster!)
```

### 3. Minimize Layers

```dockerfile
# ❌ Many layers (inefficient)
RUN npm install package1
RUN npm install package2
RUN npm install package3

# ✅ Single layer (efficient)
RUN npm install package1 package2 package3

# ✅ Even better (cleanup in same layer)
RUN apk add --no-cache build-dependencies && \
    npm ci && \
    apk del build-dependencies
```

**Why?**
Each RUN creates a new layer in the image. Fewer layers = smaller image size.

### 4. Use Specific Tags

```dockerfile
# ❌ Latest tag (unpredictable)
FROM node:latest

# ❌ Major version only (can break)
FROM node:20

# ✅ Specific version (reproducible)
FROM node:20.10.0-alpine3.19

# ✅ Digest (immutable)
FROM node:20-alpine@sha256:643e7036aa985317ebfee460005e322aa550c6b6883000d01daefb58689a58e2
```

---

# Part 2: Prisma Architecture

## What is Prisma?

Prisma is a **next-generation ORM** (Object-Relational Mapping) that provides:

- Type-safe database access
- Auto-generated queries
- Database migrations
- Visual database browser (Prisma Studio)

### Traditional ORM vs Prisma

**Traditional ORM (Mongoose/Sequelize):**

```javascript
// ❌ No type safety
const user = await User.findOne({ email: 'test@example.com' });
console.log(user.name); // Runtime error if 'name' doesn't exist
console.log(user.invalidField); // No error until runtime!

// ❌ Manual typing required
interface IUser {
  name: string;
  email: string;
}
```

**Prisma:**

```typescript
// ✅ Full TypeScript type safety
const user = await prisma.user.findUnique({
  where: { email: 'test@example.com' },
});

console.log(user.name); // ✅ TypeScript knows this exists
console.log(user.invalidField); // ❌ TypeScript error at compile time!

// ✅ Types automatically generated from schema
```

---

## Prisma Architecture Components

```
┌──────────────────────────────────────────────────────────┐
│                   Prisma Ecosystem                        │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────────────────────────────────────────────┐    │
│  │  1. Prisma Schema (schema.prisma)               │    │
│  │     - Data model definition                     │    │
│  │     - Database configuration                    │    │
│  │     - Generator configuration                   │    │
│  └─────────────────┬───────────────────────────────┘    │
│                    │                                      │
│                    ↓                                      │
│  ┌─────────────────────────────────────────────────┐    │
│  │  2. Prisma CLI                                  │    │
│  │     - npx prisma generate (creates client)     │    │
│  │     - npx prisma migrate (manages DB schema)   │    │
│  │     - npx prisma studio (visual editor)        │    │
│  └─────────────────┬───────────────────────────────┘    │
│                    │                                      │
│                    ↓                                      │
│  ┌─────────────────────────────────────────────────┐    │
│  │  3. Prisma Client                               │    │
│  │     - Auto-generated query builder              │    │
│  │     - Type-safe database access                 │    │
│  │     - Runtime query engine                      │    │
│  └─────────────────┬───────────────────────────────┘    │
│                    │                                      │
│                    ↓                                      │
│  ┌─────────────────────────────────────────────────┐    │
│  │  4. Database                                    │    │
│  │     - PostgreSQL, MySQL, SQLite, etc.          │    │
│  │     - Actual data storage                      │    │
│  └─────────────────────────────────────────────────┘    │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

---

## Component 1: Prisma Schema

### Our schema.prisma File

```prisma
// ============================================
// Generator Configuration
// ============================================
generator client {
  provider   = "prisma-client-js"
  output     = "../generated/prisma"
  engineType = "library"
}

// Why custom output?
// - Keeps generated code separate from source
// - Easier to gitignore
// - Clearer project structure

// Why library engineType?
// - Faster startup (no binary download)
// - Better for serverless
// - Prisma 7 requirement

// ============================================
// Datasource Configuration
// ============================================
datasource db {
  provider = "postgresql"
  // Note: URL is now in prisma.config.ts (Prisma 7)
}

// ============================================
// Data Models
// ============================================
model User {
  id        Int      @id @default(autoincrement())
  username  String   @unique
  email     String   @unique
  password  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  campgrounds Campground[]  // One user has many campgrounds
  reviews     Review[]      // One user has many reviews

  @@index([email])
  @@index([username])
}

model Campground {
  id          Int      @id @default(autoincrement())
  title       String
  price       Float
  description String
  location    String

  // Geometry for maps (JSON field)
  geometry    Json?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Foreign Keys
  authorId    Int

  // Relations
  author      User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  images      Image[]
  reviews     Review[]

  @@index([authorId])
  @@index([createdAt])
}

model Image {
  id           Int        @id @default(autoincrement())
  url          String
  filename     String
  campgroundId Int

  campground   Campground @relation(fields: [campgroundId], references: [id], onDelete: Cascade)

  @@index([campgroundId])
}

model Review {
  id           Int        @id @default(autoincrement())
  body         String
  rating       Int
  createdAt    DateTime   @default(now())

  // Foreign Keys
  authorId     Int
  campgroundId Int

  // Relations
  author       User       @relation(fields: [authorId], references: [id], onDelete: Cascade)
  campground   Campground @relation(fields: [campgroundId], references: [id], onDelete: Cascade)

  @@index([authorId])
  @@index([campgroundId])
  @@index([createdAt])
}
```

### Schema Attributes Explained

**Field Types:**

```prisma
model Example {
  // Scalar types
  id        Int       // Integer
  name      String    // Variable length text
  price     Float     // Decimal number
  active    Boolean   // true/false
  data      Json      // JSON object
  createdAt DateTime  // Timestamp

  // Optional fields
  nickname  String?   // Question mark = nullable

  // Arrays
  tags      String[]  // Array of strings
}
```

**Attributes:**

```prisma
model User {
  id       Int    @id @default(autoincrement())
  //             └─────┬─────┘ └──────┬──────┘
  //              Primary Key    Auto-increment

  email    String @unique
  //              └──┬──┘
  //            Unique constraint

  createdAt DateTime @default(now())
  //                 └────┬────┘
  //                 Default value: current timestamp

  updatedAt DateTime @updatedAt
  //                 └───┬───┘
  //                 Auto-update on record change

  @@index([email])
  // └────┬────┘
  //   Database index for faster queries

  @@unique([email, username])
  //   Composite unique constraint
}
```

**Relations:**

```prisma
model User {
  id          Int          @id @default(autoincrement())
  campgrounds Campground[] // One-to-Many (User has many Campgrounds)
}

model Campground {
  id       Int  @id @default(autoincrement())
  authorId Int  // Foreign key

  author   User @relation(fields: [authorId], references: [id], onDelete: Cascade)
  //       └──┬──┘        └────────┬────────┘  └─────────┬─────────┘ └───────┬───────┘
  //       Type        Foreign Key Field    References    Delete Behavior
}
```

**Cascade Delete:**

```prisma
author User @relation(fields: [authorId], references: [id], onDelete: Cascade)
//                                                          └──────┬──────┘
//                                                   If User deleted → Delete all their Campgrounds

// Options:
// - Cascade: Delete related records
// - SetNull: Set foreign key to NULL
// - Restrict: Prevent deletion if related records exist
// - NoAction: Do nothing (database default)
```

---

## Component 2: Prisma CLI

### Essential Commands

```bash
# ============================================
# Generate Prisma Client
# ============================================
npx prisma generate

# What it does:
# 1. Reads schema.prisma
# 2. Generates TypeScript types
# 3. Creates query builder code
# 4. Outputs to: generated/prisma/

# When to run:
# - After schema changes
# - After git pull (if schema changed)
# - During Docker build

# ============================================
# Database Migrations
# ============================================
npx prisma migrate dev --name add_user_table

# What it does:
# 1. Compares schema to current database
# 2. Generates SQL migration file
# 3. Applies migration to database
# 4. Runs prisma generate automatically

# Output: prisma/migrations/20251216_add_user_table/migration.sql

npx prisma migrate deploy

# What it does:
# 1. Applies pending migrations to database
# 2. Used in production/Docker
# 3. Doesn't generate new migrations

# ============================================
# Database Introspection
# ============================================
npx prisma db pull

# What it does:
# 1. Reads existing database schema
# 2. Generates schema.prisma from database
# 3. Useful for existing databases

# ============================================
# Prisma Studio (Visual Editor)
# ============================================
npx prisma studio

# What it does:
# 1. Opens web interface at localhost:5555
# 2. View/edit database records visually
# 3. Like phpMyAdmin for Prisma

# ============================================
# Database Reset (Development Only!)
# ============================================
npx prisma migrate reset

# What it does:
# 1. Drops entire database
# 2. Creates new database
# 3. Applies all migrations
# 4. Runs seed script (if exists)

# ⚠️ DANGER: Deletes all data!
```

---

## Component 3: Prisma Client

### Generated Client Structure

```typescript
// After running: npx prisma generate

// Generated at: generated/prisma/index.d.ts
export class PrismaClient {
  user: UserDelegate;
  campground: CampgroundDelegate;
  image: ImageDelegate;
  review: ReviewDelegate;

  // Connection management
  $connect(): Promise<void>;
  $disconnect(): Promise<void>;

  // Raw queries
  $queryRaw<T>(query: string): Promise<T>;
  $executeRaw(query: string): Promise<number>;

  // Transactions
  $transaction<T>(callback: (tx: PrismaClient) => Promise<T>): Promise<T>;
}

// Each model gets a delegate with methods:
interface UserDelegate {
  findUnique(args): Promise<User | null>;
  findMany(args): Promise<User[]>;
  create(args): Promise<User>;
  update(args): Promise<User>;
  delete(args): Promise<User>;
  count(args): Promise<number>;
  // ... and many more
}
```

### Type-Safe Queries

**Example: Creating a Campground**

```typescript
// Prisma provides full type safety
const campground = await prisma.campground.create({
  data: {
    title: 'Yosemite Valley',
    price: 50.0,
    description: 'Beautiful valley camping',
    location: 'California',
    geometry: {
      type: 'Point',
      coordinates: [-119.5383, 37.7456],
    },
    authorId: 1,
    images: {
      create: [
        { url: 'https://...', filename: 'image1.jpg' },
        { url: 'https://...', filename: 'image2.jpg' },
      ],
    },
  },
  include: {
    author: true, // Include author data
    images: true, // Include images
  },
});

// TypeScript knows the shape:
campground.title; // ✅ string
campground.price; // ✅ number
campground.author.username; // ✅ string
campground.invalidField; // ❌ TypeScript error!
```

**Example: Complex Query with Relations**

```typescript
// Find campgrounds with filters, pagination, and nested relations
const campgrounds = await prisma.campground.findMany({
  where: {
    price: {
      lte: 100, // Less than or equal to $100
    },
    reviews: {
      some: {
        rating: {
          gte: 4, // At least one review with rating >= 4
        },
      },
    },
  },
  include: {
    author: {
      select: {
        username: true,
        email: true,
        // password excluded for security
      },
    },
    images: true,
    reviews: {
      include: {
        author: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5, // Only latest 5 reviews
    },
  },
  orderBy: {
    createdAt: 'desc',
  },
  skip: 0,
  take: 12, // Pagination: 12 per page
});
```

**Generated SQL (what Prisma creates):**

```sql
SELECT
  c.*,
  u.username, u.email,
  i.*,
  r.*, r_author.*
FROM "Campground" c
LEFT JOIN "User" u ON c."authorId" = u.id
LEFT JOIN "Image" i ON i."campgroundId" = c.id
LEFT JOIN (
  SELECT * FROM "Review"
  ORDER BY "createdAt" DESC
  LIMIT 5
) r ON r."campgroundId" = c.id
LEFT JOIN "User" r_author ON r."authorId" = r_author.id
WHERE c.price <= 100
  AND EXISTS (
    SELECT 1 FROM "Review"
    WHERE "campgroundId" = c.id
    AND rating >= 4
  )
ORDER BY c."createdAt" DESC
LIMIT 12 OFFSET 0;
```

---

## Prisma 7 Architecture Changes

### Before Prisma 7 (Direct Connection)

```typescript
// lib/prisma.js (Old)
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Direct connection to database
// Prisma manages connection pool internally
```

### Prisma 7 (With Driver Adapter)

```typescript
// lib/prisma.js (New)
const { PrismaClient } = require('../generated/prisma');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

// 1. Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// 2. Create Prisma adapter
const adapter = new PrismaPg(pool);

// 3. Pass adapter to Prisma Client
const prisma = new PrismaClient({ adapter });

module.exports = { prisma };
```

**Why Driver Adapters?**

```
┌─────────────────────────────────────────────────┐
│  Before Prisma 7: Monolithic                    │
├─────────────────────────────────────────────────┤
│                                                  │
│  Prisma Client                                  │
│  ├── Query Engine (built-in)                   │
│  ├── Connection Management (built-in)          │
│  └── Direct Database Connection                │
│                                                  │
│  Problem: Inflexible, can't use custom drivers │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  Prisma 7: Modular with Adapters               │
├─────────────────────────────────────────────────┤
│                                                  │
│  Prisma Client                                  │
│  └── Uses Driver Adapter                       │
│        └── PostgreSQL Driver (pg)              │
│              └── Connection Pool               │
│                    └── Database                │
│                                                  │
│  Benefits:                                      │
│  ✅ Custom connection pools                    │
│  ✅ Better serverless support                  │
│  ✅ Fine-grained control                       │
│  ✅ Can use optimized drivers                  │
└─────────────────────────────────────────────────┘
```

**Configuration Split:**

```typescript
// prisma/schema.prisma (No URL!)
datasource db {
  provider = "postgresql"
  // URL removed in Prisma 7
}

// prisma.config.ts (Separate configuration)
export default {
  datasource: {
    url: env("DATABASE_URL")
  }
};

// Why split?
// - Security: Connection strings not in schema
// - Flexibility: Different configs per environment
// - Better secrets management
```

---

## Prisma Performance Optimizations

### 1. Connection Pooling

```typescript
// lib/prisma.js
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum connections
  min: 5, // Minimum idle connections
  idleTimeoutMillis: 30000, // Close idle after 30s
  connectionTimeoutMillis: 2000, // Wait 2s for connection
});

// Why important?
// - PostgreSQL has limited connections
// - Opening connections is expensive
// - Pool reuses existing connections
// - Prevents "too many connections" errors
```

**Connection Limit Analysis:**

```
PostgreSQL Default: 100 connections
├── Reserved for admin: 10
├── Available for apps: 90

If 3 backend instances × 20 connections = 60 ✅
If 10 backend instances × 20 connections = 200 ❌ Exceeds limit!

Solution: Adjust pool size or upgrade database
```

### 2. Query Optimization

```typescript
// ❌ N+1 Query Problem
const campgrounds = await prisma.campground.findMany();
for (const campground of campgrounds) {
  const author = await prisma.user.findUnique({
    where: { id: campground.authorId },
  });
  // Runs 1 + N queries (1 for campgrounds, N for authors)
}

// ✅ Use include (Single Query)
const campgrounds = await prisma.campground.findMany({
  include: { author: true },
});
// Runs 1 query with JOIN
```

### 3. Selective Field Loading

```typescript
// ❌ Load all fields (inefficient)
const user = await prisma.user.findUnique({
  where: { id: 1 },
});
// Returns: id, username, email, password, createdAt, updatedAt

// ✅ Select only needed fields
const user = await prisma.user.findUnique({
  where: { id: 1 },
  select: {
    id: true,
    username: true,
    email: true,
    // password excluded!
  },
});
// Returns: id, username, email (smaller payload)
```

### 4. Transactions

```typescript
// ❌ Without transaction (can fail partially)
await prisma.user.create({ data: userData });
await prisma.campground.create({ data: campgroundData });
// If second fails, first is still in database!

// ✅ With transaction (all-or-nothing)
await prisma.$transaction([
  prisma.user.create({ data: userData }),
  prisma.campground.create({ data: campgroundData }),
]);
// If any fails, all rollback automatically

// ✅ Interactive transaction (complex logic)
await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({ data: userData });
  const campground = await tx.campground.create({
    data: {
      ...campgroundData,
      authorId: user.id, // Use created user's ID
    },
  });
  return { user, campground };
});
```

---

# Part 3: MongoDB → PostgreSQL Schema Differences

## Paradigm Shift: Document vs Relational

```
┌──────────────────────────────────────────┐
│         MongoDB (Document Store)         │
├──────────────────────────────────────────┤
│  • Schema-less (flexible)                │
│  • Nested documents                      │
│  • Arrays of embedded objects            │
│  • No foreign keys                       │
│  • Eventual consistency                  │
│  • Horizontal scaling focus              │
└──────────────────────────────────────────┘
                   ↓ Migration
┌──────────────────────────────────────────┐
│       PostgreSQL (Relational)            │
├──────────────────────────────────────────┤
│  • Fixed schema (rigid)                  │
│  • Normalized tables                     │
│  • Foreign keys                          │
│  • ACID transactions                     │
│  • Strong consistency                    │
│  • Vertical scaling focus                │
└──────────────────────────────────────────┘
```

---

## Schema Transformation Examples

### Example 1: User Model

**MongoDB (Mongoose):**

```javascript
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: String,
  // No explicit timestamps, but can add:
  createdAt: { type: Date, default: Date.now },
  // Embedded campground references
  campgrounds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campground',
    },
  ],
});

// Passport-local-mongoose adds password hashing
userSchema.plugin(passportLocalMongoose);
```

**PostgreSQL (Prisma):**

```prisma
model User {
  id        Int      @id @default(autoincrement())
  username  String   @unique
  email     String   @unique
  password  String   // Must hash manually with bcrypt
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relationship defined, not stored as array
  campgrounds Campground[]  // Virtual field
  reviews     Review[]

  @@index([email])
  @@index([username])
}
```

**Key Differences:**

1. **ID Field:**

   ```
   MongoDB: _id (12-byte ObjectId, "507f1f77bcf86cd799439011")
   PostgreSQL: id (Integer, auto-increment: 1, 2, 3...)
   ```

2. **Relationships:**

   ```javascript
   // MongoDB: Array of ObjectIds
   campgrounds: [ObjectId("..."), ObjectId("...")]

   // PostgreSQL: Separate table with foreign keys
   Campground.authorId → User.id
   ```

3. **Timestamps:**

   ```javascript
   // MongoDB: Manual or via mongoose timestamps option
   { timestamps: true }  // Adds createdAt, updatedAt

   // Prisma: Explicit field definitions
   createdAt DateTime @default(now())
   updatedAt DateTime @updatedAt
   ```

---

### Example 2: Campground Model

**MongoDB (Mongoose):**

```javascript
const campgroundSchema = new mongoose.Schema({
  title: String,
  price: Number,
  description: String,
  location: String,

  // Embedded array of images (denormalized)
  images: [
    {
      url: String,
      filename: String,
    },
  ],

  // GeoJSON embedded object
  geometry: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },

  // Reference to author
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },

  // Embedded array of reviews
  reviews: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Review',
    },
  ],
});
```

**PostgreSQL (Prisma):**

```prisma
model Campground {
  id          Int      @id @default(autoincrement())
  title       String
  price       Float
  description String
  location    String

  // JSON field for geometry (not ideal, but compatible)
  geometry    Json?    // { "type": "Point", "coordinates": [-119.5, 37.7] }

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Foreign key to User
  authorId    Int
  author      User     @relation(fields: [authorId], references: [id], onDelete: Cascade)

  // Separate tables for images and reviews (normalized)
  images      Image[]  // One-to-many
  reviews     Review[] // One-to-many

  @@index([authorId])
  @@index([createdAt])
}

// Separate Image table (normalized)
model Image {
  id           Int        @id @default(autoincrement())
  url          String
  filename     String
  campgroundId Int
  campground   Campground @relation(fields: [campgroundId], references: [id], onDelete: Cascade)

  @@index([campgroundId])
}

// Separate Review table (normalized)
model Review {
  id           Int        @id @default(autoincrement())
  body         String
  rating       Int
  createdAt    DateTime   @default(now())
  authorId     Int
  campgroundId Int
  author       User       @relation(fields: [authorId], references: [id], onDelete: Cascade)
  campground   Campground @relation(fields: [campgroundId], references: [id], onDelete: Cascade)

  @@index([authorId])
  @@index([campgroundId])
}
```

**Architectural Changes:**

1. **Denormalized → Normalized:**

   ```
   MongoDB: One document contains everything
   {
     title: "Camp",
     images: [{ url: "..." }, { url: "..." }],
     reviews: [{ body: "..." }, { body: "..." }]
   }

   PostgreSQL: Three separate tables
   Campground: { id: 1, title: "Camp" }
   Image: { id: 1, campgroundId: 1, url: "..." }
   Image: { id: 2, campgroundId: 1, url: "..." }
   Review: { id: 1, campgroundId: 1, body: "..." }
   ```

2. **Benefits of Normalization:**

   ```
   ✅ No data duplication
   ✅ Easier updates (change in one place)
   ✅ Better data integrity
   ✅ Smaller storage size
   ✅ Atomic operations

   ❌ More complex queries (joins needed)
   ❌ Potentially slower reads
   ```

---

## Query Pattern Changes

### MongoDB Queries:

```javascript
// Find campground with nested data
const campground = await Campground.findById(id)
  .populate('author')      // Load author document
  .populate({
    path: 'reviews',
    populate: {
      path: 'author'        // Nested populate
    }
  });

// Result: Single document with embedded data
{
  _id: ObjectId("..."),
  title: "Camp",
  author: { _id: ObjectId("..."), username: "john" },
  reviews: [
    {
      _id: ObjectId("..."),
      body: "Great!",
      author: { _id: ObjectId("..."), username: "jane" }
    }
  ]
}
```

### PostgreSQL (Prisma) Queries:

```typescript
// Find campground with relations
const campground = await prisma.campground.findUnique({
  where: { id: 1 },
  include: {
    author: true,          // JOIN User table
    reviews: {
      include: {
        author: true       // Nested JOIN
      }
    },
    images: true           // JOIN Image table
  }
});

// Result: Structured object with relations
{
  id: 1,
  title: "Camp",
  author: { id: 1, username: "john" },
  reviews: [
    {
      id: 1,
      body: "Great!",
      author: { id: 2, username: "jane" }
    }
  ],
  images: [
    { id: 1, url: "...", filename: "..." }
  ]
}
```

**Generated SQL:**

```sql
-- What Prisma executes:
SELECT
  c.*,
  u.id as "author.id", u.username as "author.username",
  r.id as "reviews.id", r.body as "reviews.body",
  r_author.id as "reviews.author.id", r_author.username as "reviews.author.username",
  i.id as "images.id", i.url as "images.url"
FROM "Campground" c
LEFT JOIN "User" u ON c."authorId" = u.id
LEFT JOIN "Review" r ON r."campgroundId" = c.id
LEFT JOIN "User" r_author ON r."authorId" = r_author.id
LEFT JOIN "Image" i ON i."campgroundId" = c.id
WHERE c.id = 1;
```

---

## Data Integrity: MongoDB vs PostgreSQL

### MongoDB (Weak Integrity):

```javascript
// Can create orphaned references
await User.deleteOne({ _id: userId });
// Campgrounds still reference deleted user! 💥

await Campground.find({ author: userId });
// Returns campgrounds with invalid author references
```

### PostgreSQL (Strong Integrity):

```sql
-- Foreign key constraint prevents orphans
DELETE FROM "User" WHERE id = 1;
-- Error: Cannot delete, Campground references exist

-- With CASCADE:
ALTER TABLE "Campground"
ADD CONSTRAINT "Campground_authorId_fkey"
FOREIGN KEY ("authorId") REFERENCES "User"(id)
ON DELETE CASCADE;

DELETE FROM "User" WHERE id = 1;
-- ✅ Automatically deletes all related Campgrounds
```

**Prisma Schema:**

```prisma
model Campground {
  author User @relation(fields: [authorId], references: [id], onDelete: Cascade)
  //                                                          └──────┬──────┘
  //                                                    Delete behavior enforced!
}
```

---

## Migration Strategies

### Strategy 1: Dual-Write Pattern

```javascript
// Write to both databases during migration
async function createUser(userData) {
  // Old MongoDB
  const mongoUser = await MongoUser.create(userData);

  // New PostgreSQL
  const pgUser = await prisma.user.create({ data: userData });

  return { mongoUser, pgUser };
}

// Gradually switch reads from Mongo → PostgreSQL
// Once verified, remove MongoDB code
```

### Strategy 2: Data Export/Import

```javascript
// Export from MongoDB
const users = await MongoUser.find().lean();

// Transform data
const transformed = users.map((user) => ({
  username: user.username,
  email: user.email,
  password: user.password,
  createdAt: user.createdAt || new Date(),
}));

// Import to PostgreSQL
await prisma.user.createMany({ data: transformed });
```

### Strategy 3: Incremental Migration

```
Phase 1: Users & Auth (critical path)
├── Migrate user schema
├── Update auth logic
└── Test thoroughly

Phase 2: Campgrounds & Images
├── Migrate campground schema
├── Separate images table
└── Update CRUD operations

Phase 3: Reviews & Relations
├── Migrate reviews
├── Set up foreign keys
└── Test cascading deletes

Phase 4: Cleanup
├── Remove MongoDB code
├── Remove Mongoose dependencies
└── Update documentation
```

---

## Schema Design Best Practices

### MongoDB Best Practices:

```javascript
// ✅ Embed data for 1:few relationships
{
  username: "john",
  addresses: [
    { street: "123 Main", city: "NYC" },  // Embedded
    { street: "456 Oak", city: "LA" }
  ]
}

// ✅ Reference data for many:many relationships
{
  title: "Camp",
  reviews: [ObjectId("..."), ObjectId("...")]  // Referenced
}

// ❌ Don't embed large arrays
{
  user: "john",
  posts: [ /* 10,000 posts embedded */ ]  // Will hit 16MB document limit!
}
```

### PostgreSQL Best Practices:

```prisma
// ✅ Normalize data (separate tables)
model User {
  id        Int @id
  addresses Address[]
}

model Address {
  id     Int @id
  street String
  userId Int
  user   User @relation(fields: [userId], references: [id])
}

// ✅ Use indexes for foreign keys
@@index([userId])

// ✅ Use appropriate data types
price Float    // Not String!
count Int      // Not Float!

// ❌ Don't over-normalize
// Bad: Separate table for every field
// Good: Group related data logically
```

---

## Performance Comparison

### Read Performance:

```
MongoDB (Embedded):
└── Single document read: 1ms ✅ Faster
    └── All data in one place

PostgreSQL (Normalized):
└── Multiple table joins: 5-10ms ⚠️ Slower
    └── Must join related tables

When PostgreSQL is faster:
└── Indexed queries: 2ms ✅
└── Aggregations: 3ms ✅
└── Range queries: 4ms ✅
```

### Write Performance:

```
MongoDB:
└── Insert document: 1ms
└── Update nested array: 5ms (must rewrite whole array)

PostgreSQL:
└── Insert record: 2ms
└── Update single record: 1ms ✅ Faster (atomic)
└── Transaction overhead: +1ms
```

### Scale Characteristics:

```
MongoDB:
├── Horizontal scaling: Excellent (sharding)
├── Vertical scaling: Limited
├── Best for: Read-heavy, flexible schema
└── Challenges: Consistency, joins

PostgreSQL:
├── Horizontal scaling: Challenging (replication)
├── Vertical scaling: Excellent
├── Best for: Complex queries, transactions
└── Challenges: Scaling writes
```

---

## Conclusion

### When to Use Each:

**MongoDB:**

- Flexible/evolving schema
- Document-centric data
- High write throughput
- Horizontal scaling needs
- Embedded data patterns

**PostgreSQL:**

- Complex relationships
- Strong consistency needs
- ACID transactions
- Rich querying (JOINs, aggregations)
- Data integrity critical

### For JosePauloCamp:

**PostgreSQL was the right choice because:**

1. ✅ Fixed schema (users, campgrounds, reviews)
2. ✅ Complex relationships (user → campgrounds → reviews)
3. ✅ Data integrity important (foreign keys, cascades)
4. ✅ ACID transactions needed (user registration + campground)
5. ✅ Rich querying (filters, sorts, pagination)

---

_Document created: December 16, 2025_  
_Project: JosePauloCamp - Deep Dive Technical Guide_
