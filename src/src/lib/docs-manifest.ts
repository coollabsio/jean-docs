import type { SerializedPageTree } from 'fumadocs-core/source/client';

export type LoaderData = {
  description: string;
  isIndex: boolean;
  ogImagePath: string;
  pageTree: SerializedPageTree;
  path: string;
  title: string;
  url: string;
};

export type DocsManifest = {
  pageTree: SerializedPageTree;
  pages: Record<string, Omit<LoaderData, 'pageTree'>>;
};

export function getManifestKey(slugs: string[]) {
  return slugs.join('/');
}
