# 🐳 Docker Setup Guide

## Overview

This project includes Docker containerization for both development and production environments. The setup includes:

- **Backend**: Express.js API with Prisma ORM
- **Frontend**: React SPA with Vite
- **Database**: PostgreSQL 16
- **Architecture**: Multi-stage builds for optimized images

---

## 📚 Understanding Containers - Complete Guide

### What Are Containers?

Containers are lightweight, standalone packages that include everything needed to run your application: code, runtime, libraries, and dependencies. Think of them as "shipping containers" for software - they ensure your application runs the same way everywhere.

### Our Three-Container Architecture

```
┌─────────────────────────────────────────────────┐
│                Your Computer                     │
├─────────────┬──────────────┬────────────────────┤
│   Frontend  │   Backend    │    Database        │
│   Container │   Container  │    Container       │
│  (React +   │  (Express +  │   (PostgreSQL)     │
│   Vite)     │   Prisma)    │                    │
│   Port      │   Port       │    Port            │
│   5173      │   3000       │    5432            │
└─────────────┴──────────────┴────────────────────┘
```

**Why 3 separate containers?**

- **Isolation**: Each service runs independently
- **Scalability**: Scale each part separately
- **Maintainability**: Update one without affecting others

### How It Works: Docker Compose Orchestration

The `docker-compose.yml` file orchestrates all containers with this startup sequence:

1. **PostgreSQL container** starts and becomes healthy
2. **Backend** waits for database, runs migrations, starts API
3. **Frontend** builds and serves React app connected to backend

### Multi-Stage Builds Explained

Each Dockerfile uses multi-stage builds (building in layers):

- **Stage 1 (deps)**: Install dependencies only
- **Stage 2 (development)**: Full tooling, hot-reload (~350MB)
- **Stage 3 (builder)**: Build production assets
- **Stage 4 (production)**: Minimal final image (~180MB backend, ~25MB frontend)

**Result**: Fast development, efficient production.

---

## 🎯 Why Use Containers?

### The "It Works on My Machine" Problem - SOLVED

**Before containers:**

```
Developer 1: Node 18, PostgreSQL 14, Windows
Developer 2: Node 20, PostgreSQL 16, Mac
Production: Node 16, PostgreSQL 15, Linux

Result: "It worked on my machine!" 😫
```

**With containers:**

```
Everyone: Same Node 20-alpine, PostgreSQL 16, same environment
Result: Identical behavior everywhere ✅
```

### Simple Setup (New Developer Experience)

**Without Docker (30+ steps):**

1. Install Node.js 20
2. Install PostgreSQL 16
3. Configure PostgreSQL
4. Create database
5. Set environment variables
6. Install dependencies
7. Run migrations
8. Configure Cloudinary
9. Configure Mapbox
   ... (troubleshoot for hours)

**With Docker (3 steps):**

```bash
git clone <repo>
cp .env.example .env
docker-compose up
# Done in 5 minutes! ✨
```

---

## ✅ Key Benefits for This Project

### 1. Database Isolation

Your PostgreSQL runs in a container with no conflicts with other projects. Easy to reset: `docker-compose down -v`

### 2. Prisma Reliability

- Prisma Client generated automatically
- Migrations run on startup
- No manual steps needed

### 3. Development Speed

- Hot-reload works perfectly
- Changes reflect instantly
- No server restarts needed

### 4. Team Collaboration

New team member joins:

1. Clone repo → 2. `docker-compose up` → 3. Start coding (in 5 minutes)

### 5. Environment Parity

Development, testing, staging, and production all run the same configuration.

### 6. Deployment Ready

Same containers in production, just switch to `docker-compose.prod.yml`. Zero deployment surprises.

---

## 📊 Pros and Cons

### ✅ PROS

#### Consistency

- Same environment for all developers
- No version conflicts
- Predictable behavior

#### Isolation

- Each project in own containers
- No port conflicts
- No dependency clashes

#### Easy Onboarding

- New developers productive in minutes
- No complex setup docs
- Fewer support tickets

#### Scalability

```bash
# Need more backend instances?
docker-compose up --scale backend=3
```

#### CI/CD Integration

GitHub Actions can test in containers with the same environment as production.

#### Portability

- Runs on Windows, Mac, Linux
- Move to cloud easily (AWS ECS, GCP Cloud Run)
- Kubernetes-ready if needed

#### Resource Efficiency

- Lighter than VMs (Virtual Machines)
- Fast startup (seconds, not minutes)
- Share OS kernel

#### Version Control

Infrastructure as code - Dockerfile in git tracks changes over time.

### ❌ CONS

#### 1. Learning Curve

Need to understand Docker concepts, Docker Compose syntax, and debugging inside containers.

