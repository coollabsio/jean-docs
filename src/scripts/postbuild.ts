import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { loader, source as createSource } from 'fumadocs-core/source';
import { lucideIconsPlugin } from 'fumadocs-core/source/lucide-icons';
import { getDocEntries, getDocSourceFiles } from './lib/content';
import { getManifestKey } from '../src/lib/docs-manifest';
import { absoluteUrl, site } from './lib/site';
import { getDocOgPath } from '../src/lib/site';

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function wrapText(value: string, maxCharsPerLine: number, maxLines: number) {
  const words = value.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxCharsPerLine) {
      current = candidate;
      continue;
    }

    if (current) {
      lines.push(current);
      current = word;
    } else {
      lines.push(word.slice(0, maxCharsPerLine));
      current = word.slice(maxCharsPerLine);
    }

    if (lines.length === maxLines) break;
  }

  if (lines.length < maxLines && current) {
    lines.push(current);
  }

  if (lines.length > maxLines) {
    return lines.slice(0, maxLines);
  }

  const remainingWords = words.join(' ');
  const consumed = lines.join(' ');
  if (consumed.length < remainingWords.length && lines.length > 0) {
    const lastIndex = lines.length - 1;
    lines[lastIndex] = `${lines[lastIndex].replace(/\.*$/, '')}...`;
  }

  return lines;
}

function renderJeanLogoSvg(x: number, y: number, scale = 1): string {
  const shadowOffset = 26 * scale;
  const left = { x, y: y + 110 * scale, width: 74 * scale, height: 138 * scale };
  const bottom = { x: x + 74 * scale, y: y + 248 * scale, width: 190 * scale, height: 92 * scale };
  const right = { x: x + 264 * scale, y, width: 96 * scale, height: 248 * scale };

  return `
    <defs>
      <linearGradient id="jean-logo-gradient" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#9E73FF" />
        <stop offset="100%" stop-color="#7A46F2" />
      </linearGradient>
    </defs>
    <rect x="${left.x + shadowOffset}" y="${left.y + shadowOffset}" width="${left.width}" height="${left.height}" fill="#2A2454" />
    <rect x="${bottom.x + shadowOffset}" y="${bottom.y + shadowOffset}" width="${bottom.width}" height="${bottom.height}" fill="#2A2454" />
    <rect x="${right.x + shadowOffset}" y="${right.y + shadowOffset}" width="${right.width}" height="${right.height}" fill="#2A2454" />
    <rect x="${left.x}" y="${left.y}" width="${left.width}" height="${left.height}" fill="url(#jean-logo-gradient)" />
    <rect x="${bottom.x}" y="${bottom.y}" width="${bottom.width}" height="${bottom.height}" fill="url(#jean-logo-gradient)" />
    <rect x="${right.x}" y="${right.y}" width="${right.width}" height="${right.height}" fill="url(#jean-logo-gradient)" />
  `.trim();
}

function renderOgSvg(title: string, description: string): string {
  const titleLines = wrapText(title, 22, 3);
  const descriptionLines = wrapText(description, 48, 3);
  const titleLineHeight = 82;
  const descriptionLineHeight = 42;
  const titleFontSize = 72;
  const descriptionFontSize = 34;
  const blockGap = 8;
  const contentBottomY = 554;
  const titleHeight = titleLines.length * titleLineHeight;
  const descriptionHeight = descriptionLines.length * descriptionLineHeight;
  const contentHeight = titleHeight + blockGap + descriptionHeight;
  const titleStartY = contentBottomY - contentHeight + titleFontSize;
  const descriptionStartY = titleStartY + titleHeight + blockGap + (descriptionFontSize - descriptionLineHeight);

  return `
    <svg width="${site.og.width}" height="${site.og.height}" viewBox="0 0 ${site.og.width} ${site.og.height}" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg-gradient" x1="0" y1="0" x2="1200" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="4%" stop-color="#8850E2" />
          <stop offset="96.5%" stop-color="#100D5B" />
        </linearGradient>
        <linearGradient id="vignette-gradient" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="rgba(255,255,255,0.06)" />
          <stop offset="100%" stop-color="rgba(0,0,0,0.18)" />
        </linearGradient>
      </defs>

      <rect width="${site.og.width}" height="${site.og.height}" rx="32" fill="url(#bg-gradient)" />
      <rect width="${site.og.width}" height="${site.og.height}" rx="32" fill="url(#vignette-gradient)" />
      ${renderJeanLogoSvg(74, 62, 0.56)}
      ${titleLines
        .map(
          (line, index) =>
          `<text x="72" y="${titleStartY + index * titleLineHeight}" fill="${site.og.text}" font-size="${titleFontSize}" font-family="'Inter', 'DejaVu Sans', 'Noto Sans', Arial, sans-serif" font-weight="800" letter-spacing="-1.8">${escapeXml(line)}</text>`,
        )
        .join('')}
      ${descriptionLines
        .map(
          (line, index) =>
            `<text x="72" y="${descriptionStartY + index * descriptionLineHeight}" fill="${site.og.muted}" font-size="${descriptionFontSize}" font-family="'Inter', 'DejaVu Sans', 'Noto Sans', Arial, sans-serif" font-weight="500" letter-spacing="-0.3">${escapeXml(line)}</text>`,
        )
        .join('')}
    </svg>
  `.trim();
}

