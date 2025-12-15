# Database Conversion Plan: MongoDB to Relational SQL (PostgreSQL)

## Overview

This document outlines the step-by-step plan to migrate the current project from MongoDB (Mongoose) to a relational SQL database, specifically PostgreSQL. Each step will be committed separately for traceability.

---

## 1. Analyze Current Data Models

- Review all Mongoose schemas (User, Campground, Review).
- Identify relationships (one-to-many, many-to-many, embedded documents).
- Document the current structure and relationships.

## 2. Choose and Set Up Relational Database

- Select PostgreSQL as the target database.
- Set up PostgreSQL locally or in the cloud.
- Install required Node.js packages (e.g., `pg`, `prisma`, or `sequelize`).

## 3. Design Relational Schema

- Map each MongoDB collection to a SQL table.
- Define primary keys, foreign keys, and indexes.
- Normalize data: move embedded documents to related tables.
- Document the new schema.

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
