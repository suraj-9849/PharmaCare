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

  // SMTP Configuration (for supplier emails)
  SMTP_HOST: string;
  SMTP_PORT: string;
  SMTP_USER: string;
  SMTP_PASSWORD: string;
  SMTP_SECURE: string;

  // Google Search API (for public supplier search)
  GOOGLE_SEARCH_API_KEY: string;
  GOOGLE_SEARCH_ENGINE_ID: string;

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

  // SMTP Configuration
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: process.env.SMTP_PORT || '587',
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASSWORD: process.env.SMTP_PASSWORD || '',
  SMTP_SECURE: process.env.SMTP_SECURE || 'false',

  // Google Search API
  GOOGLE_SEARCH_API_KEY: process.env.GOOGLE_SEARCH_API_KEY || '',
  GOOGLE_SEARCH_ENGINE_ID: process.env.GOOGLE_SEARCH_ENGINE_ID || '',

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
