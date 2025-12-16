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

### 2.6 Docker PostgreSQL Considerations

**Important: Docker Creates an Isolated Database Environment**

When deploying with Docker, the PostgreSQL container is a **completely separate database instance** from any previously used database (local PostgreSQL on Windows, cloud providers like Neon/Supabase, etc.).

**Understanding Database Isolation:**

```
BEFORE DOCKER (Development):
Your App → External PostgreSQL Database
          (Local Windows install OR Cloud provider)
          ✓ Contains all existing data

AFTER DOCKER:
Docker Container (App) → Docker Container (PostgreSQL)
                         ✗ Fresh, empty database
                         ✓ Isolated environment

Your original database still exists with all data intact!
```

**Three Deployment Options:**

1. **Docker with Fresh Start (Current Implementation)** ✅

   - Docker PostgreSQL starts empty
   - Data persists in Docker volume: `josepaulocamp_postgres_data`
   - Best for: Development, testing, clean deployments
   - Trade-off: Need to re-create data or migrate

2. **Docker Connected to External Database**

   - Point Docker containers to existing database
   - Modify `DATABASE_URL` in docker-compose.yml to external connection
   - Best for: Preserving existing data, cloud database usage
   - Example:
     ```yaml
     environment:
       DATABASE_URL: postgresql://user:pass@external-host.com:5432/yelpcamp
     ```

3. **Migrate Data to Docker PostgreSQL**
   - Export data from original database
   - Import into Docker PostgreSQL container
   - Best for: Complete Docker isolation with existing data
   - See detailed migration steps below

**Detailed Data Migration Process:**

If you need to migrate existing data from a previous PostgreSQL database to Docker PostgreSQL:

**Step 1: Export Data from Original Database**

_From Local PostgreSQL (Windows):_

```bash
# Open PowerShell/Command Prompt
# Replace <your_password> with your actual password
pg_dump -U postgres -d yelpcamp -h localhost -p 5432 > backup.sql

# Or set password as environment variable to avoid prompt:
$env:PGPASSWORD="your_password"
pg_dump -U postgres -d yelpcamp -h localhost -p 5432 > backup.sql
```

_From Cloud Database (Neon/Supabase/Railway):_

```bash
# Get connection string from your cloud provider
# Example for Neon:
pg_dump "postgresql://user:password@host.region.neon.tech:5432/yelpcamp?sslmode=require" > backup.sql

# Or use separate parameters:
pg_dump -h host.region.neon.tech -U username -d yelpcamp -p 5432 > backup.sql
# (will prompt for password)
```

**Step 2: Verify Backup File**

```bash
# Check backup file was created and has content
ls -l backup.sql      # Linux/Mac
dir backup.sql        # Windows

# Should show file size > 0 bytes
# Optionally inspect first few lines:
head -n 20 backup.sql  # Linux/Mac
Get-Content backup.sql -Head 20  # PowerShell
```

**Step 3: Ensure Docker PostgreSQL is Running**

```bash
# Start Docker containers if not running
docker compose up -d

# Verify database container is healthy
docker compose ps

# Should show josepaulocamp-db as "Up (healthy)"
```

**Step 4: Copy Backup to Docker Container**

```bash
# Copy backup.sql file into the container
docker cp backup.sql josepaulocamp-db:/tmp/backup.sql

# Verify copy succeeded
docker exec josepaulocamp-db ls -lh /tmp/backup.sql
```

**Step 5: Import Data into Docker PostgreSQL**

```bash
# Drop existing tables (if any) to avoid conflicts
docker exec josepaulocamp-db psql -U yelpcamp -d yelpcamp -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Import the backup
docker exec -i josepaulocamp-db psql -U yelpcamp -d yelpcamp < backup.sql

# Alternative: Import from inside container
docker exec josepaulocamp-db psql -U yelpcamp -d yelpcamp -f /tmp/backup.sql
```

**Step 6: Verify Migration**

```bash
# Check tables were created
docker exec josepaulocamp-db psql -U yelpcamp -d yelpcamp -c "\dt"

# Check row counts
docker exec josepaulocamp-db psql -U yelpcamp -d yelpcamp -c "
SELECT
  'User' as table, COUNT(*) as count FROM \"User\"
UNION ALL
SELECT 'Campground', COUNT(*) FROM \"Campground\"
UNION ALL
SELECT 'Review', COUNT(*) FROM \"Review\"
UNION ALL
SELECT 'Image', COUNT(*) FROM \"Image\";
"

# Sample a few records
docker exec josepaulocamp-db psql -U yelpcamp -d yelpcamp -c "SELECT id, username, email FROM \"User\" LIMIT 5;"
```

**Step 7: Run Prisma Migrations (If Schema Changed)**

```bash
# If Prisma schema differs from backup, sync it
docker compose exec backend npx prisma migrate deploy

# Or generate Prisma Client
docker compose exec backend npx prisma generate
```

**Step 8: Restart Application**

```bash
# Restart backend to reconnect with migrated data
docker compose restart backend

# Check logs for errors
docker compose logs -f backend
```

**Step 9: Test Application**

- Open browser and verify:
  - Users can log in with existing credentials
  - Campgrounds display correctly with images
  - Reviews are visible
  - Map locations render properly

**Troubleshooting Migration Issues:**

_"relation does not exist" errors:_

```bash
# Prisma table names are case-sensitive ("User" not "user")
# Check if backup used different casing
docker exec josepaulocamp-db psql -U yelpcamp -d yelpcamp -c "\dt"

# If tables are lowercase, might need to adjust Prisma schema or backup
```

_Foreign key constraint violations:_

```bash
# Disable foreign key checks during import (PostgreSQL doesn't support this directly)
# Instead, import in specific order or use --disable-triggers

docker exec josepaulocamp-db psql -U yelpcamp -d yelpcamp -c "
SET session_replication_role = replica;
-- Then run import
SET session_replication_role = DEFAULT;
"
```

_"password authentication failed" errors:_

```bash
# Verify Docker PostgreSQL credentials match
docker compose exec postgres psql -U yelpcamp -d yelpcamp -c "SELECT current_user, current_database();"

# Check .env file has correct DATABASE_URL
docker compose exec backend env | grep DATABASE_URL
```

_Backup file too large:_

```bash
# Compress backup before copying
gzip backup.sql
docker cp backup.sql.gz josepaulocamp-db:/tmp/
docker exec josepaulocamp-db gunzip /tmp/backup.sql.gz
```

---

**Current Project Choice: Fresh Start**

This project uses Docker with an isolated PostgreSQL instance. Benefits:

- ✅ Complete environment reproducibility
- ✅ No external dependencies
- ✅ Easy to reset and rebuild
- ✅ Perfect for learning and development
- ✅ Data persists across container restarts via Docker volumes

**Data Persistence:**

- Database files stored in Docker volume: `josepaulocamp_postgres_data`
- Sessions persist across container restarts (connect-pg-simple stores in PostgreSQL)
- To completely reset: `docker compose down -v` (deletes volumes)
- To preserve data: `docker compose stop` / `docker compose start`

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
