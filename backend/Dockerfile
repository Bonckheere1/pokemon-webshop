# NOTE: pinned to an intentionally old node:18.0.0 base image (Apr 2022) plus
# outdated npm dependencies (lodash 4.17.15, axios 0.21.1, minimist 1.2.5) so
# this image carries real, known CVEs for security-tool testing purposes.
# Do not use this Dockerfile as a template for production images.

# ---- Build stage ----
FROM node:18.0.0 AS builder
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---- Runtime stage ----
FROM node:18.0.0
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY data ./data
COPY assets ./assets

EXPOSE 4000
CMD ["node", "dist/server.js"]