**Mitigation:** This comprehensive documentation and simple commands.

#### 2. Initial Setup Time

First build takes 5-10 minutes and downloads ~500MB of base images.

**Mitigation:** Only once per developer, cached after.

#### 3. Disk Space

Images take space: Backend (350MB dev), Frontend (280MB dev), PostgreSQL (230MB) ≈ 860MB total.

**Mitigation:** Acceptable for modern machines, can prune unused images.

#### 4. Performance on Windows

File I/O slower than native (especially with WSL2). Hot-reload may need polling mode.

**Mitigation:**

```yaml
environment:
  CHOKIDAR_USEPOLLING: true
```

#### 5. Debugging Complexity

Can't just use `localhost:5432` directly - need `docker-compose exec backend sh`

**Mitigation:** VS Code Docker extension, clear documentation.

#### 6. State Management

Data lost if you run `docker-compose down -v`. Need to understand volumes.

**Mitigation:** Clear documentation on volumes and backups.

---

## 🎓 Real-World Benefits for JosePauloCamp

### Scenario 1: New Team Member

- **Without Docker**: 2-4 hours setup + troubleshooting
- **With Docker**: 10 minutes
- **Saved**: 2-4 hours per person × team size

### Scenario 2: Database Issue

```bash
# Problem: Database corrupted during development
# Solution: docker-compose down -v && docker-compose up
# Time: 2 minutes
```

### Scenario 3: Production Deployment

- **Without Docker**: SSH, install dependencies, configure services, pray 🙏
- **With Docker**: `docker-compose -f docker-compose.prod.yml up -d` ✅

### Scenario 4: Testing Different Node Versions

Change `FROM node:20-alpine` → `FROM node:22-alpine` in Dockerfile, rebuild. No system-wide changes needed!

---

## 💡 When Containers Make Sense

This project checks all the boxes:

✅ Multi-service architecture (Frontend, Backend, Database)  
✅ Team collaboration (Multiple developers)  
✅ Database dependency (PostgreSQL setup complex)  
✅ Production deployment (Need consistency)  
✅ Complex dependencies (Prisma, Cloudinary, Mapbox)  
✅ Long-term project (Worth initial investment)

**Recommendation:** Docker is an excellent choice for JosePauloCamp.

---

## 📈 ROI (Return on Investment)

### Investment

- 1-2 days to set up Docker properly ✅ (Already done!)
- Learning Docker basics (ongoing)

### Return

- Save 2-4 hours per new developer
- Reduce deployment bugs by ~80%
- Faster onboarding
- Easier testing
- Production confidence

**For a team project: HIGH ROI** 🎯

---

## 📋 Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (v20.10+)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2.0+)
- Git

---

## 🚀 Quick Start (Development)

### 1. Clone and Setup Environment

```bash
# Clone the repository
git clone <repository-url>
cd JosePauloCamp

# Copy environment example
cp .env.example .env

# Edit .env with your values
# Required: CLOUDINARY_*, MAPBOX_TOKEN
```

### 2. Start All Services

```bash
# Build and start all containers
docker-compose up --build

# Or run in detached mode
docker-compose up -d
```

This will start:

- PostgreSQL on `localhost:5432`
- Backend API on `localhost:3000`
- Frontend dev server on `localhost:5173`

### 3. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api
- **Health Check**: http://localhost:3000/api/health

---

## 🛠️ Development Workflow

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Run Commands in Containers

```bash
# Backend shell
docker-compose exec backend sh

# Frontend shell
docker-compose exec frontend sh

# Run Prisma commands
docker-compose exec backend npx prisma studio
docker-compose exec backend npx prisma migrate dev

# Database shell
docker-compose exec postgres psql -U yelpcamp -d yelpcamp
```

### Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes data)
docker-compose down -v
```

### Rebuild After Changes

```bash
# Rebuild specific service
docker-compose up --build backend

