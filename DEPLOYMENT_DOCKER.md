# 🐳 Docker Deployment Guide

## 🎯 Overview

This guide covers deploying **JosePauloCamp as a containerized application** on a single VPS/cloud server using Docker. All services (PostgreSQL, Backend, Frontend) run as Docker containers on one machine.

**Best for:** Learning Docker, full control, self-hosting, DevOps experience

> **Alternative:** For easier cloud-based deployment (Vercel + Render), see [DEPLOYMENT.md](DEPLOYMENT.md)

---

## 📊 Deployment Comparison

| Aspect               | Docker (This Guide)             | Cloud Services ([DEPLOYMENT.md](DEPLOYMENT.md)) |
| -------------------- | ------------------------------- | ----------------------------------------------- |
| **Cost**             | $6-12/mo (one server)           | Free tier available                             |
| **Setup Complexity** | More complex (server + Docker)  | Very simple (GUI-based)                         |
| **Maintenance**      | Manual updates via SSH          | Auto-deploy from Git                            |
| **Scalability**      | Limited to server size          | Auto-scaling                                    |
| **Control**          | Full control over everything    | Limited control                                 |
| **SSL/HTTPS**        | Manual setup (Let's Encrypt)    | Automatic                                       |
| **Backups**          | Manual (scripts)                | Automatic                                       |
| **Learning Value**   | High (Docker, Linux, DevOps)    | Low (abstracted away)                           |
| **Best For**         | Learning, self-hosting, control | Production, simplicity                          |

---

## 🏗️ Docker Architecture

```
┌──────────────────────────────────────────────────────────┐
│              VPS/Cloud Server (Ubuntu 22.04)             │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │           Docker Network (app-network)             │ │
│  │                                                    │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │  PostgreSQL Container                        │ │ │
│  │  │  - Image: postgres:16-alpine                 │ │ │
│  │  │  - Port: 5432 (internal)                     │ │ │
│  │  │  - Volume: postgres_data (persistent)        │ │ │
│  │  │  - Tables: User, Campground, Review, session │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  │                    ↓ (DATABASE_URL)               │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │  Backend Container (Node.js)                 │ │ │
│  │  │  - Express + Prisma + connect-pg-simple      │ │ │
│  │  │  - Port: 3000                                │ │ │
│  │  │  - Serves /api/* endpoints                   │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  │                    ↑                              │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │  Frontend Container (Nginx)                  │ │ │
│  │  │  - Serves built React app                    │ │ │
│  │  │  - Ports: 80 (HTTP), 443 (HTTPS)             │ │ │
│  │  │  - Reverse proxy to backend                  │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  │                                                    │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  Access: http://server-ip or https://yourdomain.com     │
└──────────────────────────────────────────────────────────┘
```

---

## 📋 Prerequisites

### Server Requirements

- **OS**: Ubuntu 22.04 LTS (recommended) or similar Linux
- **RAM**: Minimum 2GB (4GB recommended)
- **Storage**: 20GB+ (for OS, Docker images, database)
- **Network**: Public IP address
- **Domain** (optional): For HTTPS/SSL setup

### Required Software

- Docker Engine 24+
- Docker Compose v2.0+
- Git (for cloning repository)

### VPS Provider Recommendations

| Provider            | Plan          | Cost            | Notes                                |
| ------------------- | ------------- | --------------- | ------------------------------------ |
| **DigitalOcean**    | Basic Droplet | $6/mo           | Easiest setup, excellent docs        |
| **Linode (Akamai)** | Shared 2GB    | $12/mo          | Very reliable, fast performance      |
| **AWS EC2**         | t2.micro      | Free tier (1yr) | Complex but powerful, free initially |
| **Hetzner**         | CX11          | €4/mo (~$4.50)  | Cheapest option, EU-based            |
| **Vultr**           | Regular 2GB   | $12/mo          | Good performance, many locations     |

---

## 🚀 Step 1: Server Setup

### 1.1 Create Server Instance

1. Choose your VPS provider (e.g., DigitalOcean)
2. Create new Ubuntu 22.04 LTS server
3. Choose plan (minimum 2GB RAM)
4. Add SSH key or set root password
5. Note your **public IP address**

### 1.2 Connect to Server

```bash
# SSH into your server
ssh root@your-server-ip

# If using key authentication:
ssh -i ~/.ssh/your_key root@your-server-ip
```

### 1.3 Update System

```bash
# Update package lists
sudo apt update

# Upgrade all packages
sudo apt upgrade -y

# Install basic tools
sudo apt install -y curl git vim wget
```

### 1.4 Install Docker

```bash
# Download Docker installation script
curl -fsSL https://get.docker.com -o get-docker.sh

# Run installation script
sudo sh get-docker.sh

# Add current user to docker group (optional, allows running docker without sudo)
sudo usermod -aG docker $USER

# Install Docker Compose plugin
sudo apt install -y docker-compose-plugin

# Verify installation
docker --version
docker compose version
```

Expected output:

```
Docker version 24.0.x, build xxxxxxx
Docker Compose version v2.x.x
```

### 1.5 Configure Firewall

```bash
# Allow SSH (important - don't lock yourself out!)
sudo ufw allow OpenSSH

# Allow HTTP
sudo ufw allow 80/tcp

# Allow HTTPS
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw --force enable

# Check status
sudo ufw status
```

---

## 📦 Step 2: Deploy Application

### 2.1 Clone Repository

```bash
# Create application directory
sudo mkdir -p /var/www
cd /var/www

# Clone your repository
sudo git clone https://github.com/ppconrado/YelpCamp-React.git josepaulocamp

# Change to project directory
cd josepaulocamp

# Set permissions
sudo chown -R $USER:$USER /var/www/josepaulocamp
```

### 2.2 Create Production Environment File

Create `.env.production` in project root:

```bash
nano .env.production
```

Add these variables:

```env
# Database Configuration
DATABASE_URL=postgresql://yelpcamp:CHANGE_THIS_PASSWORD@postgres:5432/yelpcamp
DB_PASSWORD=CHANGE_THIS_PASSWORD

# Application
NODE_ENV=production
PORT=3000

# Security
SECRET=CHANGE_THIS_TO_32_CHAR_RANDOM_STRING

# External Services
MAPBOX_TOKEN=pk.your_mapbox_token_here
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_KEY=your_cloudinary_key
CLOUDINARY_SECRET=your_cloudinary_secret

# Frontend URL (your domain or server IP)
FRONTEND_URL=https://yourdomain.com
# OR if no domain: FRONTEND_URL=http://your-server-ip
```

**Important:**

- Change `DB_PASSWORD` to a strong password
- Generate `SECRET` with: `openssl rand -base64 32`
- Update all tokens and credentials
- Use your domain or server IP for `FRONTEND_URL`

### 2.3 Create Frontend Environment File

Create `client/.env.production`:

```bash
nano client/.env.production
```

Add:

```env
# Backend API URL
VITE_API_URL=https://yourdomain.com/api
# OR if no domain: VITE_API_URL=http://your-server-ip:3000/api

# Mapbox
VITE_MAPBOX_TOKEN=pk.your_mapbox_token_here
```

---

## 🏗️ Step 3: Configure Docker Compose

The project already has `docker-compose.yml` for development. Create production version:

```bash
nano docker-compose.prod.yml
```

Add this configuration:

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:16-alpine
    container_name: josepaulocamp-db-prod
    restart: always
    environment:
      POSTGRES_USER: yelpcamp
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: yelpcamp
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - app-network
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U yelpcamp']
      interval: 10s
      timeout: 5s
      retries: 5

  # Backend API
  backend:
    build:
      context: .
      dockerfile: Dockerfile
      target: production
    container_name: josepaulocamp-backend-prod
    restart: always
    ports:
      - '3000:3000'
    env_file:
      - .env.production
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - app-network
    healthcheck:
      test:
        [
          'CMD',
          'wget',
          '--no-verbose',
          '--tries=1',
          '--spider',
          'http://localhost:3000/health',
        ]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # Frontend (Nginx)
  frontend:
    build:
      context: ./client
      dockerfile: Dockerfile
      target: production
      args:
        - VITE_API_URL=${VITE_API_URL}
        - VITE_MAPBOX_TOKEN=${VITE_MAPBOX_TOKEN}
    container_name: josepaulocamp-frontend-prod
    restart: always
    ports:
      - '80:80'
      - '443:443'
    depends_on:
      - backend
    networks:
      - app-network
    volumes:
      - ./nginx/ssl:/etc/nginx/ssl:ro

volumes:
  postgres_data:
    driver: local

networks:
  app-network:
    driver: bridge
```

---

## 🔒 Step 4: SSL/HTTPS Setup (Optional but Recommended)

### Option A: Let's Encrypt (Free SSL - Recommended)

**Only if you have a domain name!**

```bash
# Install Certbot
sudo apt install -y certbot

# Stop any services on port 80/443 temporarily
docker compose -f docker-compose.prod.yml down

# Get SSL certificate (replace with your domain)
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Follow prompts:
# - Enter email address
# - Agree to terms
# - Choose to share email (optional)

# Certificates will be saved to:
# /etc/letsencrypt/live/yourdomain.com/fullchain.pem
# /etc/letsencrypt/live/yourdomain.com/privkey.pem

# Copy certificates to project
sudo mkdir -p nginx/ssl
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/

# Set permissions
sudo chmod 644 nginx/ssl/*.pem
```

**Auto-renewal setup:**

```bash
# Test renewal
sudo certbot renew --dry-run

# If successful, certbot auto-renews via systemd timer
# Verify timer is active:
sudo systemctl list-timers | grep certbot
```

### Option B: No Domain (HTTP Only)

If you don't have a domain, skip SSL setup:

1. Remove port `443` from `docker-compose.prod.yml` frontend service
2. Use HTTP URLs in environment files (not HTTPS)
3. Set `secure: false` for cookies in production (less secure)

---

## 🚀 Step 5: Build and Deploy

### 5.1 Build Docker Images

```bash
# Load environment variables
export $(cat .env.production | xargs)

# Build all images (takes 5-10 minutes first time)
docker compose -f docker-compose.prod.yml build

# Watch build progress
# You'll see:
# - npm install dependencies
# - Prisma generate
# - React build
# - Docker layer caching
```

### 5.2 Start Services

```bash
# Start all containers in detached mode
docker compose -f docker-compose.prod.yml up -d

# Check containers are running
docker compose -f docker-compose.prod.yml ps

# Expected output:
# NAME                          STATUS        PORTS
# josepaulocamp-backend-prod    Up (healthy)  0.0.0.0:3000->3000/tcp
# josepaulocamp-db-prod         Up (healthy)  5432/tcp
# josepaulocamp-frontend-prod   Up            0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
```

### 5.3 View Logs

```bash
# View all logs (follow mode)
docker compose -f docker-compose.prod.yml logs -f

# View specific service
docker compose -f docker-compose.prod.yml logs -f backend

# Last 100 lines
docker compose -f docker-compose.prod.yml logs --tail=100 backend

# Press Ctrl+C to exit log view
```

### 5.4 Verify Deployment

```bash
# Test backend health endpoint
curl http://localhost:3000/health

# Expected: {"status":"ok","timestamp":"..."}

# Test frontend
curl http://localhost

# Expected: HTML content

# Check database tables
docker compose -f docker-compose.prod.yml exec postgres psql -U yelpcamp -d yelpcamp -c "\dt"

# Expected:
#  Schema |        Name        | Type  |  Owner
# --------+--------------------+-------+----------
#  public | Campground         | table | yelpcamp
#  public | Image              | table | yelpcamp
#  public | Review             | table | yelpcamp
#  public | User               | table | yelpcamp
#  public | _prisma_migrations | table | yelpcamp
#  public | session            | table | yelpcamp
```

---

## 🎯 Access Your Application

- **Frontend**: `http://your-server-ip` or `https://yourdomain.com`
- **Backend API**: `http://your-server-ip:3000/api`
- **Health Check**: `http://your-server-ip:3000/health`

**Test in browser:**

1. Open frontend URL
2. Register new user
3. Create campground
4. Verify images upload
5. Add review
6. Check map displays

---

## 🔄 Step 6: Maintenance & Operations

### Update Application

When you push new code to GitHub:

```bash
# SSH into server
ssh root@your-server-ip

# Navigate to project
cd /var/www/josepaulocamp

# Pull latest code
git pull origin main

# Rebuild images
docker compose -f docker-compose.prod.yml build

# Restart services (minimal downtime)
docker compose -f docker-compose.prod.yml up -d

# Or full restart:
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d
```

### View Logs

```bash
# All services, follow mode
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend
docker compose -f docker-compose.prod.yml logs -f postgres

# Last N lines
docker compose -f docker-compose.prod.yml logs --tail=50 backend

# Since specific time
docker compose -f docker-compose.prod.yml logs --since 30m backend
```

### Database Backup

**Manual backup:**

```bash
# Backup database to file
docker compose -f docker-compose.prod.yml exec postgres pg_dump -U yelpcamp yelpcamp > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup to compressed file
docker compose -f docker-compose.prod.yml exec postgres pg_dump -U yelpcamp yelpcamp | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# List backups
ls -lh backup_*.sql*
```

**Restore backup:**

```bash
# Restore from backup
docker compose -f docker-compose.prod.yml exec -T postgres psql -U yelpcamp yelpcamp < backup_20251216_120000.sql

# Restore from compressed backup
gunzip -c backup_20251216_120000.sql.gz | docker compose -f docker-compose.prod.yml exec -T postgres psql -U yelpcamp yelpcamp
```

**Automated backup script:**

Create `backup-db.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/var/www/josepaulocamp/backups"
mkdir -p $BACKUP_DIR
cd /var/www/josepaulocamp
docker compose -f docker-compose.prod.yml exec postgres pg_dump -U yelpcamp yelpcamp | gzip > $BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: $(date)"
```

Make executable and add to crontab:

```bash
chmod +x backup-db.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /var/www/josepaulocamp/backup-db.sh >> /var/log/backup.log 2>&1
```

### Database Migrations

When schema changes:

```bash
# Run pending migrations
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# Check migration status
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate status

# View applied migrations
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate status
```

### Restart Services

```bash
# Restart all services
docker compose -f docker-compose.prod.yml restart

# Restart specific service
docker compose -f docker-compose.prod.yml restart backend
docker compose -f docker-compose.prod.yml restart frontend
docker compose -f docker-compose.prod.yml restart postgres

# Stop all services
docker compose -f docker-compose.prod.yml stop

# Start all services
docker compose -f docker-compose.prod.yml start

# Stop and remove containers (keeps data in volumes)
docker compose -f docker-compose.prod.yml down

# Stop, remove containers AND volumes (⚠️ DELETES DATA)
docker compose -f docker-compose.prod.yml down -v
```

### Monitor Resources

```bash
# Container resource usage
docker stats

# Disk usage
docker system df

# Detailed disk usage
docker system df -v

# Server disk space
df -h

# Memory usage
free -h

# CPU usage
top
# or
htop  # (install with: sudo apt install htop)
```

### Clean Up Docker

```bash
# Remove unused images, containers, networks
docker system prune -a

# Remove all volumes (⚠️ includes database data)
docker system prune -a --volumes

# Remove specific stopped container
docker rm container_name

# Remove specific image
docker rmi image_name
```

---

## 🐛 Troubleshooting

### Containers Not Starting

**Check logs:**

```bash
docker compose -f docker-compose.prod.yml logs
docker compose -f docker-compose.prod.yml logs backend
docker logs josepaulocamp-backend-prod
```

**Check container status:**

```bash
docker compose -f docker-compose.prod.yml ps
docker ps -a  # Shows all containers including stopped
```

**Restart specific service:**

```bash
docker compose -f docker-compose.prod.yml restart backend
```

**Common causes:**

- Port already in use (check with `sudo netstat -tulpn`)
- Environment variables missing
- Build failed (check build logs)
- Database not ready (wait for healthcheck)

### Database Connection Issues

**Verify DATABASE_URL:**

- Must use `postgres` as hostname (not `localhost`)
- Format: `postgresql://yelpcamp:password@postgres:5432/yelpcamp`

**Check postgres container:**

```bash
# Is it running?
docker ps | grep postgres

# Is it healthy?
docker compose -f docker-compose.prod.yml ps

# Can you connect manually?
docker compose -f docker-compose.prod.yml exec postgres psql -U yelpcamp -d yelpcamp
```

**Check migrations:**

```bash
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate status
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

### Port Conflicts

**Check what's using ports:**

```bash
sudo netstat -tulpn | grep -E '80|443|3000|5432'
```

**Kill process on port:**

```bash
sudo kill -9 $(sudo lsof -t -i:80)
sudo kill -9 $(sudo lsof -t -i:3000)
```

**Change ports in docker-compose.prod.yml:**

```yaml
# Example: use port 8080 instead of 80
ports:
  - '8080:80'
```

### Frontend Not Loading

**Check container logs:**

```bash
docker compose -f docker-compose.prod.yml logs frontend
```

**Check nginx is running:**

```bash
docker compose -f docker-compose.prod.yml exec frontend nginx -t
```

**Test locally:**

```bash
curl http://localhost
curl -I http://localhost  # Check response headers
```

**Common causes:**

- Build failed (check build logs)
- Wrong VITE_API_URL in environment
- Port 80 already in use
- Nginx configuration error

### Backend API Not Responding

**Check backend logs:**

```bash
docker compose -f docker-compose.prod.yml logs backend
```

**Test health endpoint:**

```bash
curl http://localhost:3000/health
```

**Check environment variables:**

```bash
docker compose -f docker-compose.prod.yml exec backend env | grep -E 'DATABASE_URL|NODE_ENV|SECRET'
```

**Common causes:**

- Database not connected
- Migrations not run
- Environment variables missing
- Port 3000 already in use

### SSL/HTTPS Issues

**Certificate not found:**

```bash
ls -la nginx/ssl/
# Should show fullchain.pem and privkey.pem
```

**Renew certificate:**

```bash
sudo certbot renew
sudo cp /etc/letsencrypt/live/yourdomain.com/*.pem nginx/ssl/
docker compose -f docker-compose.prod.yml restart frontend
```

**Check certificate expiry:**

```bash
sudo certbot certificates
```

### Out of Disk Space

**Check disk usage:**

```bash
df -h
docker system df
```

**Clean up Docker:**

```bash
# Remove unused images and containers
docker system prune -a

# Remove old images
docker images | grep '<none>' | awk '{print $3}' | xargs docker rmi

# Remove stopped containers
docker container prune
```

**Clean up system:**

```bash
# Clean apt cache
sudo apt clean

# Remove old logs
sudo journalctl --vacuum-time=7d
```

### Session/Authentication Issues

**Verify session table exists:**

```bash
docker compose -f docker-compose.prod.yml exec postgres psql -U yelpcamp -d yelpcamp -c "\dt session"
```

**Check backend logs for session errors:**

```bash
docker compose -f docker-compose.prod.yml logs backend | grep -i session
```

**Verify cookies in browser:**

- Open DevTools → Application → Cookies
- Should see `yelpcamp.sid` cookie
- Check it's httpOnly and secure (if HTTPS)

**Common causes:**

- FRONTEND_URL doesn't match actual domain
- Cookies blocked by browser (check SameSite settings)
- Session table not created
- DATABASE_URL incorrect

---

## 📊 Performance Optimization

### Enable Docker BuildKit

Add to `~/.bashrc` or `~/.profile`:

```bash
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1
```

### Use Docker Layer Caching

Already configured in Dockerfile with multi-stage builds.

### Optimize Database

```bash
# Connect to database
docker compose -f docker-compose.prod.yml exec postgres psql -U yelpcamp -d yelpcamp

# Run vacuum (cleanup)
VACUUM ANALYZE;

# Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Monitor Logs

Set up log rotation to prevent disk fill:

```bash
# Edit docker daemon config
sudo nano /etc/docker/daemon.json
```

Add:

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

Restart Docker:

```bash
sudo systemctl restart docker
docker compose -f docker-compose.prod.yml up -d
```

---

## 🔐 Security Recommendations

### 1. Change Default Passwords

- Database password in `.env.production`
- Generate strong SECRET: `openssl rand -base64 32`

### 2. Setup Firewall Rules

```bash
# Only allow necessary ports
sudo ufw status
sudo ufw deny 5432  # Block direct PostgreSQL access
sudo ufw deny 3000  # Block direct backend access if using reverse proxy
```

### 3. Use Non-Root User

```bash
# Create application user
sudo adduser appuser
sudo usermod -aG docker appuser

# Switch to appuser
su - appuser
```

### 4. Regular Updates

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Docker images
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

### 5. Enable Automatic Security Updates

```bash
sudo apt install unattended-upgrades
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

### 6. Monitor Logs

Set up monitoring for suspicious activity:

```bash
# Check failed login attempts
sudo grep "Failed password" /var/log/auth.log

# Monitor Docker logs for errors
docker compose -f docker-compose.prod.yml logs | grep -i error
```

---

## 📚 Additional Resources

### Docker Documentation

- [Docker Get Started](https://docs.docker.com/get-started/)
- [Docker Compose](https://docs.docker.com/compose/)
- [Dockerfile Best Practices](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)

### Ubuntu Server

- [Ubuntu Server Guide](https://ubuntu.com/server/docs)
- [UFW Firewall](https://help.ubuntu.com/community/UFW)

### Let's Encrypt

- [Certbot Instructions](https://certbot.eff.org/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)

### PostgreSQL

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [pg_dump Backup](https://www.postgresql.org/docs/current/app-pgdump.html)

---

## 🎉 Success!

Your JosePauloCamp application is now running in Docker! 🐳

**What's Next:**

- Set up automated backups
- Configure monitoring (e.g., UptimeRobot)
- Add domain and SSL
- Optimize performance
- Implement CI/CD pipeline

**Need help?** Check [DEPLOYMENT.md](DEPLOYMENT.md) for cloud-based deployment alternative.

---

**Last Updated**: December 16, 2025  
**Version**: 2.0.0 - Docker Edition
