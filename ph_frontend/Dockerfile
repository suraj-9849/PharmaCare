# Build stage
FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build Next.js
RUN bun run build

# Runtime stage
FROM oven/bun:1-alpine

WORKDIR /app

# Copy package files
COPY package.json bun.lockb ./

# Install production dependencies only (skip prepare script)
RUN bun install --frozen-lockfile --production --ignore-scripts

# Copy built application from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Expose port
EXPOSE 3000

# Set Node environment and port
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

# Run application with explicit port
CMD ["sh", "-c", "PORT=3000 bun run start"]
