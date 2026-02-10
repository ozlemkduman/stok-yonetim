# Build stage
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# Copy workspace files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/ui/package.json ./packages/ui/
COPY apps/api/package.json ./apps/api/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/ui ./packages/ui
COPY apps/api ./apps/api

# Build
RUN pnpm --filter @stok/api build

# Production stage
FROM node:20-alpine AS production

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

ENV NODE_ENV=production

# Copy package files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/ui/package.json ./packages/ui/
COPY apps/api/package.json ./apps/api/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Install knex CLI and ts-node for migrations
RUN pnpm add -w knex ts-node typescript

# Copy built files
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/knexfile.ts ./apps/api/
COPY --from=builder /app/apps/api/src/database ./apps/api/src/database

# Copy startup script
COPY apps/api/start.sh ./apps/api/start.sh
RUN chmod +x ./apps/api/start.sh

WORKDIR /app/apps/api

EXPOSE 3000

CMD ["./start.sh"]
