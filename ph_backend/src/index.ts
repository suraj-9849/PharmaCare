import express, { Application } from 'express';
import cors from 'cors';
import swaggerUI from 'swagger-ui-express';
import env from './config/env';
import { specs } from './config/swagger';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { connectDatabase } from './config/database';
import ValkeyClient from './config/valkey';

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

// Swagger Documentation
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(specs));

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
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: 'connected',
      cache: valkeyHealthy ? 'connected' : 'disconnected',
    },
  };
  res.status(200).json(health);
});

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();

    // Initialize Valkey client
    ValkeyClient.getInstance();

    const server = app.listen(env.PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   ${env.APP_NAME} API Server                                   ║
║                                                           ║
║   Version: ${env.APP_VERSION}                                          ║
║   Environment: ${env.NODE_ENV}                                ║
║   Port: ${env.PORT}                                              ║
║   URL: http://localhost:${env.PORT}                              ║
║   Cache: Valkey (Redis-compatible)                       ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      await ValkeyClient.disconnect();
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    return server;
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
