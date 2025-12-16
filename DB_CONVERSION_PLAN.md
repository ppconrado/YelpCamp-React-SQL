# Database Conversion Plan: MongoDB to Relational SQL (PostgreSQL)

## Overview

This document outlines the step-by-step plan to migrate the current project from MongoDB (Mongoose) to a relational SQL database, specifically PostgreSQL. Each step will be committed separately for traceability.

---

## 1. Current Data Models Analysis

### 1.1 Entity Overview

**User**

- Primary entity for authentication and ownership
- Stores credentials (email, username, password hash)
- Owner of multiple campgrounds and reviews

**Campground**

- Core business entity representing camping locations
- Contains descriptive information, pricing, location data
- Owned by one user (author)
- Contains multiple images and reviews
- Stores geolocation data as JSON (GeoJSON Point format)

**Review**

- User feedback entity for campgrounds
- Contains rating (1-5) and review text
- Authored by one user
- Belongs to one campground

**Image**

- Media storage entity for campground photos
- Stores Cloudinary URLs and filenames
- Belongs to one campground
- Previously embedded in Campground, now normalized

### 1.2 Relationship Mapping (ERD - Crow's Foot Notation)

```
┌──────────────────────────────────────────────────────────────────────┐
│                  ENTITY RELATIONSHIP DIAGRAM                         │
└──────────────────────────────────────────────────────────────────────┘

                    ┌─────────────────────┐
                    │       USER          │
                    ├─────────────────────┤
                    │ PK  id              │
                    │     username (UQ)   │
                    │     email (UQ)      │
                    │     password        │
                    └─────────────────────┘
                           │     │
                           │     │
                        1  │     │ 1
           ┌───────────────┘     └────────────────┐
           │ creates                          writes│
           │                                        │
         ╔═╩═══════════════╗              ╔════════╩═════════╗
       N ║                 ║            N ║                  ║
         ║   CAMPGROUND    ║◄─────────────║     REVIEW       ║
         ║                 ║    about     ║                  ║
         ║─────────────────║       1:N    ║──────────────────║
         ║ PK  id          ║              ║ PK  id           ║
         ║     title       ║              ║     body         ║
         ║     description ║              ║     rating       ║
         ║     price       ║              ║ FK  campgroundId─║──┐
         ║     location    ║              ║ FK  authorId     ║  │
         ║     geometry    ║              ╚══════════════════╝  │
         ║ FK  authorId    ║                                     │
         ╚═════════════════╝                                     │
                 │                                               │
                 │ 1                                             │
                 │                                               │
                 │ contains                                      │
                 │                                               │
              ╔══╩══════════════╗                                │
            N ║                 ║                                │
              ║     IMAGE       ║                                │
              ║─────────────────║                                │
              ║ PK  id          ║                                │
              ║     url         ║                                │
              ║     filename    ║                                │
              ║ FK  campgroundId║────────────────────────────────┘
              ╚═════════════════╝


CARDINALITY NOTATION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ═══     Entity (strong/independent)
  ─┐│     One (exactly one, mandatory)
  ─┤│     One (optional)
  ═╩═     Many (zero or more)
  ◄──     Relationship direction
  PK      Primary Key
  FK      Foreign Key
  UQ      Unique constraint
```

### 1.3 Relationship Types

**One-to-Many Relationships:**

1. **User → Campground** (One-to-Many)

   - One user can create multiple campgrounds
   - Each campground belongs to exactly one user (author)
   - Field: `Campground.authorId` references `User.id`
   - Cascade: Deleting user removes their campgrounds

2. **User → Review** (One-to-Many)

   - One user can write multiple reviews
   - Each review belongs to exactly one user (author)
   - Field: `Review.authorId` references `User.id`
   - Cascade: Deleting user removes their reviews

3. **Campground → Review** (One-to-Many)

   - One campground can have multiple reviews
   - Each review belongs to exactly one campground
   - Field: `Review.campgroundId` references `Campground.id`
   - Cascade: Deleting campground removes its reviews

