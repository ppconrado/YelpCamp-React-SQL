# Backend Dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Development image
FROM base AS development
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set a dummy DATABASE_URL for Prisma generation (not used at build time)
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"

# Generate Prisma Client
RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "run", "dev"]

# Production builder
FROM base AS builder
WORKDIR /app

# Copy dependencies and source
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client for production
RUN npx prisma generate

# Production image
FROM base AS production
WORKDIR /app

ENV NODE_ENV=production

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 expressjs

# Copy necessary files
COPY --from=builder --chown=expressjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=expressjs:nodejs /app/generated ./generated
COPY --chown=expressjs:nodejs package*.json ./
COPY --chown=expressjs:nodejs app.js ./
COPY --chown=expressjs:nodejs middleware.js ./
COPY --chown=expressjs:nodejs schemas.js ./
COPY --chown=expressjs:nodejs prisma.config.ts ./
COPY --chown=expressjs:nodejs controllers ./controllers
COPY --chown=expressjs:nodejs routes ./routes
COPY --chown=expressjs:nodejs utils ./utils
COPY --chown=expressjs:nodejs lib ./lib
COPY --chown=expressjs:nodejs cloudinary ./cloudinary
COPY --chown=expressjs:nodejs public ./public
COPY --chown=expressjs:nodejs prisma ./prisma

USER expressjs

EXPOSE 3000

CMD ["node", "app.js"]
