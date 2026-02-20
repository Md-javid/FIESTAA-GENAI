# ─────────────────────────────────────────────────────────────────────────────
# MediCode AI — Backend Dockerfile
# Node 20 LTS on Alpine (tiny, secure image)
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Install production dependencies ──────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Copy only package manifests first (layer-cache trick — rebuilds only if deps change)
COPY package.json package-lock.json ./

# Install ONLY production deps — skip devDependencies
RUN npm ci --omit=dev --ignore-scripts

# ── Stage 2: Final runtime image ──────────────────────────────────────────────
FROM node:20-alpine AS runner

# Labels for Docker Hub / GHCR metadata
LABEL org.opencontainers.image.title="MediCode AI Backend" \
      org.opencontainers.image.description="Secure EHR Middleware — NAMASTE & ICD-11 TM2 via Gemini" \
      org.opencontainers.image.version="2.0.0"

WORKDIR /app

# Create a non-root user for security (avoid running as root in production)
RUN addgroup --system --gid 1001 medicode && \
    adduser  --system --uid 1001 --ingroup medicode medicode

# Copy installed node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY server.js          ./server.js
COPY systemPrompt.js    ./systemPrompt.js
COPY controllers/       ./controllers/
COPY routes/            ./routes/

# Switch to non-root user
USER medicode

# Expose the API port
EXPOSE 5001

# Health-check so Docker knows when the service is ready
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:5001/api/health || exit 1

# Start the server
CMD ["node", "server.js"]
