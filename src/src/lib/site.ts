import { siteDefinition } from '@config/site.shared';

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

function derivePlausibleApiHost(scriptUrl: string): string {
  if (!scriptUrl) return '';

  try {
    const url = new URL(scriptUrl);
    const pathname = url.pathname.replace(/\/js\/[^/]+$/, '') || '/';
    return trimTrailingSlash(new URL(pathname, url.origin).toString());
  } catch {
    return '';
  }
}

const siteUrl = trimTrailingSlash(import.meta.env.VITE_SITE_URL || 'https://example.com');
const plausibleScriptUrl = trimTrailingSlash(import.meta.env.VITE_PLAUSIBLE_SCRIPT_URL || '');
const plausibleApiHost = trimTrailingSlash(
  import.meta.env.VITE_PLAUSIBLE_API_HOST || derivePlausibleApiHost(plausibleScriptUrl),
);

export const site = {
  ...siteDefinition,
  siteUrl,
  docsUrl: `${siteUrl}${siteDefinition.docsBasePath}`,
  searchApi: `${siteDefinition.docsBasePath}/api/search`,
  llmsUrl: `${siteDefinition.docsBasePath}/llms.txt`,
  llmsFullUrl: `${siteDefinition.docsBasePath}/llms-full.txt`,
  plausible: {
    enabled: Boolean(plausibleScriptUrl && import.meta.env.VITE_PLAUSIBLE_DOMAIN),
    domain: import.meta.env.VITE_PLAUSIBLE_DOMAIN || '',
    scriptUrl: plausibleScriptUrl,
    apiHost: plausibleApiHost,
  },
} as const;

export function absoluteUrl(pathname: string): string {
  return new URL(pathname, `${site.siteUrl}/`).toString();
}

export function getDocOgPath(slugs: string[]): string {
  if (slugs.length === 0) return `${site.docsBasePath}/og/index.png`;
  return `${site.docsBasePath}/og/${slugs.join('/')}.png`;
}
