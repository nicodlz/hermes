# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Copy package files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages/db/package.json ./packages/db/
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

# Install dependencies
RUN pnpm install --frozen-lockfile || pnpm install

# Copy source
COPY . .

# Generate Prisma client
RUN pnpm db:generate

# Build
RUN pnpm build

# Build migration script
RUN cd packages/db && npx tsc src/migrate-auth.ts --outDir dist --esModuleInterop --module commonjs --skipLibCheck || true

# Production stage
FROM node:22-alpine AS runner

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Copy built files
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/db/package.json ./packages/db/
COPY --from=builder /app/packages/db/prisma ./packages/db/prisma
COPY --from=builder /app/packages/db/node_modules ./packages/db/node_modules
COPY --from=builder /app/packages/db/dist ./packages/db/dist
COPY --from=builder /app/packages/db/src ./packages/db/src
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/apps/web/dist ./apps/web/dist

# Create data directory for SQLite
RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV DATABASE_URL="file:/app/data/hermes.db"
ENV PORT=3001

EXPOSE 3001

WORKDIR /app

# Copy startup script
COPY --from=builder /app/packages/db/prisma ./packages/db/prisma

# Startup: run db push, auth migration, then start server
CMD ["sh", "-c", "cd /app/packages/db && npx prisma db push --skip-generate && node dist/migrate-auth.js 2>/dev/null || true && cd /app/apps/api && node dist/server.js"]
