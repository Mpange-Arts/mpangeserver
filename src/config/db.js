const { PrismaClient } = require("@prisma/client");

const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  datasources: {
    db: {
      url: process.env.DATABASE_URL + 
        (process.env.DATABASE_URL?.includes('?') ? '&' : '?') + 
        'connection_limit=3&pool_timeout=30&connect_timeout=30',
    },
  },
});
if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

// Keep-alive ping every 4 minutes to prevent idle disconnects

setInterval(async () => {
  try {
    await prisma.$queryRawUnsafe('SELECT 1');
  } catch (_) {}
}, 4 * 60 * 1000);

const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log("✅ PostgreSQL Connected via Prisma");
  } catch (error) {
    console.error("❌ Database Error:", error.message);
    process.exit(1);
  }
};


module.exports = { prisma, connectDB };