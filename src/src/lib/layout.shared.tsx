import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { site } from './site';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: <span className="font-semibold tracking-tight">{site.name}</span>,
    },
  };
}
