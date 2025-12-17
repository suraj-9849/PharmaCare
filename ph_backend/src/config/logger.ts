import winston from 'winston';
import LokiTransport from 'winston-loki';
import env from './env';

const transports: winston.transport[] = [
  // Console output
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.printf(({ timestamp, level, message }) => {
        return `[${timestamp}] ${level}: ${message}`;
      })
    ),
  }),
];

// Add Loki transport if not in test environment
if (env.NODE_ENV !== 'test') {
  transports.push(
    new LokiTransport({
      host: process.env.LOKI_URL || 'http://localhost:3100',
      labels: {
        app: env.APP_NAME,
        environment: env.NODE_ENV,
        job: 'ph_backend',
      },
      json: true,
      format: winston.format.json(),
      onConnectionError: (err) => {
        console.error('Loki connection error:', err);
      },
    })
  );
}

const logger = winston.createLogger({
  level: env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: env.APP_NAME },
  transports,
});

export default logger;
