import { siteDefinition } from '../../config/site.shared';

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

function fromEnv(name: string): string {
  return process.env[name] ?? process.env[`VITE_${name}`] ?? '';
}

const siteUrl = trimTrailingSlash(fromEnv('SITE_URL') || 'https://example.com');
const plausibleScriptUrl = trimTrailingSlash(fromEnv('PLAUSIBLE_SCRIPT_URL'));
const plausibleApiHost = trimTrailingSlash(
  fromEnv('PLAUSIBLE_API_HOST') || derivePlausibleApiHost(plausibleScriptUrl),
);

export const site = {
  ...siteDefinition,
  siteUrl,
  docsUrl: `${siteUrl}${siteDefinition.docsBasePath}`,
  searchApi: `${siteDefinition.docsBasePath}/api/search`,
  llmsUrl: `${siteDefinition.docsBasePath}/llms.txt`,
  llmsFullUrl: `${siteDefinition.docsBasePath}/llms-full.txt`,
  plausible: {
    domain: fromEnv('PLAUSIBLE_DOMAIN'),
    scriptUrl: plausibleScriptUrl,
    apiHost: plausibleApiHost,
  },
} as const;

export function absoluteUrl(pathname: string): string {
  return new URL(pathname, `${site.siteUrl}/`).toString();
}