async function writeOgImages() {
  const docs = await getDocEntries();
  const outputRoot = resolve(import.meta.dir, '../.output/public');

  await Promise.all(
    docs.map(async (doc) => {
      const outputPath = resolve(outputRoot, doc.ogOutputPath);
      await mkdir(dirname(outputPath), { recursive: true });

      const svg = renderOgSvg(doc.title, doc.description);
      const png = new Resvg(svg).render().asPng();

      await writeFile(outputPath, png);
    }),
  );
}

async function writeSitemap() {
  const docs = await getDocEntries();
  const outputRoot = resolve(import.meta.dir, '../.output/public');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${docs
  .map(
    (doc) => `  <url>
    <loc>${escapeXml(absoluteUrl(doc.routePath))}</loc>
    <lastmod>${doc.lastModified}</lastmod>
  </url>`,
  )
  .join('\n')}
</urlset>
`;

  await mkdir(outputRoot, { recursive: true });
  await writeFile(resolve(outputRoot, 'sitemap.xml'), xml, 'utf8');
}

async function writeRobots() {
  const outputRoot = resolve(import.meta.dir, '../.output/public');
  const robots = `User-agent: *
Allow: /

Sitemap: ${absoluteUrl(`${site.docsBasePath}/sitemap.xml`)}
`;

  await mkdir(outputRoot, { recursive: true });
  await writeFile(resolve(outputRoot, 'robots.txt'), robots, 'utf8');
}

async function writeDocsManifest() {
  const outputRoot = resolve(import.meta.dir, '../.output/public');
  const { metas, pages: sourcePages } = await getDocSourceFiles();
  const docsSource = loader({
    source: createSource({ metas, pages: sourcePages }),
    baseUrl: '/',
    plugins: [lucideIconsPlugin()],
  });
  const pageTree = await docsSource.serializePageTree(docsSource.getPageTree());
  const pages = Object.fromEntries(
    docsSource.getPages().map((page) => [
      getManifestKey(page.slugs),
      {
        description: page.data.description ?? site.description,
        isIndex: page.slugs.length === 0,
        ogImagePath: getDocOgPath(page.slugs),
        path: page.path,
        title: page.data.title,
        url: page.url === '/' ? site.docsBasePath : `${site.docsBasePath}${page.url}`,
      },
    ]),
  );

  await mkdir(outputRoot, { recursive: true });
  await writeFile(
    resolve(outputRoot, 'docs-manifest.json'),
    JSON.stringify({ pageTree, pages }, null, 2),
    'utf8',
  );
}

async function copyBaseScopedPublicAssets() {
  const publicImages = resolve(import.meta.dir, '../public/images');
  const docsImages = resolve(import.meta.dir, '../.output/public/docs/images');
  const publicBrand = resolve(import.meta.dir, '../public/brand');
  const docsBrand = resolve(import.meta.dir, '../.output/public/docs/brand');
  const publicManifest = resolve(import.meta.dir, '../public/site.webmanifest');
  const docsManifest = resolve(import.meta.dir, '../.output/public/docs/site.webmanifest');

  await cp(publicImages, docsImages, { recursive: true, force: true });
  await cp(publicBrand, docsBrand, { recursive: true, force: true });
  await cp(publicManifest, docsManifest, { force: true });
}

async function cleanupNonStaticOutput() {
  const outputRoot = resolve(import.meta.dir, '../.output');

  await Promise.all([
    rm(resolve(outputRoot, 'server'), { recursive: true, force: true }),
    rm(resolve(outputRoot, 'nitro.json'), { force: true }),
  ]);
}

await writeOgImages();
await writeSitemap();
await writeRobots();
await writeDocsManifest();
await copyBaseScopedPublicAssets();
await cleanupNonStaticOutput();
