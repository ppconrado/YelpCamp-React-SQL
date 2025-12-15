# PostgreSQL Setup Instructions

## 1. Install PostgreSQL

- Download and install PostgreSQL from https://www.postgresql.org/download/ (choose your OS).
- Set a password for the default `postgres` user during installation.

## 2. Create a Database

- Open the PostgreSQL shell or use a GUI (e.g., pgAdmin).
- Run:
  ```sql
  CREATE DATABASE josepaulocamp;
  ```

## 3. Install ORM (Prisma)

- In your project root, run:
  ```sh
  npm install prisma --save-dev
  npm install @prisma/client
  npx prisma init
  ```
- This creates a `prisma/` folder and `.env` file.

## 4. Configure Database Connection

- Edit `.env` and set:
  ```env
  DATABASE_URL="postgresql://postgres:<your_password>@localhost:5432/josepaulocamp"
  ```

## 5. Next Steps

- Proceed to schema design and migration.
