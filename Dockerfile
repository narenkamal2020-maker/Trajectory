# Trajectory API + web app in one image.
# Python is included because the code executor runs Python and SQL (SQLite) submissions.

# ── Build the web app ──
FROM node:26-bookworm-slim AS web
WORKDIR /src/app
COPY app/package*.json ./
RUN npm ci
COPY app/ ./
RUN npm run build

# ── Build the API ──
FROM node:26-bookworm-slim AS api
WORKDIR /src/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npm run build && npm prune --omit=dev

# ── Runtime ──
FROM node:26-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends python3 tini \
  && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production PORT=3001 PYTHON_BIN=python3 STATIC_DIR=/app/web
WORKDIR /app/backend
COPY --from=api /src/backend/node_modules ./node_modules
COPY --from=api /src/backend/dist ./dist
COPY --from=api /src/backend/package.json ./
COPY --from=web /src/app/dist /app/web
RUN mkdir -p logs && chown -R node:node /app
USER node
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s CMD node -e "fetch('http://localhost:3001/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "dist/index.js"]
