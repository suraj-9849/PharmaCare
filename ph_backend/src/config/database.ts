import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import env from './env';
import { PrismaClient } from '@prisma/client';

// Configure PostgreSQL connection pool with proper timeout settings
const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 20, // Maximum number of clients in the pool
  min: 2, // Minimum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection could not be established
  keepAlive: true, // Keep TCP connections alive
  keepAliveInitialDelayMillis: 10000, // Start sending keep-alive packets after 10 seconds of inactivity
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Test connection on startup
prisma
  .$connect()
  .then(() => {
    console.log('✓ Database connected successfully');
  })
  .catch((error) => {
    console.error('✗ Database connection failed:', error);
    process.exit(1);
  });

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('Closing database connections...');
  await prisma.$disconnect();
  await pool.end();
  console.log('Database connections closed');
};

process.on('beforeExit', gracefulShutdown);
process.on('SIGINT', async () => {
  await gracefulShutdown();
  process.exit(0);
});
process.on('SIGTERM', async () => {
  await gracefulShutdown();
  process.exit(0);
});

export default prisma;
