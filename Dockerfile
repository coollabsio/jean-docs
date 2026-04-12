# syntax=docker/dockerfile:1.7

FROM oven/bun:1.3.6-alpine AS builder

ARG VITE_SITE_URL=https://jean.build
ARG VITE_PLAUSIBLE_SCRIPT_URL=
ARG VITE_PLAUSIBLE_DOMAIN=jean.build/docs
ARG VITE_PLAUSIBLE_API_HOST=

ENV VITE_SITE_URL=${VITE_SITE_URL}
ENV VITE_PLAUSIBLE_SCRIPT_URL=${VITE_PLAUSIBLE_SCRIPT_URL}
ENV VITE_PLAUSIBLE_DOMAIN=${VITE_PLAUSIBLE_DOMAIN}
ENV VITE_PLAUSIBLE_API_HOST=${VITE_PLAUSIBLE_API_HOST}

WORKDIR /app/src

COPY src/package.json src/bun.lock ./

RUN --mount=type=cache,target=/root/.bun \
    --mount=type=cache,target=/root/.cache/bun \
    bun install --frozen-lockfile

WORKDIR /app

COPY src ./src

RUN --mount=type=cache,target=/root/.bun \
    --mount=type=cache,target=/root/.cache/bun \
    cd src && rm -rf .output .tanstack && bun run build

FROM nginxinc/nginx-unprivileged:1.29.3-alpine-slim AS final

WORKDIR /usr/share/nginx/html

COPY --from=builder /app/src/.output/public /usr/share/nginx/html/docs
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
