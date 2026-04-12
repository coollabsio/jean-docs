# Jean Docs

Official documentation site for Jean.

This repo uses Fumadocs on TanStack Start with Bun, then exports the docs as a static site that is served from `/docs`.

## What this repo includes

- TanStack Start app powered by Bun
- Fumadocs content authored in MDX
- Static local search
- Static export for `/docs`
- Build-time OG image generation
- SEO metadata for docs pages
- Build-time `robots.txt` and `sitemap.xml`
- Global MDX components, including zoomable images and media cards
- Plausible pageview tracking
- nginx config for static serving and `/docs` routing
- Docker image for deployment
- GitHub Actions for staging and production image builds

## Project layout

```text
jean-docs/
├── src/
│   ├── .env.example
│   ├── content/docs/         # MDX docs content
│   ├── public/               # images, brand assets, manifest
│   ├── scripts/              # post-build generation
│   ├── src/                  # app code, components, routes
│   ├── package.json
│   ├── source.config.ts
│   ├── tsconfig.json
│   └── vite.config.ts
├── .github/workflows/
├── Dockerfile
├── LICENSE
├── nginx.conf
└── README.md
```

Everything related to the docs app lives under `src/`. The repo root only keeps deployment and project-level files such as `Dockerfile`, `nginx.conf`, `LICENSE`, Git metadata, and this README.

## Requirements

- [Bun](https://bun.sh/)
- Docker, if you want to test the production image locally

## Local development

Install dependencies:

```bash
cd src
bun install
```

Start the dev server:

```bash
bun run dev
```

Open http://localhost:3000/docs

## Production build

Build the static site:

```bash
cd src
bun run build
```

Generated output is written to:

```text
src/.output/public/
```

Important generated files:

- `src/.output/public/_shell.html`
- `src/.output/public/assets/*`
- `src/.output/public/docs-manifest.json`
- `src/.output/public/robots.txt`
- `src/.output/public/sitemap.xml`
- `src/.output/public/og/*`

The build also removes non-static Nitro server artifacts so the deploy output stays static-only.

## Environment variables

Copy `src/.env.example` to `src/.env` and adjust the values for your environment.

```bash
cp src/.env.example src/.env
```

Current variables:

```bash
# Public site URL used for canonical URLs, sitemap entries, and OG metadata
VITE_SITE_URL=https://example.com

# Plausible script URL loaded by the browser
VITE_PLAUSIBLE_SCRIPT_URL=https://plausible.example.com/js/script.js

# Domain recorded in Plausible analytics for these docs pageviews
VITE_PLAUSIBLE_DOMAIN=example.com

# Optional: only set this if events should go to a different host or base path
# VITE_PLAUSIBLE_API_HOST=https://plausible.example.com
```

For Jean production, the docs are expected to live under `https://jean.build/docs`, so Plausible should usually track `jean.build/docs`.

## Docker

Build the image:

```bash
docker build -t jean-docs:latest .
```

Run it locally:

```bash
docker run -p 8080:8080 jean-docs:latest
```

Open http://localhost:8080/docs

### How the image works

1. Dependencies are installed with Bun inside the builder stage.
2. The docs app is built inside `src/`.
3. Only static output from `src/.output/public` is copied into nginx.
4. nginx serves the docs from `/docs`.

The container listens on port `8080`.

## nginx behavior

`nginx.conf` is intentionally small and only handles static serving concerns:

- serve the built docs from `/docs`
- serve hashed assets from `/docs/assets`
- serve OG images from `/docs/og`
- fall back to `/docs/_shell.html` for docs routes
- do not redirect `/` to `/docs`

That last point matters because the main Jean website lives at the root domain and the docs live only under `/docs`.

## Content authoring

Docs content lives in:

```sh
src/content/docs/
```

This is where the sidebar structure, page frontmatter, and MDX content live.

Reusable docs components are globally available through the MDX setup, so pages can use components like zoomable images and media cards without importing them manually on every page.

## Search

Search is configured to use local static search by default.

That means the docs build includes the data needed for local search without requiring an external search backend for the default experience.

## Build-time generated assets

The post-build script handles more than just cleanup. It also generates:

- Open Graph images for docs pages
- `robots.txt`
- `sitemap.xml`
- `docs-manifest.json`
- copied public brand and image assets under the `/docs` path

The relevant script lives at `src/scripts/postbuild.ts`.

## Analytics

Plausible is wired for pageview tracking through environment variables so the same codebase can be used for local, staging, and production environments.

Production and staging workflow defaults are:

- production domain: `jean.build/docs`
- staging domain: `next.jean.build/docs`

## GitHub Actions

The repo includes two build-and-publish workflows:

- `production-build.yml`
- `staging-build.yml`

They build multi-arch Docker images for GHCR and then trigger deployment through Coolify webhooks.

### Required secrets

Production:

- `VITE_PLAUSIBLE_SCRIPT_URL`
- `VITE_PLAUSIBLE_API_HOST` (optional)
- `COOLIFY_WEBHOOK`
- `COOLIFY_TOKEN`

Staging:

- `VITE_PLAUSIBLE_SCRIPT_URL_NEXT`
- `VITE_PLAUSIBLE_API_HOST_NEXT` (optional)
- `COOLIFY_WEBHOOK_NEXT`
- `COOLIFY_TOKEN`

## Common commands

```bash
# install dependencies
cd src && bun install

# start dev server
cd src && bun run dev

# production build
cd src && bun run build

# type check
cd src && bun run types:check

# build Docker image
docker build -t jean-docs:latest .

# run Docker image locally
docker run -p 8080:8080 jean-docs:latest
```