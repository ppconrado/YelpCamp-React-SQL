const { PrismaClient } = require('../generated/prisma');

// Singleton pattern for Prisma Client
// Prevents creating multiple instances which causes "Too many Prisma Client instances" warning
let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  // In development, use a global variable to preserve the instance across hot reloads
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}

module.exports = prisma;
