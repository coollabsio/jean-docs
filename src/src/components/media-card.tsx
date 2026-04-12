'use client';

import { ImageZoom } from 'fumadocs-ui/components/image-zoom';
import type { ReactNode } from 'react';
import { publicAssetFallbackPath, publicAssetPath } from '@/lib/site';

interface MediaCardProps {
  description: string;
  imageSrc: string;
  imageAlt?: string;
}

interface MediaCardGroupProps {
  children: ReactNode;
}

function getFallbackImageSrc(src: string): string | null {
  if (!src || /^(?:[a-z]+:)?\/\//i.test(src) || src.startsWith('data:')) return null;
  if (src.startsWith('/docs/')) return publicAssetFallbackPath(src.slice('/docs'.length) || '/');
  return publicAssetPath(src);
}

export function MediaCard({
  description,
  imageSrc,
  imageAlt = description,
}: MediaCardProps) {
  const resolvedSrc = getFallbackImageSrc(imageSrc) ?? imageSrc;

  return (
    <div
      data-media-card=""
      className="not-prose overflow-hidden rounded-lg border bg-fd-card text-fd-card-foreground"
    >
      <ImageZoom src={resolvedSrc} alt={imageAlt}>
        <img
          src={resolvedSrc}
          alt={imageAlt}
          className="m-0 block h-auto w-full cursor-zoom-in object-cover"
        />
      </ImageZoom>
      <p className="m-0 px-4 py-3 text-sm leading-6 text-fd-muted-foreground">{description}</p>
    </div>
  );
}

export function MediaCardGroup({ children }: MediaCardGroupProps) {
  return <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2">{children}</div>;
}