4. **Campground → Image** (One-to-Many)
   - One campground can have multiple images (max 10)
   - Each image belongs to exactly one campground
   - Field: `Image.campgroundId` references `Campground.id`
   - Cascade: Deleting campground removes its images

**Indirect Relationships:**

5. **User → Review → Campground** (Many-to-Many through Review)
   - Users can review multiple campgrounds
   - Campgrounds can be reviewed by multiple users
   - Join table: Review (acts as junction table)
   - Constraint: One user can only review a campground once (business logic)

### 1.4 Data Structure Details

**User Table:**

```
┌──────────┬──────────┬────────────┬────────┐
│ Column   │ Type     │ Constraint │ Index  │
├──────────┼──────────┼────────────┼────────┤
│ id       │ Integer  │ PK, Auto   │ ✓      │
│ email    │ String   │ UNIQUE     │ ✓      │
│ username │ String   │ UNIQUE     │ ✓      │
│ password │ String   │ NOT NULL   │        │
└──────────┴──────────┴────────────┴────────┘
```

**Campground Table:**

```
┌─────────────┬──────────┬────────────┬────────┐
│ Column      │ Type     │ Constraint │ Index  │
├─────────────┼──────────┼────────────┼────────┤
│ id          │ Integer  │ PK, Auto   │ ✓      │
│ title       │ String   │ NOT NULL   │        │
│ description │ String   │ NOT NULL   │        │
│ price       │ Float    │ NOT NULL   │        │
│ location    │ String   │ NOT NULL   │        │
│ geometry    │ JSON     │ NOT NULL   │        │
│ authorId    │ Integer  │ FK → User  │ ✓      │
│ createdAt   │ DateTime │ DEFAULT    │        │
│ updatedAt   │ DateTime │ AUTO       │        │
└─────────────┴──────────┴────────────┴────────┘
```

**Review Table:**

```
┌──────────────┬──────────┬─────────────────┬────────┐
│ Column       │ Type     │ Constraint      │ Index  │
├──────────────┼──────────┼─────────────────┼────────┤
│ id           │ Integer  │ PK, Auto        │ ✓      │
│ body         │ String   │ NOT NULL        │        │
│ rating       │ Integer  │ NOT NULL (1-5)  │        │
│ authorId     │ Integer  │ FK → User       │ ✓      │
│ campgroundId │ Integer  │ FK → Campground │ ✓      │
│ createdAt    │ DateTime │ DEFAULT         │        │
│ updatedAt    │ DateTime │ AUTO            │        │
└──────────────┴──────────┴─────────────────┴────────┘
```

**Image Table:**

```
┌──────────────┬──────────┬─────────────────┬────────┐
│ Column       │ Type     │ Constraint      │ Index  │
├──────────────┼──────────┼─────────────────┼────────┤
│ id           │ Integer  │ PK, Auto        │ ✓      │
│ url          │ String   │ NOT NULL        │        │
│ filename     │ String   │ NOT NULL        │        │
│ campgroundId │ Integer  │ FK → Campground │ ✓      │
└──────────────┴──────────┴─────────────────┴────────┘
```

### 1.5 Key Differences from MongoDB

**From Embedded to Normalized:**

- **MongoDB**: Images were embedded array in Campground document
- **PostgreSQL**: Images are separate table with foreign key relationship
- **Benefit**: Better data integrity, easier to manage individual images

**From ObjectId to Integer:**

- **MongoDB**: Used 12-byte ObjectId (e.g., `507f1f77bcf86cd799439011`)
- **PostgreSQL**: Uses auto-incrementing integers (1, 2, 3...)
- **Benefit**: Simpler, more efficient for joins and indexes

**From Document References to Foreign Keys:**

- **MongoDB**: Manual population required, weak referential integrity
- **PostgreSQL**: Enforced foreign key constraints with CASCADE
- **Benefit**: Database-level data integrity, automatic cleanup

