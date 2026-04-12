import { createServerFn } from '@tanstack/react-start';
import { createFileRoute, notFound } from '@tanstack/react-router';
import browserCollections from 'collections/browser';
import { useFumadocsLoader } from 'fumadocs-core/source/client';
import { Suspense } from 'react';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
  MarkdownCopyButton,
} from 'fumadocs-ui/layouts/docs/page';
import { useMDXComponents } from '@/components/mdx';
import { JeanViewOptionsPopover } from '@/components/page-actions';
import { type DocsManifest, getManifestKey, type LoaderData } from '@/lib/docs-manifest';
import { baseOptions } from '@/lib/layout.shared';
import { absoluteUrl, getDocGithubPath, getDocOgPath, site } from '@/lib/site';
import { getPageMarkdownUrl, source } from '@/lib/source';

function toPublicDocUrl(url: string): string {
  if (url === '/') return site.docsBasePath;
  return `${site.docsBasePath}${url}`;
}

export const Route = createFileRoute('/$')({
  component: Page,
  loader: async ({ params }) => {
    const slugs = params._splat?.split('/').filter(Boolean) ?? [];
    const data = await loadPageData(slugs);
    await clientLoader.preload(data.path);
    return data;
  },
  head: ({ loaderData }) => {
    const data = loaderData as LoaderData | undefined;
    if (!data) {
      return {};
    }

    const title = data.isIndex ? site.title : `${data.title} | ${site.title}`;
    const description = data.description || site.description;
    const canonicalUrl = absoluteUrl(data.url.endsWith('/') ? data.url : `${data.url}`);
    const ogImageUrl = data.ogImagePath;
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': data.isIndex ? 'WebPage' : 'TechArticle',
      headline: data.title,
      description,
      url: canonicalUrl,
      image: absoluteUrl(data.ogImagePath),
      inLanguage: site.locale,
      publisher: {
        '@type': 'Organization',
        name: site.name,
      },
    };

    return {
      meta: [
        { title },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:url', content: canonicalUrl },
        { property: 'og:image', content: ogImageUrl },
        { property: 'og:image:type', content: 'image/png' },
        { property: 'og:image:width', content: String(site.og.width) },
        { property: 'og:image:height', content: String(site.og.height) },
        { property: 'og:type', content: data.isIndex ? 'website' : 'article' },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description },
        { name: 'twitter:image', content: ogImageUrl },
      ],
      links: [{ rel: 'canonical', href: canonicalUrl }],
      scripts: [
        {
          type: 'application/ld+json',
          children: JSON.stringify(structuredData),
        },
      ],
    };
  },
});

const serverLoader = createServerFn({
  method: 'GET',
})
  .inputValidator((slugs: string[]) => slugs)
  .handler(async ({ data: slugs }) => {
    const page = source.getPage(slugs);
    if (!page) throw notFound();

    return {
      description: page.data.description ?? site.description,
      isIndex: page.slugs.length === 0,
      markdownUrl: getPageMarkdownUrl(page).url,
      ogImagePath: getDocOgPath(page.slugs),
      pageTree: await source.serializePageTree(source.getPageTree()),
      path: page.path,
      title: page.data.title,
      url: toPublicDocUrl(page.url),
    } satisfies LoaderData;
  });

let docsManifestPromise: Promise<DocsManifest> | undefined;

async function loadDocsManifest() {
  docsManifestPromise ??= fetch(`${site.docsBasePath}/docs-manifest.json`, {
    method: 'GET',
  }).then(async (response) => {
    if (!response.ok) {
      throw new Error(`Failed to load docs manifest: ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as DocsManifest;
  });

  return docsManifestPromise;
}

async function loadPageData(slugs: string[]) {
  if (import.meta.env.PROD && typeof document !== 'undefined') {
    const manifest = await loadDocsManifest();
    const page = manifest.pages[getManifestKey(slugs)];

    if (!page) throw notFound();

    return {
      ...page,
      pageTree: manifest.pageTree,
    } satisfies LoaderData;
  }

  return serverLoader({ data: slugs });
}

const clientLoader = browserCollections.docs.createClientLoader({
  component(
    { toc, frontmatter, default: MDX },
    { markdownUrl, path }: { markdownUrl: string; path: string },
  ) {
    return (
      <DocsPage toc={toc}>
        <DocsTitle>{frontmatter.title}</DocsTitle>
        <DocsDescription>{frontmatter.description}</DocsDescription>
        <div className="flex flex-row items-center gap-2 border-b -mt-4 pb-6">
          <MarkdownCopyButton markdownUrl={markdownUrl} />
          <JeanViewOptionsPopover markdownUrl={markdownUrl} githubUrl={getDocGithubPath(path)} />
        </div>
        <DocsBody>
          <MDX components={useMDXComponents()} />
        </DocsBody>
      </DocsPage>
    );
  },
});

function Page() {
  const data = useFumadocsLoader(Route.useLoaderData());

  return (
    <DocsLayout {...baseOptions()} tree={data.pageTree}>
      <Suspense>{clientLoader.useContent(data.path, { markdownUrl: data.markdownUrl, path: data.path })}</Suspense>
    </DocsLayout>
  );
}
