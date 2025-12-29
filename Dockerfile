# ============================================
# Monorepo Dockerfile for Nymo Backend
# Deploys apps/server with workspace dependencies
# ============================================

FROM oven/bun:1 AS base
WORKDIR /app

# ============================================
# Single stage: Install deps and run
# ============================================

# Copy all package files first
COPY package.json bun.lock ./
COPY apps/server/package.json ./apps/server/
COPY packages/api/package.json ./packages/api/
COPY packages/config/package.json ./packages/config/

# Copy all source code
COPY apps/server ./apps/server
COPY packages/api ./packages/api
COPY packages/config ./packages/config

# Install dependencies (this will also create workspace symlinks)
RUN bun install

# Create data directory
RUN mkdir -p /app/apps/server/data

# Environment variables
ENV NODE_ENV=production
ENV PORT=8080
ENV USE_MODAL_EMBEDDINGS=true

# Expose port
EXPOSE 8080

# Run the server
CMD ["bun", "run", "apps/server/src/index.ts"]
