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
COPY package.json ./
EXPOSE 3000
CMD ["bun", "./build/index.js"]



