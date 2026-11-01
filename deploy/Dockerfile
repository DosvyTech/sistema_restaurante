# Image digests are the multi-platform manifest indexes verified for the Node 24.12.0 tag.
FROM node:24.12.0-bookworm-slim@sha256:7326fb2dbdce998edd72140946851be64ef4a643e8715e138ca467e8e9d92c99 AS dependencies
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN test "$(npm --version)" = "11.6.2" && npm ci

FROM dependencies AS builder
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1 NEXT_DEPLOYMENT_OUTPUT=standalone
RUN npm run build \
  && mkdir -p .next/standalone/.next \
  && cp -a .next/static .next/standalone/.next/static \
  && if [ -d public ]; then cp -a public .next/standalone/public; fi

FROM node:24.12.0-bookworm-slim@sha256:7326fb2dbdce998edd72140946851be64ef4a643e8715e138ca467e8e9d92c99 AS production-dependencies
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN test "$(npm --version)" = "11.6.2" && npm ci --omit=dev

FROM node:24.12.0-bookworm-slim@sha256:7326fb2dbdce998edd72140946851be64ef4a643e8715e138ca467e8e9d92c99 AS runner
WORKDIR /app
ENV NODE_ENV=production \
  NEXT_TELEMETRY_DISABLED=1 \
  HOSTNAME=0.0.0.0 \
  PORT=3000
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/drizzle ./drizzle
COPY --from=builder --chown=node:node /app/scripts/deploy-entrypoint.mjs ./scripts/deploy-entrypoint.mjs
COPY --from=builder --chown=node:node /app/scripts/deploy-config-check.mjs ./scripts/deploy-config-check.mjs
COPY --from=builder --chown=node:node /app/scripts/deploy-migrate.mjs ./scripts/deploy-migrate.mjs
COPY --from=builder --chown=node:node /app/scripts/deployment-config.mjs ./scripts/deployment-config.mjs
COPY --from=builder --chown=node:node /app/scripts/deployment-target.mjs ./scripts/deployment-target.mjs
COPY --from=production-dependencies --chown=node:node /app/node_modules ./node_modules
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"
CMD ["node", "scripts/deploy-entrypoint.mjs"]
