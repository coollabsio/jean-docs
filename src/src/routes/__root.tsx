import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router';
import { RootProvider } from 'fumadocs-ui/provider/tanstack';
import * as React from 'react';
import SearchDialog from '@/components/search';
import { absoluteUrl, site } from '@/lib/site';
import appCss from '@/styles/app.css?url';

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: site.title,
      },
      {
        name: 'description',
        content: site.description,
      },
      {
        name: 'theme-color',
        content: site.themeColor,
      },
      {
        name: 'robots',
        content: 'index,follow',
      },
      {
        property: 'og:site_name',
        content: site.title,
      },
      {
        property: 'og:type',
        content: 'website',
      },
      {
        property: 'og:title',
        content: site.title,
      },
      {
        property: 'og:description',
        content: site.description,
      },
      {
        property: 'og:image',
        content: absoluteUrl(`${site.docsBasePath}/og/index.png`),
      },
      {
        name: 'twitter:card',
        content: 'summary_large_image',
      },
      {
        name: 'twitter:title',
        content: site.title,
      },
      {
        name: 'twitter:description',
        content: site.description,
      },
      {
        name: 'keywords',
        content: site.keywords.join(', '),
      },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', href: `${site.docsBasePath}/favicon.svg`, type: 'image/svg+xml' },
      { rel: 'manifest', href: `${site.docsBasePath}/site.webmanifest` },
      { rel: 'alternate', href: absoluteUrl(site.llmsUrl), title: 'Jean LLM Index', type: 'text/plain' },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <html lang={site.locale} suppressHydrationWarning>
      <head>
        <HeadContent />
        {site.plausible.enabled ? (
          <script
            defer
            data-domain={site.plausible.domain}
            src={site.plausible.scriptUrl}
            {...(site.plausible.apiHost
              ? {
                  'data-api': `${site.plausible.apiHost}/api/event`,
                }
              : {})}
          />
        ) : null}
      </head>
      <body className="flex min-h-screen flex-col">
        <RootProvider search={{ SearchDialog }}>
          <Outlet />
        </RootProvider>
        <Scripts />
      </body>
    </html>
  );
}
