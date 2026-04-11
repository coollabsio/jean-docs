import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { loader, source as createSource } from 'fumadocs-core/source';
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

function renderOgSvg(title: string, description: string, routePath: string): string {
  const maxDescription = description.slice(0, 180);

  return `
    <svg width="${site.og.width}" height="${site.og.height}" viewBox="0 0 ${site.og.width} ${site.og.height}" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="${site.og.width}" height="${site.og.height}" fill="${site.og.background}" />
      <rect x="52" y="52" width="1096" height="526" rx="28" fill="${site.og.card}" />
      <rect x="52" y="52" width="1096" height="526" rx="28" stroke="rgba(255,255,255,0.08)" />
      <circle cx="1024" cy="126" r="124" fill="${site.og.accent}" fill-opacity="0.16" />
      <circle cx="1104" cy="470" r="156" fill="${site.og.accentSoft}" fill-opacity="0.1" />
      <text x="104" y="142" fill="${site.og.accent}" font-size="30" font-family="Arial, sans-serif" font-weight="700">Jean</text>
      <text x="104" y="238" fill="${site.og.text}" font-size="70" font-family="Arial, sans-serif" font-weight="700">${escapeXml(title)}</text>
      <foreignObject x="104" y="276" width="760" height="170">
        <div xmlns="http://www.w3.org/1999/xhtml" style="color:${site.og.muted};font-family:Arial, sans-serif;font-size:30px;line-height:1.45;">
          ${escapeXml(maxDescription)}
        </div>
      </foreignObject>
      <text x="104" y="520" fill="${site.og.text}" font-size="24" font-family="Arial, sans-serif">${escapeXml(
        absoluteUrl(routePath),
      )}</text>
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

      const svg = renderOgSvg(doc.title, doc.description, doc.routePath);
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
  const docSourceFiles = await getDocSourceFiles();
  const docSource = createSource(docSourceFiles);
  const docLoader = loader({
    source: docSource,
    baseUrl: site.docsBasePath,
  });
  const pageTree = await docLoader.serializePageTree(docLoader.getPageTree());
  const pages = Object.fromEntries(
    docLoader.getPages().map((page) => [
      getManifestKey(page.slugs),
      {
        description: page.data.description ?? site.description,
        isIndex: page.slugs.length === 0,
        ogImagePath: getDocOgPath(page.slugs),
        path: page.path,
        title: page.data.title,
        url: page.url,
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
await cleanupNonStaticOutput();
