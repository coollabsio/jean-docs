import { fileURLToPath } from 'node:url';

export function currentDirFromMetaUrl(metaUrl: string): string {
  return fileURLToPath(new URL('.', metaUrl));
}
