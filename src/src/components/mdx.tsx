import defaultMdxComponents from 'fumadocs-ui/mdx';
import { Callout } from 'fumadocs-ui/components/callout';
import { Card, Cards } from 'fumadocs-ui/components/card';
import { File, Files, Folder } from 'fumadocs-ui/components/files';
import { Step, Steps } from 'fumadocs-ui/components/steps';
import { Tab, Tabs } from 'fumadocs-ui/components/tabs';
import type { MDXComponents } from 'mdx/types';
import { MediaCard, MediaCardGroup } from './media-card';
import { ScreenshotTab, ScreenshotTabs } from './screenshot-tabs';
import { ZoomImage } from './zoom-image';

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    Callout,
    Card,
    Cards,
    File,
    Files,
    Folder,
    MediaCard,
    MediaCardGroup,
    ScreenshotTab,
    ScreenshotTabs,
    Step,
    Steps,
    Tab,
    Tabs,
    img: (props) => <ZoomImage {...(props as any)} />,
    Image: ZoomImage,
    ZoomImage,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
