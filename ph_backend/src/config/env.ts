import dotenv from 'dotenv';

dotenv.config();

interface Environment {
  // Server
  PORT: number;
  NODE_ENV: string;

  // Database
  DATABASE_URL: string;

  // JWT
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;

  // CORS
  CORS_ORIGIN: string;

  // Application
  APP_NAME: string;
  APP_VERSION: string;

  // OpenAI
  OPENAI_API_KEY: string;
  // Email
  RESEND_API_KEY: string;
  ADMIN_EMAIL: string;

  // Valkey/Redis Cache
  VALKEY_HOST: string;
  VALKEY_PORT: number;
  VALKEY_PASSWORD?: string;
  CACHE_TTL: number;

  // Helpers
  isDevelopment: boolean;
  isProduction: boolean;
}

const env: Environment = {
  // Server
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Database
  DATABASE_URL: process.env.DATABASE_URL || '',

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'default_secret_change_in_production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',

  // Application
  APP_NAME: process.env.APP_NAME || 'PharmaCare',
  APP_VERSION: process.env.APP_VERSION || '1.0.0',

  // OpenAI
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  // Email
  RESEND_API_KEY: process.env.RESEND_API_KEY || '',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || '',

  // Valkey/Redis Cache
  VALKEY_HOST: process.env.VALKEY_HOST || 'localhost',
  VALKEY_PORT: parseInt(process.env.VALKEY_PORT || '6379', 10),
  VALKEY_PASSWORD: process.env.VALKEY_PASSWORD,
  CACHE_TTL: parseInt(process.env.CACHE_TTL || '300', 10), // 5 minutes default

  // Helpers
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
};

// Validate required environment variables
const requiredEnvVars: (keyof Environment)[] = ['DATABASE_URL', 'JWT_SECRET'];

for (const envVar of requiredEnvVars) {
  if (!env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

export { env as config };
export default env;
