# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma client
RUN pnpm prisma:generate

# Build TypeScript
RUN pnpm build

# Runtime stage
FROM node:20-alpine

WORKDIR /app

# Install pnpm in runtime image
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install production dependencies (skip prepare script which tries to run husky)
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

# Install prisma CLI separately for migrations
RUN pnpm add -D prisma@7.1.0

# Copy built application and generated files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

# Copy node_modules with Prisma client
COPY --from=builder /app/node_modules ./node_modules

# Copy environment file template
COPY .env.example .env.example

# Create .env for runtime with placeholder values
# These will be overridden by docker-compose environment variables
RUN echo "DATABASE_URL=postgresql://postgres:postgres@db:5432/pharmacy\n\
NODE_ENV=production\n\
PORT=5000\n\
JWT_SECRET=your-super-secret-jwt-key-change-in-production\n\
JWT_EXPIRY=7d\n\
RAZORPAY_KEY_ID=rzp_live_placeholder_key\n\
RAZORPAY_KEY_SECRET=razorpay_placeholder_secret" > .env

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

# Expose port
EXPOSE 5000

# Run migrations, seed, and then start the application
CMD sh -c "sleep 10 && pnpm exec prisma db push --accept-data-loss && node dist/src/seed.js || true && node dist/src/index.js"
