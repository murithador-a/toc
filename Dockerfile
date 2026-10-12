# TOC Luxury Constructions — site + admin, one process
# ---------------------------------------------------------------------------
# The admin is not a static app: it reads and writes JSON on disk through the
# API, so it needs a long-lived Node process and a writable directory. This image
# gives you exactly that, and /var/data is declared as a volume so a container
# host (or `docker run -v`) can keep your edits between deploys.
#
#   docker build -t toc-site .
#   docker run -p 8787:8787 -v toc-data:/var/data \
#     -e SESSION_SECRET=$(openssl rand -hex 32) \
#     toc-site
#
# Then open http://localhost:8787 — the site and /admin are both there.

FROM node:20-alpine AS build
WORKDIR /app

# Install with the lockfile first so a code change does not re-resolve deps.
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

# Build the site (Vite) — dist/ is not committed, it is produced here.
COPY . .
RUN npm run build

# ---------------------------------------------------------------------------
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    API_PORT=8787 \
    DATA_DIR=/var/data \
    UPLOADS_DIR=/var/data/uploads

# Runtime dependencies only; dev tooling stays in the build stage.
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --no-audit --no-fund

COPY --from=build /app/dist ./dist
COPY --from=build /app/server ./server
COPY --from=build /app/tools ./tools
COPY --from=build /app/content ./content
COPY --from=build /app/node_modules/.bin ./node_modules/.bin

# Writable home for content backups, uploads, submissions and the admin credential.
RUN mkdir -p /var/data && chown -R node:node /var/data
VOLUME ["/var/data"]

USER node
EXPOSE 8787

# The server answers /api/health even before a password exists; a failure here
# means the process died, not that the admin is unconfigured.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.API_PORT||8787)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# npm run doctor prints exactly what is missing; run it if the admin misbehaves:
#   docker run --rm -v toc-data:/var/data toc-site npm run doctor
CMD ["node", "tools/start.mjs"]
