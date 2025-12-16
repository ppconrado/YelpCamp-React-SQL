# 🐛 Docker Implementation - Error Analysis & Solutions

## Overview

This document explains the errors encountered during the MongoDB → PostgreSQL + Docker container migration, their root causes, and solutions. Understanding these issues will help in future migrations and troubleshooting.

---

## Table of Contents

1. [Dependency Conflict (multer-storage-cloudinary)](#error-1-dependency-conflict)
2. [Prisma Generation Requires DATABASE_URL](#error-2-prisma-generation-requires-database_url)
3. [Invalid Dev Script](#error-3-invalid-dev-script)
4. [Environment Variable Name Mismatch](#error-4-environment-variable-name-mismatch)
5. [Double /api/api Path](#error-5-double-apiapi-path)
6. [Key Learnings](#key-learnings)

---

## Error 1: Dependency Conflict (multer-storage-cloudinary)

### What Happened

```bash
npm error ERESOLVE could not resolve
npm error peer cloudinary@"^1.21.0" from multer-storage-cloudinary@4.0.0
npm error Conflicting peer dependency: cloudinary@1.41.3
```

**Docker build failed** when trying to install dependencies with `npm ci`.

### Root Cause

**Version Incompatibility:**

- Project uses **Cloudinary v2.8.0** (modern version)
- **multer-storage-cloudinary v4.0.0** requires **Cloudinary v1.x** only
- NPM's strict peer dependency checking in `npm ci` refuses mismatched versions

**Technical Details:**

```javascript
// multer-storage-cloudinary package.json
"peerDependencies": {
  "cloudinary": "^1.21.0"  // Only version 1.x compatible
}

// Our project's package.json
"dependencies": {
  "cloudinary": "^2.8.0"  // Version 2.x
}
```

**Why NPM Blocks This:**

- Peer dependencies are requirements, not suggestions
- `npm ci` (clean install) enforces strict version matching
- Prevents runtime errors from API incompatibilities

### The Solution

**Modified Dockerfile:**

```dockerfile
# Before (fails):
RUN npm ci

# After (works):
RUN npm ci --legacy-peer-deps
```

**What `--legacy-peer-deps` Does:**

- Bypasses strict peer dependency checks
- Installs packages using NPM 6 behavior
- Assumes developer knows compatibility is acceptable

**Why This Works:**

- Cloudinary v2 maintains backward compatibility with v1 API
- multer-storage-cloudinary works despite version mismatch
- Actual functionality is preserved

### Better Long-term Solutions

1. **Update Package:**

   ```bash
   # Find newer version supporting Cloudinary v2
   npm search multer-storage-cloudinary
   ```

2. **Use Native Cloudinary Upload:**

   ```javascript
   // Replace multer-storage-cloudinary
   const cloudinary = require('cloudinary').v2;
   cloudinary.uploader.upload(file.path);
   ```

3. **Lock Cloudinary to v1:**
   ```json
   {
     "cloudinary": "^1.41.0", // Downgrade
     "multer-storage-cloudinary": "^4.0.0"
   }
   ```

### Lesson Learned

**Dependency Management Best Practices:**

- Check peer dependencies before major upgrades
- Test package compatibility in development
- Document version constraints in README
- Consider alternatives when packages aren't maintained

---

## Error 2: Prisma Generation Requires DATABASE_URL

### What Happened

```bash
Failed to load config file "/app" as a TypeScript/JavaScript module.
Error: PrismaConfigEnvError: Missing required environment variable: DATABASE_URL
```

**Docker build failed** at the `RUN npx prisma generate` step.

### Root Cause

**Build vs Runtime Environment:**

Prisma 7 requires `DATABASE_URL` during the **build phase**, but Docker environment variables from `docker-compose.yml` are only available at **runtime**.

**The Process:**

```
┌─────────────────────────────────────────────────┐
│ BUILD TIME (Dockerfile - Image Creation)        │
├─────────────────────────────────────────────────┤
│ RUN npm ci                                       │
│ COPY . .                                         │
│ RUN npx prisma generate  ❌ No DATABASE_URL     │
│ → Reads prisma.config.ts                        │
│ → Needs env("DATABASE_URL")                     │
│ → Not available yet!                            │
└─────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────┐
│ RUNTIME (Container Start - docker-compose up)   │
├─────────────────────────────────────────────────┤
│ Environment variables loaded ✅                 │
│ DATABASE_URL now available                      │
│ Container starts successfully                   │
└─────────────────────────────────────────────────┘
```

**Why Prisma Needs It:**

```typescript
// prisma.config.ts
export default {
  datasource: {
    url: env('DATABASE_URL'), // ❌ Required even for type generation
  },
};
```

### The Solution

**Modified Dockerfile:**

```dockerfile
# Development image
FROM base AS development
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set a dummy DATABASE_URL for Prisma generation (not used at build time)
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"

# Generate Prisma Client
RUN npx prisma generate

EXPOSE 3000
CMD ["npm", "run", "dev"]
```

**Why This Works:**

1. **Prisma Client Generation is Schema-Based:**

   ```
   npx prisma generate:
   ├── Reads schema.prisma file
   ├── Validates DATABASE_URL format (not connection)
   ├── Generates TypeScript types from schema
   └── Creates Prisma Client code

   NO ACTUAL DATABASE CONNECTION NEEDED!
   ```

2. **Dummy URL Provides Valid Format:**

   ```
   postgresql://user:password@host:port/database
   ↑ Valid PostgreSQL connection string format
   ```

3. **Runtime Uses Real URL:**
   ```yaml
   # docker-compose.yml
   environment:
     DATABASE_URL: postgresql://yelpcamp:password@postgres:5432/yelpcamp
   ```

### Alternative Solutions

**Option 1: Skip Generation in Dockerfile**

```dockerfile
# Don't generate during build
# RUN npx prisma generate  ❌ Removed

# Generate at runtime in docker-compose
command: sh -c "npx prisma generate && npm run dev"
```

**Option 2: Build Argument**

```dockerfile
# Accept URL as build arg
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL
RUN npx prisma generate
```

```yaml
# docker-compose.yml
services:
  backend:
    build:
      args:
        DATABASE_URL: postgresql://dummy:dummy@localhost:5432/dummy
```

### Lesson Learned

**Docker Build Context:**

- Separate build-time and runtime concerns
- Environment variables have different scopes
- Build arguments vs environment variables serve different purposes
- Prisma needs URL format, not actual connection

---

## Error 3: Invalid Dev Script

### What Happened

```bash
> josepaulocamp@1.0.0 dev
> app.js

sh: app.js: not found
```

Backend container started but **immediately exited** with error.

### Root Cause

**Incorrect NPM Script:**

```json
// package.json (wrong)
{
  "scripts": {
    "dev": "app.js" // ❌ Tries to execute app.js as command
  }
}
```

**Shell Interpretation:**

```bash
# What happens when you run: npm run dev
npm run dev
  → Executes script: "app.js"
  → Shell interprets: app.js (as command name)
  → Searches PATH for executable named "app.js"
  → Not found! ❌

# What should happen:
npm run dev
  → Executes script: "node app.js"
  → Shell finds: "node" command in PATH
  → Node.js binary interprets: app.js file ✅
```

**Why It Worked Before:**

- Likely ran manually with `node app.js`
- Or used different script like `npm start`
- The `dev` script was incorrect but unused

### The Solution

**Fixed package.json:**

```json
{
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "start": "node app.js",
    "dev": "node app.js", // ✅ Correct
    "client": "npm run dev --prefix client",
    "dev:full": "concurrently \"npm run start\" \"npm run client\""
  }
}
```

**Restart Container:**

```bash
docker compose restart backend
```

### Common Script Patterns

**Basic Execution:**

```json
{
  "start": "node server.js",
  "dev": "node app.js"
}
```

**With Environment:**

```json
{
  "dev": "NODE_ENV=development node app.js",
  "prod": "NODE_ENV=production node app.js"
}
```

**With Nodemon (Auto-reload):**

```json
{
  "dev": "nodemon app.js",
  "start": "node app.js"
}
```

**Complex Workflows:**

```json
{
  "dev": "npx prisma generate && npx prisma migrate dev && node app.js"
}
```

### Lesson Learned

**NPM Scripts Best Practices:**

- Always prefix with appropriate runtime (`node`, `nodemon`, etc.)
- Test scripts locally before containerizing
- Use standard names: `start` (production), `dev` (development)
- Document custom scripts in README

---

## Error 4: Environment Variable Name Mismatch

### What Happened

```bash
❌ ERRO: Variáveis de ambiente obrigatórias não configuradas:
   - DB_URL

Crie um arquivo .env na raiz do projeto com essas variáveis.
```

Server started but **validation failed**, exited immediately.

### Root Cause

**Two Naming Conventions Coexisting:**

**Old MongoDB Code:**

```javascript
// utils/validateEnv.js (before)
const requiredEnvVars = ['DB_URL', 'SECRET'];

// Old connection pattern
const dbUrl = process.env.DB_URL;
mongoose.connect(dbUrl);
```

**New PostgreSQL/Prisma Code:**

```javascript
// docker-compose.yml
environment:
  DATABASE_URL: postgresql://...  // ✅ Prisma standard

// lib/prisma.js
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL  // ✅ Standard name
    }
  }
});
```

**The Conflict:**

- Code expects `DATABASE_URL` (new)
- Validator checks for `DB_URL` (old)
- Variable mismatch causes false failure

### The Solution

**Updated validateEnv.js:**

```javascript
// Validação de variáveis de ambiente obrigatórias
const requiredEnvVars = ['DATABASE_URL', 'SECRET']; // ✅ Changed from DB_URL

function validateEnv() {
  const missing = requiredEnvVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    console.error(
      '❌ ERRO: Variáveis de ambiente obrigatórias não configuradas:'
    );
    missing.forEach((varName) => console.error(`   - ${varName}`));
    console.error(
      '\nCrie um arquivo .env na raiz do projeto com essas variáveis.'
    );
    process.exit(1);
  }

  // Avisos para variáveis opcionais mas recomendadas
  if (!process.env.MAPBOX_TOKEN) {
    console.warn(
      '⚠️  AVISO: MAPBOX_TOKEN não configurado. A geocodificação não funcionará.'
    );
  }

  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_KEY ||
    !process.env.CLOUDINARY_SECRET
  ) {
    console.warn(
      '⚠️  AVISO: Credenciais do Cloudinary não configuradas. Upload de imagens não funcionará.'
    );
  }

  console.log('✅ Variáveis de ambiente validadas com sucesso');
}

module.exports = { validateEnv };
```

### Environment Variable Standards

| Convention      | Used By                                 | Standard Level           |
| --------------- | --------------------------------------- | ------------------------ |
| `DATABASE_URL`  | Prisma, Heroku, Vercel, Railway, Render | ⭐⭐⭐ Industry Standard |
| `DB_URL`        | Custom MongoDB apps                     | ⭐ Legacy/Custom         |
| `MONGO_URI`     | MongoDB-specific projects               | ⭐⭐ MongoDB Convention  |
| `DB_CONNECTION` | Laravel, some PHP apps                  | ⭐⭐ Framework-specific  |

**Why DATABASE_URL is Better:**

1. **Universal Recognition:**

   ```bash
   # Automatically detected by:
   - Prisma
   - Sequelize
   - TypeORM
   - Django
   - Rails
   - Deployment platforms
   ```

2. **Zero Configuration Deployment:**

   ```yaml
   # On Render/Railway/Heroku:
   # DATABASE_URL is automatically injected
   # No manual configuration needed!
   ```

3. **Connection Pooling Support:**
   ```
   postgresql://user:pass@host:5432/db?connection_limit=10
   ```

### Lesson Learned

**Environment Variable Best Practices:**

- Use industry standards (`DATABASE_URL`, not custom names)
- Document all required variables in `.env.example`
- Validate early (before app initialization)
- Provide clear error messages with variable names
- Update validators when migrating databases

---

## Error 5: Double /api/api Path

### What Happened

**Backend Logs:**

```bash
GET /api/api/campgrounds 404 3.983 ms - 34
GET /api/api/current-user 404 5.451 ms - 34
POST /api/api/register 404 13.247 ms - 34
```

All API requests returned **404 Not Found**.

### Root Cause

**Path Concatenation Happened Twice:**

**Frontend Configuration:**

```yaml
# docker-compose.yml
frontend:
  environment:
    VITE_API_URL: http://localhost:3000/api # ❌ Has /api suffix
```

**Frontend Code:**

```javascript
// client/src/api/http.js
const apiBaseUrl = import.meta.env.VITE_API_URL;
// apiBaseUrl = "http://localhost:3000/api"

const baseURL = `${apiBaseUrl}/api`; // ❌ Adds another /api
// Result: "http://localhost:3000/api/api"

const http = axios.create({
  baseURL, // http://localhost:3000/api/api ❌
  withCredentials: true,
});

export default http;
```

**How URLs Were Built:**

```javascript
// In campgrounds.js API file:
http.get('/campgrounds')

// Axios combines:
baseURL: http://localhost:3000/api/api  ❌
path:    /campgrounds
Result:  http://localhost:3000/api/api/campgrounds  ❌ 404!
```

**Backend Expected:**

```javascript
// app.js
app.use('/api', userRoutes);
app.use('/api/campgrounds', campgroundRoutes);

// Should receive:
GET /api/campgrounds  ✅
POST /api/register    ✅
```

### The Solution

**Fixed docker-compose.yml:**

```yaml
# Frontend (React + Vite)
frontend:
  environment:
    VITE_API_URL: http://localhost:3000 # ✅ No /api suffix
    VITE_MAPBOX_TOKEN: ${MAPBOX_TOKEN}
```

**How URLs Are Now Built:**

```javascript
// http.js
const apiBaseUrl = "http://localhost:3000"  // ✅ No /api
const baseURL = `${apiBaseUrl}/api`;
// Result: "http://localhost:3000/api" ✅

// When making request:
http.get('/campgrounds')
  → baseURL: http://localhost:3000/api
  → path: /campgrounds
  → Final: http://localhost:3000/api/campgrounds ✅
```

**Rebuild Required:**

```bash
# Environment variables are baked into Vite build
docker compose up -d --build frontend
```

### Path Building Patterns

**✅ Correct Pattern:**

```javascript
// Base without suffix
const BASE = 'http://localhost:3000';
const FULL = `${BASE}/api/endpoint`;
// Result: http://localhost:3000/api/endpoint
```

**❌ Anti-pattern:**

```javascript
// Base with suffix
const BASE = 'http://localhost:3000/api';
const FULL = `${BASE}/api/endpoint`;
// Result: http://localhost:3000/api/api/endpoint  ❌ Double!
```

**Configuration Matrix:**

| VITE_API_URL                | Code Adds | Final URL      | Result   |
| --------------------------- | --------- | -------------- | -------- |
| `http://localhost:3000/api` | `/api`    | `/api/api/...` | ❌ 404   |
| `http://localhost:3000`     | `/api`    | `/api/...`     | ✅ Works |
| `http://localhost:3000/`    | `/api`    | `/api/...`     | ✅ Works |

### Design Considerations

**Why http.js Adds /api:**

1. **Flexibility for Different Backends:**

   ```javascript
   // Backend at different domain
   VITE_API_URL=https://api.example.com  // No /api
   // Code adds /api → https://api.example.com/api
   ```

2. **Production Proxying:**

   ```javascript
   // Vercel rewrites handle /api → backend
   // Frontend can be at https://example.com
   // Backend at https://example.com/api (proxied)
   ```

3. **Centralized Path Management:**
   ```javascript
   // All API paths defined in one place (http.js)
   const baseURL = `${apiBaseUrl}/api`;
   ```

### Lesson Learned

**URL Configuration Best Practices:**

- **Document** expected format in `.env.example`
- **Validate** configuration in development
- **Test** after environment changes
- **Standardize** across environments
- **Avoid** assumptions about trailing slashes

---

## Key Learnings: MongoDB → PostgreSQL + Docker Migration

### 1. Dependency Management Evolution

**MongoDB Stack:**

```json
{
  "mongoose": "^6.0.0", // ORM + Driver combined
  "connect-mongo": "^4.6.0", // Session store
  "mongodb-memory-server": "..." // Testing
}
```

**PostgreSQL Stack:**

```json
{
  "@prisma/client": "^7.1.0", // ORM (type-safe)
  "@prisma/adapter-pg": "^7.1.0", // Database adapter
  "pg": "^8.16.3", // PostgreSQL driver
  "connect-pg-simple": "..." // Session store (optional)
}
```

**Migration Checklist:**

- [ ] Check peer dependencies for all packages
- [ ] Update session store (Mongo → Postgres)
- [ ] Update environment variable names
- [ ] Test in Docker before production
- [ ] Document breaking changes

### 2. Environment Variable Standardization

**Industry Standards to Follow:**

| Variable                     | Purpose             | Standard                          |
| ---------------------------- | ------------------- | --------------------------------- |
| `DATABASE_URL`               | Database connection | PostgreSQL, Prisma, all platforms |
| `SECRET` or `SESSION_SECRET` | Session encryption  | Express-session                   |
| `NODE_ENV`                   | Environment mode    | Node.js standard                  |
| `PORT`                       | Server port         | Platform standard                 |

**Migration Pattern:**

```javascript
// Before (custom names)
DB_URL → DATABASE_URL
MONGO_URI → DATABASE_URL
CLOUDINARY_NAME → CLOUDINARY_CLOUD_NAME

// Update all references:
- validateEnv.js
- docker-compose.yml
- .env.example
- Documentation
```

### 3. Docker Build Context Understanding

**Build-Time (Dockerfile):**

```dockerfile
# Static configuration only
ENV NODE_ENV=production
ARG BUILD_DATE

# No access to:
- docker-compose.yml environment variables
- Runtime secrets
- Dynamic configuration
```

**Runtime (docker-compose.yml):**

```yaml
environment:
  DATABASE_URL: ${DATABASE_URL}
  SECRET: ${SECRET}
  # Available to running container
  # Can be dynamic/secret
```

**Best Practice:**

```dockerfile
# Build: Use dummy values for type generation
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"

# Runtime: Override with real values (docker-compose.yml)
```

### 4. Configuration Validation Layers

**Layer 1: Build Time**

```dockerfile
RUN npx prisma generate  # Validates schema
RUN npm test             # Runs tests
```

**Layer 2: Container Start**

```javascript
// validateEnv.js
validateEnv(); // Check required variables
```

**Layer 3: Application Runtime**

```javascript
// First request
prisma.$connect(); // Validates database connection
```

### 5. Path Resolution Patterns

**Frontend → Backend Communication:**

```
┌──────────────────────────────────────────┐
│ Frontend (React) at localhost:5173      │
│ ├── VITE_API_URL=http://localhost:3000  │
│ └── Code adds: /api                     │
│     Result: http://localhost:3000/api   │
└──────────────────┬───────────────────────┘
                   │ HTTP Request
                   ↓
┌──────────────────────────────────────────┐
│ Backend (Express) at localhost:3000     │
│ ├── app.use('/api', routes)             │
│ └── Handles: /api/campgrounds           │
└──────────────────────────────────────────┘
```

**Rule:** Choose ONE place to add prefixes, document it clearly.

### 6. Migration Phases

**Phase 1: Local Development**

```bash
# Without Docker
npm install
npx prisma migrate dev
npm run dev
```

**Phase 2: Dockerization**

```bash
# Add Docker
docker-compose up --build
# Fix dependency conflicts
# Fix environment variables
```

**Phase 3: Production**

```bash
# Deploy with docker-compose.prod.yml
docker-compose -f docker-compose.prod.yml up -d
```

### 7. Common Pitfalls

**❌ Don't:**

- Mix MongoDB and PostgreSQL environment variable names
- Assume peer dependencies are compatible
- Skip validation during migration
- Forget to rebuild after environment changes
- Use the same configuration for dev and prod

**✅ Do:**

- Test each change incrementally
- Document breaking changes
- Use industry standard variable names
- Validate environment early
- Separate build and runtime concerns

---

## Debugging Checklist

When encountering container issues:

### Build Errors

```bash
# Check build logs
docker compose build backend --no-cache

# Verify Dockerfile syntax
docker compose config

# Test dependency installation locally
npm ci --legacy-peer-deps
```

### Runtime Errors

```bash
# Check container logs
docker compose logs backend --tail=50

# Verify environment variables
docker compose exec backend printenv | grep DATABASE

# Check network connectivity
docker compose exec backend ping postgres

# Verify database connection
docker compose exec postgres psql -U yelpcamp -d yelpcamp
```

### Path Resolution Issues

```bash
# Check frontend API calls (browser console)
# Look for: /api/api (double prefix)

# Verify backend routes
docker compose exec backend sh
node -e "console.log(require('./app.js')._router.stack)"

# Test API directly
curl http://localhost:3000/api/health
```

### Environment Variable Issues

```bash
# Check what container sees
docker compose exec backend printenv

# Verify .env file
cat .env

# Check docker-compose.yml
docker compose config
```

---

## Conclusion

These errors are **normal and expected** during database migrations, especially when:

- Changing database systems (NoSQL → SQL)
- Adding containerization (Docker)
- Updating major versions (Prisma 4 → 7)
- Migrating between environments (local → container)

**Key Takeaway:** Understanding _why_ errors occur is more valuable than just fixing them. This knowledge helps prevent similar issues in future projects and makes you a better developer.

---

_Document created: December 16, 2025_  
_Project: JosePauloCamp - MongoDB to PostgreSQL + Docker Migration_
