# syntax=docker/dockerfile:1.7
# The site as an AWS Lambda container image: the Next.js standalone server, run by
# AWS Lambda Web Adapter. Built and pushed by .github/workflows/deploy.yml

# ---- Build ----
FROM --platform=linux/amd64 node:24-bookworm-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Public values end up in the browser code anyway, so they're plain build arguments
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_SITE_URL
# The git commit: version skew protection and part of every cache key
ARG NEXT_DEPLOYMENT_ID
ENV NEXT_TELEMETRY_DISABLED=1

# The build pre-renders pages from TMDB, so it needs the key. It's a BuildKit secret,
# read inline for this one command: never an ENV, a .env file, or an image layer
RUN --mount=type=secret,id=tmdb_api_key \
    TMDB_API_KEY="$(cat /run/secrets/tmdb_api_key)" npm run build

# ---- Runtime ----
FROM --platform=linux/amd64 node:24-bookworm-slim
WORKDIR /app

# Runs the normal Node server inside Lambda and streams its responses
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:1.1.0 /lambda-adapter /opt/extensions/lambda-adapter

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    AWS_LWA_INVOKE_MODE=response_stream \
    AWS_LWA_READINESS_CHECK_PATH=/api/health

COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public

# Lambda's disk is read-only except /tmp, so the image-resize cache lives there
RUN rm -rf ./.next/cache && ln -s /tmp/cache ./.next/cache

USER node
EXPOSE 3000
# /tmp starts empty on every new Lambda copy, so create the cache folder first
CMD ["sh", "-c", "mkdir -p /tmp/cache && exec node server.js"]
