import express, { Application } from 'express';
import cors from 'cors';
import swaggerUI from 'swagger-ui-express';
import env from './config/env';
import { specs } from './config/swagger';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { connectDatabase } from './config/database';

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

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Connect to database first
    await connectDatabase();

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
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });

    return server;
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
