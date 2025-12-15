# Database Conversion Plan: MongoDB to Relational SQL (PostgreSQL)

## Overview

This document outlines the step-by-step plan to migrate the current project from MongoDB (Mongoose) to a relational SQL database, specifically PostgreSQL. Each step will be committed separately for traceability.

---

## 1. Analyze Current Data Models

- Review all Mongoose schemas (User, Campground, Review).
- Identify relationships (one-to-many, many-to-many, embedded documents).
- Document the current structure and relationships.

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
