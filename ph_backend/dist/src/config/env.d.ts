interface Environment {
    PORT: number;
    NODE_ENV: string;
    DATABASE_URL: string;
    JWT_SECRET: string;
    JWT_EXPIRES_IN: string;
    CORS_ORIGIN: string;
    APP_NAME: string;
    APP_VERSION: string;
    isDevelopment: boolean;
    isProduction: boolean;
}
declare const env: Environment;
export default env;
//# sourceMappingURL=env.d.ts.map