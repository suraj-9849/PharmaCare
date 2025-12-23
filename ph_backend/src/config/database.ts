import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import env from './env';
import { PrismaClient } from '@prisma/client';

// Configure PostgreSQL connection pool with proper timeout settings for Neon serverless
const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 10, // Reduced for serverless - Maximum number of clients in the pool
  min: 1, // Minimum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 60000, // Increased to 60 seconds for Neon cold starts
  keepAlive: true, // Keep TCP connections alive
  keepAliveInitialDelayMillis: 10000, // Start sending keep-alive packets after 10 seconds of inactivity
  statement_timeout: 30000, // Statement timeout 30 seconds
  query_timeout: 30000, // Query timeout 30 seconds
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Test connection function (call this from server startup)
export const connectDatabase = async () => {
  try {
    await prisma.$connect();
    console.log('✓ Database connected successfully');
  } catch (error) {
    console.error('✗ Database connection failed:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('Closing database connections...');
  await prisma.$disconnect();
  await pool.end();
  console.log('Database connections closed');
};

process.on('SIGINT', async () => {
  await gracefulShutdown();
  process.exit(0);
});
process.on('SIGTERM', async () => {
  await gracefulShutdown();
  process.exit(0);
});

export { prisma };
export default prisma;
