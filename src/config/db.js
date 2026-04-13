const { PrismaClient } = require("@prisma/client");

// Initialize both database clients
let primaryDb = null;
let fallbackDb = null;
let currentDb = null;

function getPrimaryDb() {
  if (!primaryDb) {
    primaryDb = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
      datasources: {
        db: {
          url: process.env.PRIMARY_DATABASE_URL + 
            (process.env.PRIMARY_DATABASE_URL?.includes('?') ? '&' : '?') + 
            'connection_limit=3&pool_timeout=30&connect_timeout=30',
        },
      },
    });
  }
  return primaryDb;
}

function getFallbackDb() {
  if (!fallbackDb) {
    fallbackDb = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
      datasources: {
        db: {
          url: process.env.FALLBACK_DATABASE_URL + 
            (process.env.FALLBACK_DATABASE_URL?.includes('?') ? '&' : '?') + 
            'connection_limit=3&pool_timeout=30&connect_timeout=30',
        },
      },
    });
  }
  return fallbackDb;
}

// Health check and fallback logic
async function getHealthyDb() {
  if (!currentDb) {
    try {
      const primary = getPrimaryDb();
      await primary.$queryRawUnsafe('SELECT 1');
      currentDb = primary;
      console.log("✅ Using PRIMARY database (Neon)");
      return primary;
    } catch (error) {
      console.warn("⚠️ PRIMARY database failed, switching to FALLBACK (Neon)");
      currentDb = getFallbackDb();
      return currentDb;
    }
  }

  return currentDb;
}

// Keep-alive pings for both databases
setInterval(async () => {
  try {
    const primary = getPrimaryDb();
    await primary.$queryRawUnsafe('SELECT 1');
    
    if (currentDb !== primary) {
      console.log("✅ PRIMARY database recovered, switching back");
      currentDb = primary;
    }
  } catch (error) {
    console.warn("⚠️ PRIMARY database unreachable, using FALLBACK");
    if (currentDb !== getFallbackDb()) {
      currentDb = getFallbackDb();
    }
  }
}, 4 * 60 * 1000);

// Keep fallback alive too
setInterval(async () => {
  try {
    const fallback = getFallbackDb();
    await fallback.$queryRawUnsafe('SELECT 1');
  } catch (_) {
    console.warn("⚠️ FALLBACK database ping failed");
  }
}, 4 * 60 * 1000);

const connectDB = async () => {
  try {
    const primary = getPrimaryDb();
    await primary.$connect();
    console.log("✅ PRIMARY PostgreSQL (Neon) connected");

    try {
      const fallback = getFallbackDb();
      await fallback.$connect();
      console.log("✅ FALLBACK PostgreSQL (Neon) connected");
    } catch (error) {
      console.warn("⚠️ FALLBACK database not available yet (will auto-connect if needed)");
    }

    currentDb = primary;
  } catch (error) {
    console.error("❌ PRIMARY Database Error:", error.message);
    process.exit(1);
  }
};

// Export object with all your models
const prisma = {
  // ── Models ──────────────────────────────────────────
  get user() {
    if (!currentDb) throw new Error('Database not connected. Call connectDB() first.');
    return currentDb.user;
  },
  get product() {
    if (!currentDb) throw new Error('Database not connected. Call connectDB() first.');
    return currentDb.product;
  },
  get productImage() {
    if (!currentDb) throw new Error('Database not connected. Call connectDB() first.');
    return currentDb.productImage;
  },
  get notification() {
    if (!currentDb) throw new Error('Database not connected. Call connectDB() first.');
    return currentDb.notification;
  },
  get siteContent() {
    if (!currentDb) throw new Error('Database not connected. Call connectDB() first.');
    return currentDb.siteContent;
  },
  get blog() {
    if (!currentDb) throw new Error('Database not connected. Call connectDB() first.');
    return currentDb.blog;
  },
  get contactInquiry() {
    if (!currentDb) throw new Error('Database not connected. Call connectDB() first.');
    return currentDb.contactInquiry;
  },
  // ── Prisma Methods ──────────────────────────────────
  async $disconnect() {
    if (primaryDb) await primaryDb.$disconnect();
    if (fallbackDb) await fallbackDb.$disconnect();
  },
  async $queryRawUnsafe(query) {
    const db = await getHealthyDb();
    return db.$queryRawUnsafe(query);
  },
  async $queryRaw(query) {
    const db = await getHealthyDb();
    return db.$queryRaw(query);
  },
  async $executeRawUnsafe(query) {
    const db = await getHealthyDb();
    return db.$executeRawUnsafe(query);
  },
  async $transaction(callback) {
    const db = await getHealthyDb();
    return db.$transaction(callback);
  },
};

module.exports = { prisma, connectDB };