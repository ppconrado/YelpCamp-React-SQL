const { PrismaClient } = require('../generated/prisma');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

// Singleton pattern for Prisma Client
// Prevents creating multiple instances which causes "Too many Prisma Client instances" warning
let prisma;

// Create a PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create Prisma adapter for PostgreSQL
const adapter = new PrismaPg(pool);

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({ adapter });
} else {
  // In development, use a global variable to preserve the instance across hot reloads
  if (!global.prisma) {
    global.prisma = new PrismaClient({ adapter });
  }
  prisma = global.prisma;
}

module.exports = prisma;
