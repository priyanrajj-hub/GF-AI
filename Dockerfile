# ==========================================
# Multi-stage Dockerfile for Ada AI Assistant
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

# Copy root workspace manifests
COPY package.json package-lock.json .npmrc ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/server/package.json ./apps/server/
COPY apps/worker/package.json ./apps/worker/
COPY apps/web/package.json ./apps/web/

# Install dependencies across all workspaces
RUN npm install

# Copy source trees
COPY packages/shared ./packages/shared
COPY apps/server ./apps/server
COPY apps/worker ./apps/worker
COPY apps/web ./apps/web

# Build all packages & apps
RUN npm run build -w packages/shared
RUN npm run build -w apps/server
RUN npm run build -w apps/worker
RUN npm run build -w apps/web

# ==========================================
# Production Runtime Image
# ==========================================
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001

COPY --from=builder /app/package.json /app/package-lock.json /app/.npmrc ./
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/apps/server/package.json ./apps/server/
COPY --from=builder /app/apps/web/dist ./apps/web/dist
COPY --from=builder /app/apps/web/public ./apps/web/public

# Install production dependencies only
RUN npm install --omit=dev

EXPOSE 3001

CMD ["node", "apps/server/dist/index.js"]