# Rebuild all
docker-compose up --build
```

---

## 🏭 Production Deployment

### 1. Production Compose File

```bash
# Use production compose file
docker-compose -f docker-compose.prod.yml up -d
```

### 2. Environment Variables (Production)

Ensure these are set in your production `.env`:

```env
NODE_ENV=production
DB_USER=your_db_user
DB_PASSWORD=strong_secure_password
DB_NAME=yelpcamp_prod
SECRET=your-very-long-random-secret-at-least-32-chars
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_KEY=your_api_key
CLOUDINARY_SECRET=your_api_secret
MAPBOX_TOKEN=your_mapbox_token
FRONTEND_URL=https://yourdomain.com
```

### 3. SSL/HTTPS Setup (Optional)

The production setup includes an nginx service for SSL termination:

```bash
# Generate SSL certificates (Let's Encrypt example)
mkdir -p nginx/ssl
# Add your SSL certificates to nginx/ssl/
```

---

## 📦 Docker Images

### Image Sizes (Approximate)

- Backend (development): ~350MB
- Backend (production): ~180MB
- Frontend (development): ~280MB
- Frontend (production): ~25MB (nginx)
- PostgreSQL: ~230MB

### Multi-Stage Builds

Both Dockerfiles use multi-stage builds:

1. **deps**: Install dependencies
2. **development**: Hot-reload development
3. **builder**: Build production assets
4. **production**: Minimal production image

---

## 🔧 Configuration Details

### Backend Container

- **Base Image**: `node:20-alpine`
- **Working Directory**: `/app`
- **Exposed Port**: `3000`
- **Health Check**: Prisma connection to PostgreSQL
- **Features**:
  - Hot-reload in development
  - Non-root user in production
  - Prisma Client generation on build
  - Automatic migrations on startup

### Frontend Container

- **Development**: `node:20-alpine` with Vite dev server
- **Production**: `nginx:alpine` serving static files
- **Exposed Port**: `5173` (dev), `80` (prod)
- **Features**:
  - Hot-reload in development
  - Optimized static serving with nginx
  - Gzip compression
  - SPA routing support

### Database Container

- **Image**: `postgres:16-alpine`
- **Persistent Volume**: `postgres_data`
- **Health Check**: `pg_isready`
- **Features**:
  - Data persistence
  - Automatic initialization
  - Health monitoring

---

## 🐛 Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose logs backend

# Remove old containers and volumes
docker-compose down -v
docker-compose up --build
```

### Database connection issues

```bash
# Verify PostgreSQL is running
docker-compose ps

# Check database logs
docker-compose logs postgres

# Connect to database
docker-compose exec postgres psql -U yelpcamp -d yelpcamp
```

### Port conflicts

If ports 3000, 5173, or 5432 are already in use:

```bash
# Edit docker-compose.yml and change port mappings
# Example: "5433:5432" instead of "5432:5432"
```

### Hot reload not working

```bash
# On Windows, ensure volumes are working correctly
# May need to use polling mode for file watching

# In docker-compose.yml, add to backend service:
environment:
  CHOKIDAR_USEPOLLING: true
```

### Prisma Client generation fails

```bash
# Manually generate Prisma Client
docker-compose exec backend npx prisma generate

# Or rebuild the backend container
docker-compose up --build backend
```

### Frontend can't reach backend

- Verify `VITE_API_URL` in docker-compose.yml points to `http://localhost:3000/api`
- Check CORS settings in backend allow `http://localhost:5173`
- Ensure backend is running: `docker-compose ps`

---

## 🎯 Best Practices

### Development

1. Use `docker-compose.yml` for development
2. Keep volumes mounted for hot-reload
3. Use `.env` file for local configuration
4. Don't commit `.env` file

### Production

1. Use `docker-compose.prod.yml` for production
2. Set strong passwords and secrets
3. Use SSL certificates
4. Monitor logs and health checks
5. Regular backups of PostgreSQL data volume
6. Use environment variable management (AWS Secrets, etc.)

### Security

1. Never expose PostgreSQL port in production
2. Use non-root users in containers
3. Scan images for vulnerabilities: `docker scan josepaulocamp-backend`
4. Keep base images updated
5. Use secrets management for sensitive data

---

## 📊 Monitoring

### Health Checks

```bash
# Backend health
curl http://localhost:3000/api/health

# PostgreSQL health
docker-compose exec postgres pg_isready

# Container status
docker-compose ps
```

### Resource Usage

```bash
# View resource consumption
docker stats

# View specific container
docker stats josepaulocamp-backend
```

---

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
name: Docker Build

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build Backend
        run: docker build -t josepaulocamp-backend:latest .

      - name: Build Frontend
        run: docker build -t josepaulocamp-frontend:latest ./client
```

---

## 🚢 Kubernetes Migration

Ready to scale? This Docker setup is Kubernetes-ready:

1. Convert Docker Compose to K8s manifests using [Kompose](https://kompose.io/)
2. Create separate deployments for backend, frontend, and database
3. Use persistent volume claims for PostgreSQL data
4. Set up ingress for routing
5. Implement horizontal pod autoscaling

---

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Prisma Docker Guide](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-docker)
- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)

---

## 🤝 Contributing

When adding new services or modifying Docker setup:

1. Update both `docker-compose.yml` and `docker-compose.prod.yml`
2. Test build times and image sizes
3. Update this documentation
4. Verify hot-reload still works in development

---

_Last updated: 2025-12-16_
