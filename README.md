# Jean Documentation

Official documentation for Jean, built with Fumadocs on TanStack Start and exported as a static site.

## Local development

```bash
cd src
bun install
bun run dev
```

Open `http://localhost:3000/docs`.

## Production build

```bash
cd src
bun run build
```

The static output is written to `src/.output/public/`.

## Environment

Copy `src/.env.example` to a local `.env` file and set the production values before building:

```bash
VITE_SITE_URL=https://your-domain.example
VITE_PLAUSIBLE_SCRIPT_URL=https://plausible.your-domain.example/js/script.js
VITE_PLAUSIBLE_DOMAIN=your-domain.example
# Optional: only set this if events should go to a different host or base path
# VITE_PLAUSIBLE_API_HOST=https://plausible.your-domain.example
```

## Docker

Build the static site first:

```bash
cd src
bun run build
cd ..
```

Then build and run the nginx image:

```bash
docker build \
  -t jean-docs .

docker run -p 8080:80 jean-docs
```

Open `http://localhost:8080/docs`.

## Included setup

- TanStack Start with Bun
- Fumadocs content authored from `src/content/docs`
- Static local search
- Static export under `/docs`
- Build-time OG image generation
- SEO metadata and JSON-LD
- Build-time sitemap and robots generation
- Globally available zoomable MDX images
- Plausible script wiring for pageview tracking
- nginx static serving config
- Docker deployment

## Project structure

```text
jean-docs/
├── src/
│   ├── config/
│   ├── content/docs/
│   ├── public/
│   ├── scripts/
│   ├── src/
│   ├── package.json
│   ├── source.config.ts
│   ├── tsconfig.json
│   └── vite.config.ts
├── Dockerfile
├── LICENSE
├── nginx.conf
└── README.md
```

## License

Apache License 2.0. See [LICENSE](LICENSE).
