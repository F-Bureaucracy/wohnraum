# syntax=docker/dockerfile:1

FROM oven/bun:1 AS deps
WORKDIR /app
COPY package.json bun.lock* bun.lockb* ./
RUN bun install --frozen-lockfile --ignore-scripts

FROM node:22-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN DATABASE_URL=file:build.db DATABASE_AUTH_TOKEN=build BETTER_AUTH_SECRET=build \
  node --run prepare && \
  DATABASE_URL=file:build.db DATABASE_AUTH_TOKEN=build BETTER_AUTH_SECRET=build \
  node --run build

# The migration entrypoint, bundled into a single file with drizzle-orm inlined.
# Its own stage because the build stage runs on node, which has no `bun build`.
# Bundling here rather than shipping drizzle-kit keeps the dev-only migration
# tooling out of the runtime image.
FROM oven/bun:1 AS migrate-build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun build scripts/migrate.ts --target=bun --outfile build/migrate.js

FROM oven/bun:1 AS prod-deps
WORKDIR /app
COPY package.json bun.lock* bun.lockb* ./
RUN bun install --frozen-lockfile --production --ignore-scripts

FROM oven/bun:1-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0


COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/build ./build
COPY --from=migrate-build /app/build/migrate.js ./build/migrate.js
# The migration SQL travels with the code it migrates for, so the PreSync hook
# can never apply a different version than the one being rolled out.
COPY drizzle ./drizzle
COPY package.json ./
USER bun
EXPOSE 3000
CMD ["bun", "./build/index.js"]

