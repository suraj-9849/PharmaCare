import { PrismaPg } from '@prisma/adapter-pg';
import env from './env';
import { PrismaClient } from '@prisma/client';

const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;
