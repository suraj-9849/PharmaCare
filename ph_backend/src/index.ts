import express, { Application } from 'express';
import cors from 'cors';
import swaggerUI from 'swagger-ui-express';
import env from './config/env';
import { specs } from './config/swagger';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { metricsMiddleware, metricsRoute } from './middleware/metrics';
import { requestLogger } from './middleware/requestLogger';
import { connectDatabase } from './config/database';
import ValkeyClient from './config/valkey';
import logger from './config/logger';

const app: Application = express();

// CORS Configuration
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Swagger Documentation
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(specs));

// Prometheus metrics endpoint
if (env.NODE_ENV !== 'production') {
  app.get(metricsRoute, metricsMiddleware);
}

// API Routes
app.use('/api', routes);

// Root route
app.get('/', (_req, res) => {
  res.json({
    name: env.APP_NAME,
    version: env.APP_VERSION,
    status: 'running',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', async (_req, res) => {
  const valkeyHealthy = await ValkeyClient.healthCheck();

  let databaseHealthy = true;
  try {
    const { prisma } = await import('./config/database');
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    logger.error('Database health check failed:', error);
    databaseHealthy = false;
  }

  const health = {
    status: databaseHealthy && valkeyHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    services: {
      database: databaseHealthy ? 'connected' : 'disconnected',
      cache: valkeyHealthy ? 'connected' : 'disconnected',
    },
  };
  res.status(200).json(health);
});

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();
    logger.info('Database connected successfully');

    // Initialize Valkey client
    ValkeyClient.getInstance();
    logger.info('Valkey client initialized');

    const server = app.listen(env.PORT, () => {
      const banner = `
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   ${env.APP_NAME} API Server                                   ║
║                                                           ║
║   Version: ${env.APP_VERSION}                                          ║
║   Environment: ${env.NODE_ENV}                                ║
║   Port: ${env.PORT}                                              ║
║   URL: http://localhost:${env.PORT}                              ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `;
      console.log(banner);
      logger.info(`${env.APP_NAME} server started on port ${env.PORT}`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received. Shutting down gracefully...`);
      await ValkeyClient.disconnect();
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    return server;
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
