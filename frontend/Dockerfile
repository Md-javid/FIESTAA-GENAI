# ─────────────────────────────────────────────────────────────────────────────
# MediCode AI — Frontend Dockerfile
# Stage 1: Build with Node (Vite)
# Stage 2: Serve with Nginx Alpine
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy manifests first for layer caching
COPY package.json package-lock.json ./

# Install ALL deps (including devDependencies needed by Vite build)
RUN npm ci --ignore-scripts

# Copy all source files
COPY . .

# Accept backend URL at build time (can be overridden via docker-compose args)
ARG VITE_API_URL=http://localhost:8000
ENV VITE_API_URL=$VITE_API_URL

# Production build — outputs to /app/dist
RUN npm run build

# ── Stage 2: Serve with Nginx ──────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runner

LABEL org.opencontainers.image.title="MediCode AI Frontend" \
    org.opencontainers.image.description="iOS 18 Liquid Glass UI — NAMASTE & ICD-11 EHR Workstation" \
    org.opencontainers.image.version="2.0.0"

# Remove default Nginx site
RUN rm -rf /usr/share/nginx/html/*

# Copy the built Vite output
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx config (handles SPA routing + /api proxy)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Nginx health-check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