## 2. Choose and Set Up Relational Database

### 2.1 Select PostgreSQL as the target database

- PostgreSQL is chosen for its reliability, features, and strong Node.js support.

### 2.2 Set up PostgreSQL locally

- Download and install PostgreSQL from https://www.postgresql.org/download/
- Set a password for the default `postgres` user during installation.
- Create a database for the project:
  ```sql
  CREATE DATABASE josepaulocamp;
  ```

### 2.3 Install and initialize Prisma ORM

- In the project root, run:
  ```sh
  npm install prisma --save-dev
  npm install @prisma/client
  npx prisma init
  ```
- This creates a `prisma/` folder and `.env` file.

### 2.4 Configure database connection

- Edit `.env` and set:
  ```env
  DATABASE_URL="postgresql://postgres:<your_password>@localhost:5432/josepaulocamp"
  ```

### 2.5 Next steps

- Proceed to schema design and migration.

---

**Commit:** chore: set up PostgreSQL and Prisma ORM

## 3. Design Relational Schema

### 3.1 Map MongoDB collections to SQL tables

- User → User
- Campground → Campground
- Review → Review
- Images (embedded) → Image (separate table)

### 3.2 Define schema (Prisma)

```prisma
model User {
	id        Int       @id @default(autoincrement())
	email     String    @unique
	username  String    @unique
	password  String
	campgrounds Campground[] @relation("UserCampgrounds")
	reviews   Review[]
}

model Campground {
	id          Int       @id @default(autoincrement())
	title       String
	description String
	price       Float
	location    String
	authorId    Int
	author      User      @relation("UserCampgrounds", fields: [authorId], references: [id])
	reviews     Review[]
	images      Image[]
	geometry    Json
	createdAt   DateTime  @default(now())
	updatedAt   DateTime  @updatedAt
}

model Review {
	id        Int      @id @default(autoincrement())
	body      String
	rating    Int
	authorId  Int
	campgroundId Int
	author    User     @relation(fields: [authorId], references: [id])
	campground Campground @relation(fields: [campgroundId], references: [id])
	createdAt DateTime @default(now())
	updatedAt DateTime @updatedAt
}

model Image {
	id           Int         @id @default(autoincrement())
	url          String
	filename     String
	campgroundId Int
	campground   Campground  @relation(fields: [campgroundId], references: [id])
}
```

### 3.3 Notes

- Embedded images are now a separate table with a foreign key to Campground.
- Geometry is stored as JSON.
- All relationships are enforced with foreign keys.

---

**Commit:** feat: design and document SQL schema

## 4. Set Up ORM

- Integrate an ORM (Prisma or Sequelize) into the project.
- Configure database connection and models.

## 5. Implement SQL Models

- Create SQL table definitions and ORM models for User, Campground, Review, and related entities.
- Add relationships (foreign keys, constraints).

## 6. Refactor Backend Code

- Replace Mongoose logic with ORM/SQL queries in controllers and routes.
- Update data access patterns throughout the codebase.

## 7. Data Migration

- Write scripts to export data from MongoDB and import into PostgreSQL.
- Transform nested/embedded documents as needed.
- Validate data integrity post-migration.

## 8. Testing

- Test all CRUD operations and relationships.
- Ensure application behavior matches previous functionality.

## 9. Documentation & Training

- Update project documentation to reflect new database structure and usage.
- Train team members on the new stack and ORM usage.

---

## Recommendations

- Keep MongoDB as a backup until migration is fully validated.
- Use version control for all migration scripts and schema changes.
- Perform migration in a staging environment before production.

---

## Commit Strategy

Each step will be committed with a clear message, e.g.:

- `chore: analyze and document current MongoDB data models and relationships`
- `chore: set up PostgreSQL and ORM`
- `feat: implement SQL schema and models`
- ...and so on.

---

For questions or further details, see the commit history or contact the project maintainer.
