# 🗄️ MongoDB to PostgreSQL Conversion Guide

## 📚 Complete Guide: Converting from NoSQL (MongoDB) to Relational Database (PostgreSQL)

This document provides a comprehensive, step-by-step guide to understanding and converting a Node.js/Express application from **MongoDB** (NoSQL) to **PostgreSQL** (Relational) using **Prisma ORM**.

---

## 📖 Table of Contents

1. [Understanding the Databases](#1-understanding-the-databases)
2. [Project Overview](#2-project-overview)
3. [MongoDB vs PostgreSQL: Key Differences](#3-mongodb-vs-postgresql-key-differences)
4. [Schema Comparison](#4-schema-comparison)
5. [Step-by-Step Conversion Process](#5-step-by-step-conversion-process)
6. [Code Comparison: MongoDB vs PostgreSQL](#6-code-comparison-mongodb-vs-postgresql)
7. [Authentication Changes](#7-authentication-changes)
8. [Migration Challenges & Solutions](#8-migration-challenges--solutions)
9. [Performance Considerations](#9-performance-considerations)
10. [Testing the Conversion](#10-testing-the-conversion)

---

## 1. Understanding the Databases

### 🍃 MongoDB (NoSQL)

**What is MongoDB?**

- **Document-oriented** database that stores data in JSON-like documents (BSON)
- **Schema-less**: No predefined structure required
- **Flexible**: Can add/remove fields without migrations
- **Embedded documents**: Can nest related data directly

**Key Concepts:**

```javascript
// MongoDB Document Example
{
  _id: ObjectId("507f1f77bcf86cd799439011"),
  title: "Lake Campground",
  author: ObjectId("507f191e810c19729de860ea"), // Reference to User
  reviews: [                                     // Array of references
    ObjectId("507f1f77bcf86cd799439012"),
    ObjectId("507f1f77bcf86cd799439013")
  ],
  images: [                                      // Embedded documents
    { url: "https://...", filename: "image1.jpg" }
  ]
}
```

**Pros:**

- ✅ Fast prototyping (no schema required)
- ✅ Flexible schema evolution
- ✅ Easy to embed related data
- ✅ Horizontal scaling (sharding)
- ✅ Good for unstructured data

**Cons:**

- ❌ No ACID transactions (before v4.0)
- ❌ Data duplication common
- ❌ Complex queries harder
- ❌ No foreign key constraints
- ❌ Manual relationship management

### 🐘 PostgreSQL (Relational)

**What is PostgreSQL?**

- **Relational** database that stores data in tables with rows and columns
- **Schema-based**: Structure defined upfront
- **ACID compliant**: Strong data integrity guarantees
- **Normalized**: Data stored once, referenced elsewhere

**Key Concepts:**

```sql
-- PostgreSQL Table Example
CREATE TABLE campgrounds (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255),
  author_id INTEGER REFERENCES users(id),
  -- Reviews in separate table with foreign key
  -- Images in separate table with foreign key
);

CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  campground_id INTEGER REFERENCES campgrounds(id),
  author_id INTEGER REFERENCES users(id),
  body TEXT,
  rating INTEGER
);
```

**Pros:**

- ✅ Strong data integrity (foreign keys, constraints)
- ✅ ACID transactions
- ✅ Complex queries with JOINs
- ✅ Data normalization (no duplication)
- ✅ Mature tooling and ecosystem
- ✅ Excellent for structured data

**Cons:**

- ❌ Schema changes require migrations
- ❌ Vertical scaling limits
- ❌ More planning required upfront
- ❌ JOINs can be expensive

---

## 2. Project Overview

### Original MongoDB Version

- **GitHub**: https://github.com/ppconrado/YelpCamp-React
- **Stack**: React + Express + MongoDB + Mongoose
- **ORM**: Mongoose (MongoDB ODM)

### PostgreSQL Version (This Project)

- **Stack**: React + Express + PostgreSQL + Prisma
- **ORM**: Prisma (Modern TypeScript-first ORM)

**Application Features:**

- User authentication & authorization
- Campground CRUD operations
- Review system (1-5 stars)
- Multi-image uploads (Cloudinary)
- Interactive maps (Mapbox)
- Pagination & sorting

---

## 3. MongoDB vs PostgreSQL: Key Differences

### Data Modeling Philosophy

| Aspect            | MongoDB                | PostgreSQL                  |
| ----------------- | ---------------------- | --------------------------- |
| **Structure**     | Document (JSON-like)   | Tables (Rows & Columns)     |
| **Schema**        | Flexible, dynamic      | Fixed, enforced             |
| **Relationships** | Embedded or referenced | Foreign keys (normalized)   |
| **IDs**           | ObjectId (12-byte hex) | INTEGER/UUID                |
| **Arrays**        | Native support         | Separate tables (1-to-many) |
| **Nested Data**   | Embedded documents     | JOINs                       |
| **Timestamps**    | Manual or plugin       | Auto-generated              |

### Example: Storing a Campground with Images

**MongoDB Approach (Embedded):**

```javascript
{
  _id: ObjectId("..."),
  title: "Lake View",
  images: [                          // Embedded array
    { url: "img1.jpg", filename: "abc123" },
    { url: "img2.jpg", filename: "def456" }
  ]
}
```

**PostgreSQL Approach (Normalized):**

```sql
-- Campgrounds table
campgrounds: { id: 1, title: "Lake View" }

-- Images table (separate, related by campground_id)
images: { id: 1, campground_id: 1, url: "img1.jpg", filename: "abc123" }
images: { id: 2, campground_id: 1, url: "img2.jpg", filename: "def456" }
```

---

## 4. Schema Comparison

### 📄 MongoDB Schema (Mongoose)

#### User Model

```javascript
// models/user.js (MongoDB)
const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
});

// Passport plugin adds username, hash, salt automatically
UserSchema.plugin(passportLocalMongoose);

// Indexes for performance
UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });

module.exports = mongoose.model('User', UserSchema);
```

#### Campground Model

```javascript
// models/campground.js (MongoDB)
const CampgroundSchema = new Schema(
  {
    title: String,
    price: Number,
    description: String,
    location: String,

    // GeoJSON (native MongoDB geospatial)
    geometry: {
      type: { type: String, enum: ['Point'], required: true },
      coordinates: { type: [Number], required: true },
    },

    // Embedded images array
    images: [
      {
        url: String,
        filename: String,
      },
    ],

    // References to other collections
    author: { type: Schema.Types.ObjectId, ref: 'User' },
    reviews: [{ type: Schema.Types.ObjectId, ref: 'Review' }],
  },
  { timestamps: true } // Auto-add createdAt/updatedAt
);

// Indexes
CampgroundSchema.index({ author: 1 });
CampgroundSchema.index({ 'geometry.coordinates': '2dsphere' });
CampgroundSchema.index({
  title: 'text',
  description: 'text',
  location: 'text',
});

// Virtual property (computed field)
CampgroundSchema.virtual('properties.popUpMarkup').get(function () {
  return `<strong>${this.title}</strong>`;
});

// Cascade delete reviews when campground is deleted
CampgroundSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    await Review.deleteMany({ _id: { $in: doc.reviews } });
  }
});

module.exports = mongoose.model('Campground', CampgroundSchema);
```

#### Review Model

```javascript
// models/review.js (MongoDB)
const reviewSchema = new Schema(
  {
    body: String,
    rating: Number,
    author: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

reviewSchema.index({ author: 1 });

module.exports = mongoose.model('Review', reviewSchema);
```

### 🗄️ PostgreSQL Schema (Prisma)

```prisma
// prisma/schema.prisma (PostgreSQL)

generator client {
  provider   = "prisma-client-js"
  output     = "../generated/prisma"
  engineType = "library"
}

datasource db {
  provider = "postgresql"
}

// User table
model User {
  id          Int          @id @default(autoincrement())
  email       String       @unique
  username    String       @unique
  password    String       // Hashed password (bcrypt)
  campgrounds Campground[] @relation("UserCampgrounds")
  reviews     Review[]
}

// Campground table
model Campground {
  id          Int      @id @default(autoincrement())
  title       String
  description String
  price       Float
  location    String
  geometry    Json     // Stored as JSON (GeoJSON)
  authorId    Int      // Foreign key to User
  author      User     @relation("UserCampgrounds", fields: [authorId], references: [id])
  reviews     Review[] // One-to-many relationship
  images      Image[]  // One-to-many relationship
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// Review table
model Review {
  id           Int        @id @default(autoincrement())
  body         String
  rating       Int
  authorId     Int        // Foreign key to User
  campgroundId Int        // Foreign key to Campground
  author       User       @relation(fields: [authorId], references: [id])
  campground   Campground @relation(fields: [campgroundId], references: [id])
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
}

// Image table (separate, not embedded)
model Image {
  id           Int        @id @default(autoincrement())
  url          String
  filename     String
  campgroundId Int        // Foreign key to Campground
  campground   Campground @relation(fields: [campgroundId], references: [id])
}
```

### 🔑 Key Schema Changes

| Feature        | MongoDB (Mongoose)              | PostgreSQL (Prisma)                       |
| -------------- | ------------------------------- | ----------------------------------------- |
| **User ID**    | `_id: ObjectId`                 | `id: Int @id @default(autoincrement())`   |
| **Password**   | `salt + hash` (passport plugin) | `password: String` (bcrypt manual)        |
| **Images**     | Embedded array in Campground    | Separate `Image` table with foreign key   |
| **Reviews**    | Array of ObjectId refs          | Separate `Review` table with foreign keys |
| **Geometry**   | Native GeoJSON type             | `Json` type (store as JSON)               |
| **Timestamps** | `timestamps: true` option       | `@default(now())` & `@updatedAt`          |
| **Indexes**    | `.index()` methods              | Implicit on `@unique` and relations       |

---

## 5. Step-by-Step Conversion Process

### Step 1: Setup PostgreSQL Database

**Option A: Local PostgreSQL**

```bash
# Install PostgreSQL (Windows)
# Download from: https://www.postgresql.org/download/windows/

# Create database
psql -U postgres
CREATE DATABASE yelpcamp;
```

**Option B: Cloud PostgreSQL (Recommended)**

```bash
# Use Prisma Postgres (free tier)
npm install -g prisma
prisma login
prisma postgres create --name yelpcamp --region us-east-1

# Or use other providers:
# - Neon (https://neon.tech)
# - Supabase (https://supabase.com)
# - Railway (https://railway.app)
```

### Step 2: Install Prisma Dependencies

```bash
# Remove Mongoose
npm uninstall mongoose passport-local-mongoose connect-mongo

# Install Prisma
npm install prisma @prisma/client --save
npm install @prisma/adapter-pg pg --save

# Install bcrypt for password hashing (replacing passport-local-mongoose)
npm install bcryptjs
```

### Step 3: Initialize Prisma

```bash
# Initialize Prisma (creates prisma/schema.prisma)
npx prisma init

# Configure .env
DATABASE_URL="postgresql://user:password@localhost:5432/yelpcamp"
```

### Step 4: Define Prisma Schema

Create [prisma/schema.prisma](prisma/schema.prisma) with models (see section 4).

**Key Conversions:**

1. **MongoDB Collections → PostgreSQL Tables**

   ```
   users (collection) → User (model)
   campgrounds (collection) → Campground (model)
   reviews (collection) → Review (model)
   ```

2. **ObjectId → Integer**

   ```javascript
   // MongoDB
   _id: ObjectId("507f1f77bcf86cd799439011")

   // PostgreSQL
   id: 1 (auto-incrementing integer)
   ```

3. **Embedded Arrays → Separate Tables**

   ```javascript
   // MongoDB
   images: [{ url: "...", filename: "..." }]

   // PostgreSQL
   Image table with campgroundId foreign key
   ```

4. **References → Foreign Keys**

   ```javascript
   // MongoDB
   author: ObjectId("...")

   // PostgreSQL
   authorId: Int
   author: User @relation(fields: [authorId], references: [id])
   ```

### Step 5: Create Migration

```bash
# Generate migration (creates SQL)
npx prisma migrate dev --name initial_setup

# This creates:
# - prisma/migrations/YYYYMMDDHHMMSS_initial_setup/migration.sql
# - Updates database with tables

# Generate Prisma Client
npx prisma generate
```

### Step 6: Setup Prisma Client Singleton

Create [lib/prisma.js](lib/prisma.js):

```javascript
// lib/prisma.js (PostgreSQL with Prisma 7 Driver Adapter)
const { PrismaClient } = require('../generated/prisma');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create Prisma adapter
const adapter = new PrismaPg(pool);

// Singleton pattern
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

**Why Driver Adapter?**

- Prisma 7 requires explicit database connection configuration
- Enables connection pooling and better performance
- Required for production deployments

### Step 7: Convert Controllers

#### MongoDB Controller Example

```javascript
// controllers/campgrounds.js (MongoDB)
const Campground = require('../models/campground');

module.exports.index = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 12;
  const skip = (page - 1) * limit;

  const [campgrounds, total] = await Promise.all([
    Campground.find({}) // MongoDB query
      .populate('author', 'username') // Populate reference
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    Campground.countDocuments(),
  ]);

  res.json({
    items: campgrounds,
    page,
    total,
    totalPages: Math.ceil(total / limit),
  });
};

module.exports.createCampground = async (req, res) => {
  // MongoDB: Create new document
  const campground = new Campground(req.body.campground);
  campground.images = req.files.map((f) => ({
    url: f.path,
    filename: f.filename,
  }));
  campground.author = req.user._id;
  await campground.save();

  res.status(201).json({ campground });
};

module.exports.showCampground = async (req, res) => {
  // MongoDB: findById with nested populate
  const campground = await Campground.findById(req.params.id)
    .populate({
      path: 'reviews',
      populate: { path: 'author' },
    })
    .populate('author');

  res.json(campground);
};
```

#### PostgreSQL Controller Example

```javascript
// controllers/campgrounds.prisma.js (PostgreSQL)
const prisma = require('../lib/prisma');

module.exports.index = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = 12;
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.campground.findMany({
      // Prisma query
      skip,
      take: limit,
      orderBy: { id: 'desc' },
      include: {
        // Include relations (like populate)
        author: true,
        reviews: { include: { author: true } },
        images: true,
      },
    }),
    prisma.campground.count(),
  ]);

  res.json({
    items,
    page,
    total,
    totalPages: Math.ceil(total / limit),
  });
};

module.exports.createCampground = async (req, res) => {
  const images = req.files.map((f) => ({ url: f.path, filename: f.filename }));

  // Prisma: Create with nested relations
  const campground = await prisma.campground.create({
    data: {
      ...req.body.campground,
      price: parseFloat(req.body.campground.price),
      images: { create: images }, // Create related images
      authorId: req.user.id, // Foreign key
    },
    include: { images: true, author: true },
  });

  res.status(201).json({ campground });
};

module.exports.showCampground = async (req, res) => {
  // Prisma: findUnique with nested includes
  const campground = await prisma.campground.findUnique({
    where: { id: Number(req.params.id) },
    include: {
      reviews: { include: { author: true } },
      author: true,
      images: true,
    },
  });

  res.json(campground);
};
```

### Step 8: Convert Authentication

#### MongoDB Authentication (Passport + Mongoose Plugin)

```javascript
// models/user.js (MongoDB)
UserSchema.plugin(passportLocalMongoose); // Auto-adds username, hash, salt

// routes/users.js (MongoDB)
const User = require('../models/user');

router.post('/register', async (req, res) => {
  const user = new User({ email: req.body.email, username: req.body.username });
  await User.register(user, req.body.password); // Plugin method
  req.login(user, () => res.json({ user }));
});

router.post('/login', passport.authenticate('local'), (req, res) => {
  res.json({ user: req.user });
});
```

#### PostgreSQL Authentication (Bcrypt Manual)

```javascript
// controllers/users.prisma.js (PostgreSQL)
const prisma = require('../lib/prisma');
const bcrypt = require('bcryptjs');

module.exports.register = async (req, res) => {
  const { username, email, password } = req.body;

  // Hash password manually
  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: { username, email, password: hashedPassword },
  });

  req.login(user, () => res.json({ user }));
};

module.exports.login = async (req, res) => {
  const { username, password } = req.body;

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  req.login(user, () => res.json({ user }));
};
```

### Step 9: Update Middleware

```javascript
// middleware.js (PostgreSQL version)
const prisma = require('./lib/prisma');

module.exports.isAuthor = async (req, res, next) => {
  const { id } = req.params;

  // Prisma query instead of Mongoose
  const campground = await prisma.campground.findUnique({
    where: { id: Number(id) },
  });

  if (!campground || campground.authorId !== req.user.id) {
    return res.status(403).json({ error: 'Permission denied' });
  }
  next();
};
```

### Step 10: Migrate Data (if needed)

If you have existing MongoDB data:

```javascript
// scripts/migrate-data.js
const mongoose = require('mongoose');
const { PrismaClient } = require('@prisma/client');

// 1. Connect to both databases
await mongoose.connect(MONGODB_URL);
const prisma = new PrismaClient();

// 2. Migrate users
const users = await mongoose.model('User').find();
for (const user of users) {
  await prisma.user.create({
    data: {
      username: user.username,
      email: user.email,
      password: user.hash, // Keep existing hashes
    },
  });
}

// 3. Migrate campgrounds
const campgrounds = await mongoose.model('Campground').find();
for (const camp of campgrounds) {
  const author = await prisma.user.findUnique({
    where: { username: camp.author.username },
  });

  await prisma.campground.create({
    data: {
      title: camp.title,
      description: camp.description,
      price: camp.price,
      location: camp.location,
      geometry: camp.geometry,
      authorId: author.id,
      images: {
        create: camp.images.map((img) => ({
          url: img.url,
          filename: img.filename,
        })),
      },
      createdAt: camp.createdAt,
      updatedAt: camp.updatedAt,
    },
  });
}

// 4. Migrate reviews (similar pattern)
```

---

## 6. Code Comparison: MongoDB vs PostgreSQL

### Query Comparison

| Operation      | MongoDB (Mongoose)                       | PostgreSQL (Prisma)                                 |
| -------------- | ---------------------------------------- | --------------------------------------------------- |
| **Find All**   | `Campground.find()`                      | `prisma.campground.findMany()`                      |
| **Find by ID** | `Campground.findById(id)`                | `prisma.campground.findUnique({ where: { id } })`   |
| **Create**     | `new Campground(data).save()`            | `prisma.campground.create({ data })`                |
| **Update**     | `Campground.findByIdAndUpdate(id, data)` | `prisma.campground.update({ where: { id }, data })` |
| **Delete**     | `Campground.findByIdAndDelete(id)`       | `prisma.campground.delete({ where: { id } })`       |
| **Count**      | `Campground.countDocuments()`            | `prisma.campground.count()`                         |
| **Populate**   | `.populate('author')`                    | `include: { author: true }`                         |
| **Filter**     | `.find({ price: { $gte: 50 } })`         | `findMany({ where: { price: { gte: 50 } } })`       |
| **Sort**       | `.sort({ createdAt: -1 })`               | `orderBy: { createdAt: 'desc' }`                    |
| **Pagination** | `.skip(10).limit(10)`                    | `skip: 10, take: 10`                                |

### Relationship Handling

**MongoDB - Array of References:**

```javascript
// Campground has array of review ObjectIds
campground: {
  _id: ObjectId("..."),
  reviews: [ObjectId("..."), ObjectId("...")]
}

// Manual population required
const campground = await Campground.findById(id).populate('reviews');
```

**PostgreSQL - Foreign Keys:**

```sql
-- Review has foreign key to Campground
reviews: { id: 1, campground_id: 1, body: "Great!" }
reviews: { id: 2, campground_id: 1, body: "Nice!" }

-- Automatic joins via relations
const campground = await prisma.campground.findUnique({
  where: { id },
  include: { reviews: true }
});
```

### Embedded vs Normalized Data

**MongoDB - Embedded Images:**

```javascript
campground: {
  _id: ObjectId("..."),
  title: "Lake View",
  images: [
    { url: "img1.jpg", filename: "abc" },
    { url: "img2.jpg", filename: "def" }
  ]
}

// Access: campground.images[0].url
```

**PostgreSQL - Normalized Images:**

```javascript
// Campground table
campground: { id: 1, title: "Lake View" }

// Separate images table
images: { id: 1, campground_id: 1, url: "img1.jpg", filename: "abc" }
images: { id: 2, campground_id: 1, url: "img2.jpg", filename: "def" }

// Query with relation
const campground = await prisma.campground.findUnique({
  where: { id: 1 },
  include: { images: true }
});
// Access: campground.images[0].url
```

---

## 7. Authentication Changes

### MongoDB: Passport-Local-Mongoose Plugin

**Advantages:**

- ✅ Automatic username/password management
- ✅ Built-in `register()` and `authenticate()` methods
- ✅ Salt and hash stored automatically

**Implementation:**

```javascript
// models/user.js
UserSchema.plugin(passportLocalMongoose);

// Usage
await User.register(newUser, password); // Hashes automatically
```

### PostgreSQL: Manual Bcrypt

**Advantages:**

- ✅ Full control over password handling
- ✅ Works with any database
- ✅ More flexible

**Implementation:**

```javascript
const bcrypt = require('bcryptjs');

// Register
const hashedPassword = await bcrypt.hash(password, 12);
await prisma.user.create({
  data: { username, email, password: hashedPassword },
});

// Login
const user = await prisma.user.findUnique({ where: { username } });
const valid = await bcrypt.compare(password, user.password);
```

**Migration Note:** If migrating existing users, you can preserve the Mongoose password hashes (they're bcrypt-compatible).

---

## 8. Migration Challenges & Solutions

### Challenge 1: ObjectId vs Integer IDs

**Problem:** MongoDB uses 12-byte ObjectId, PostgreSQL uses auto-incrementing integers.

**Solution:**

- Don't migrate existing IDs
- Let PostgreSQL generate new sequential IDs
- Update all foreign key references during migration

### Challenge 2: Embedded Arrays

**Problem:** MongoDB embeds images directly, PostgreSQL needs separate table.

**Solution:**

```javascript
// MongoDB: Embedded
campground.images = [{ url, filename }];
await campground.save();

// PostgreSQL: Nested create
await prisma.campground.create({
  data: {
    title: '...',
    images: { create: [{ url, filename }] },
  },
});
```

### Challenge 3: Cascade Deletes

**Problem:** MongoDB uses middleware hooks, PostgreSQL uses database-level cascades.

**Solution:**

```javascript
// MongoDB: Application-level
CampgroundSchema.post('findOneAndDelete', async function (doc) {
  await Review.deleteMany({ _id: { $in: doc.reviews } });
});

// PostgreSQL: Database-level (add to schema)
model Review {
  campground Campground @relation(fields: [campgroundId], references: [id], onDelete: Cascade)
}

// Now when campground is deleted, reviews auto-delete via database
```

### Challenge 4: Timestamps

**Problem:** Mongoose adds `createdAt`/`updatedAt` via option, Prisma uses decorators.

**Solution:**

```prisma
model Campground {
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Challenge 5: Geospatial Data

**Problem:** MongoDB has native GeoJSON support, PostgreSQL needs PostGIS or JSON storage.

**Solution:**

```prisma
// Store as JSON (simpler, good for basic use)
model Campground {
  geometry Json
}

// Use PostGIS extension (advanced geospatial)
// Requires: CREATE EXTENSION postgis;
```

---

## 9. Performance Considerations

### Indexing

**MongoDB:**

```javascript
CampgroundSchema.index({ author: 1 });
CampgroundSchema.index({ 'geometry.coordinates': '2dsphere' });
CampgroundSchema.index({ title: 'text', description: 'text' });
```

**PostgreSQL (Prisma):**

```prisma
model Campground {
  authorId Int
  @@index([authorId]) // Explicit index

  // Or implicit via relations (automatically indexed)
  author User @relation(fields: [authorId], references: [id])
}
```

### Query Performance

**MongoDB Strengths:**

- ✅ Fast reads for embedded data (no joins)
- ✅ Geospatial queries with 2dsphere indexes

**PostgreSQL Strengths:**

- ✅ Complex JOINs optimized by query planner
- ✅ Better for aggregations and analytics
- ✅ Consistent performance with proper indexing

### Connection Pooling

**MongoDB (Mongoose):**

```javascript
mongoose.connect(dbUrl, {
  poolSize: 10,
  useUnifiedTopology: true,
});
```

**PostgreSQL (Prisma 7 + pg Pool):**

```javascript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Pool size
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
```

---

## 10. Testing the Conversion

### Step 1: Verify Schema

```bash
# Check database schema
npx prisma studio

# Or use psql
psql -U postgres -d yelpcamp
\dt          # List tables
\d campgrounds  # Describe table structure
```

### Step 2: Test CRUD Operations

```javascript
// test-prisma.js
const prisma = require('./lib/prisma');

async function test() {
  // Create user
  const user = await prisma.user.create({
    data: {
      username: 'testuser',
      email: 'test@example.com',
      password: 'hashed',
    },
  });

  // Create campground with images
  const campground = await prisma.campground.create({
    data: {
      title: 'Test Camp',
      description: 'Beautiful place',
      price: 50,
      location: 'Colorado',
      geometry: { type: 'Point', coordinates: [-105.0, 40.0] },
      authorId: user.id,
      images: {
        create: [
          { url: 'img1.jpg', filename: 'abc' },
          { url: 'img2.jpg', filename: 'def' },
        ],
      },
    },
    include: { images: true, author: true },
  });

  console.log('Created:', campground);

  // Query with relations
  const found = await prisma.campground.findUnique({
    where: { id: campground.id },
    include: { images: true, reviews: true },
  });

  console.log('Found:', found);
}

test();
```

### Step 3: Compare Results

Use identical frontend API calls to compare MongoDB vs PostgreSQL responses:

```bash
# MongoDB version
GET /api/campgrounds
→ { _id: "507f...", title: "Lake View", author: { _id: "...", username: "john" } }

# PostgreSQL version
GET /api/campgrounds
→ { id: 1, title: "Lake View", author: { id: 1, username: "john" } }
```

**Note:** Frontend may need minor adjustments for `_id` → `id` changes.

---

## 📊 Summary: When to Use Each Database

### Choose MongoDB When:

- 🚀 Rapid prototyping with changing requirements
- 📄 Document-oriented data (blogs, CMS)
- 🌐 Horizontal scaling is priority
- 💾 Embedded data makes sense (avoid joins)
- 📊 Unstructured or semi-structured data

### Choose PostgreSQL When:

- 🔒 Data integrity is critical
- 📊 Complex queries and analytics
- 🔗 Many relationships between entities
- 💼 Financial or transactional data
- 🏢 Enterprise applications
- 📈 Mature ecosystem and tooling required

---

## 🎓 Key Learnings

1. **NoSQL (MongoDB)** is flexible but requires manual relationship management
2. **SQL (PostgreSQL)** enforces structure but provides strong guarantees
3. **Embedded vs Normalized**: Trade-off between denormalization (fast reads) and normalization (data integrity)
4. **ORMs Matter**: Mongoose vs Prisma have different philosophies
   - Mongoose: Schema-less, document-oriented
   - Prisma: Type-safe, schema-first
5. **Migration Complexity**: Plan for ID changes, relationship restructuring, and data normalization

---

## 📚 Additional Resources

### Documentation

- [MongoDB Documentation](https://docs.mongodb.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Mongoose Guide](https://mongoosejs.com/docs/guide.html)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma 7 Driver Adapters](https://www.prisma.io/docs/orm/overview/databases/database-drivers)

### Tutorials

- [MongoDB University](https://university.mongodb.com/)
- [PostgreSQL Tutorial](https://www.postgresqltutorial.com/)
- [Prisma from Scratch](https://www.prisma.io/docs/getting-started)

### Tools

- [MongoDB Compass](https://www.mongodb.com/products/compass) - GUI for MongoDB
- [pgAdmin](https://www.pgadmin.org/) - GUI for PostgreSQL
- [Prisma Studio](https://www.prisma.io/studio) - GUI for Prisma databases

---

## 🔗 Project Links

- **MongoDB Version**: https://github.com/ppconrado/YelpCamp-React
- **PostgreSQL Version**: This repository
- **Prisma Migration Docs**: [PRISMA_REFACTOR_PROGRESS.md](./PRISMA_REFACTOR_PROGRESS.md)

---

## 👨‍💻 Author

**José Paulo Conrado**

- GitHub: [@ppconrado](https://github.com/ppconrado)

---

## 📄 License

This guide is provided as educational material for understanding database migrations. See the main project for license details.

---

**Happy Learning! 🎉**

_Remember: The best database is the one that fits your specific use case. There's no universal "best" - only best for your needs._
