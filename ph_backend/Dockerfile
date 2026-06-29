FROM oven/bun:1-alpine AS builder

WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install
COPY . .
RUN bun run prisma:generate
RUN bun run build

FROM oven/bun:1-alpine
WORKDIR /app

COPY package.json bun.lockb ./
RUN bun install --production --ignore-scripts

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules

ENV NODE_ENV=production

EXPOSE 5000

CMD ["bun", "run", "dist/src/index.js"]
