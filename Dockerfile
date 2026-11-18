# ==============================================================================
# GF-AI MULTI-STAGE HIGH-PERFORMANCE CONTAINER SPECIFICATION
# Production Targets: builder, api, worker, web
# Base Images pinned to immutable cryptographic digests
# ==============================================================================

# ------------------------------------------------------------------------------
# STAGE 1: Monorepo Compilation & Asset Builder
# ------------------------------------------------------------------------------
FROM node:22-alpine@sha256:d9e32b6e16d44db9f91a03a731efbd9e7b79b291d2c67672ec1d44ea1d5eb876 AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache libc6-compat

# Copy root monorepo manifests
COPY package.json package-lock.json .npmrc* ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/server/package.json ./apps/server/
COPY apps/worker/package.json ./apps/worker/
COPY apps/web/package.json ./apps/web/

# Deterministic build install across all workspaces
RUN npm ci

# Copy full source trees
COPY packages/shared ./packages/shared
COPY apps/server ./apps/server
COPY apps/worker ./apps/worker
COPY apps/web ./apps/web

# Build shared library first, followed by downstream applications
RUN npm run build -w packages/shared
RUN npm run build -w apps/server
RUN npm run build -w apps/worker
RUN npm run build -w apps/web

# ------------------------------------------------------------------------------
# STAGE 2: Production API Microservice (Hardened, Non-Root)
# ------------------------------------------------------------------------------
FROM node:22-alpine@sha256:d9e32b6e16d44db9f91a03a731efbd9e7b79b291d2c67672ec1d44ea1d5eb876 AS api

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001

# Create secure application and data directory
RUN mkdir -p /app/data /tmp && chown -R node:node /app /tmp

COPY --from=builder --chown=node:node /app/package.json /app/package-lock.json ./
COPY --from=builder --chown=node:node /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder --chown=node:node /app/packages/shared/package.json ./packages/shared/
COPY --from=builder --chown=node:node /app/apps/server/dist ./apps/server/dist
COPY --from=builder --chown=node:node /app/apps/server/package.json ./apps/server/

# Install production-only dependencies
RUN npm ci --omit=dev && npm cache clean --force

# Security: Non-root execution
USER node

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3001/health/live || exit 1

CMD ["node", "apps/server/dist/index.js"]

# ------------------------------------------------------------------------------
# STAGE 3: Background Worker & Autonomous Task Scheduler (Hardened, Non-Root)
# ------------------------------------------------------------------------------
FROM node:22-alpine@sha256:d9e32b6e16d44db9f91a03a731efbd9e7b79b291d2c67672ec1d44ea1d5eb876 AS worker

WORKDIR /app
ENV NODE_ENV=production

RUN mkdir -p /app/data /tmp && chown -R node:node /app /tmp

COPY --from=builder --chown=node:node /app/package.json /app/package-lock.json ./
COPY --from=builder --chown=node:node /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder --chown=node:node /app/packages/shared/package.json ./packages/shared/
COPY --from=builder --chown=node:node /app/apps/worker/dist ./apps/worker/dist
COPY --from=builder --chown=node:node /app/apps/worker/package.json ./apps/worker/

RUN npm ci --omit=dev && npm cache clean --force

USER node

HEALTHCHECK --interval=60s --timeout=10s --retries=2 \
  CMD ps aux | grep -v grep | grep "node apps/worker/dist/index.js" || exit 1

CMD ["node", "apps/worker/dist/index.js"]

# ------------------------------------------------------------------------------
# STAGE 4: Web Frontend & NGINX Edge Distribution (Hardened)
# ------------------------------------------------------------------------------
FROM nginx:alpine@sha256:28402db69fec7c17e179ea87882667f1e054391138f77ffd0b4a3441fbda43be AS web

# Remove default nginx distribution files
RUN rm -rf /usr/share/nginx/html/*

# Copy compiled frontend SPA bundle
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Copy optimized NGINX configuration
COPY infra/docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
