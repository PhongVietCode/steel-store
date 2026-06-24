# syntax=docker/dockerfile:1.7

# ── build ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app

# Cache deps separately from source.
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts index.html ./
COPY src src
RUN npm run build

# ── runtime (nginx) ───────────────────────────────────────────────────
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -qO- http://127.0.0.1/ > /dev/null || exit 1
