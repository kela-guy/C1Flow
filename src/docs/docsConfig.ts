export interface DocsNavItem {
  title: string;
  href: string;
  description?: string;
}

export interface DocsNavSection {
  title: string;
  items: DocsNavItem[];
}

export interface DocsPageMeta {
  title: string;
  description: string;
  href: string;
}

export const docsSections: DocsNavSection[] = [
  {
    title: 'Sections',
    items: [
      {
        title: 'Introduction',
        href: '/docs',
        description: 'C2 Hub components, registry, and design rules.',
      },
      {
        title: 'Installation',
        href: '/docs/installation',
        description: 'Install registry components into a Vite app.',
      },
      {
        title: 'Theming',
        href: '/docs/theming',
        description: 'Use the C2 token layers without hardcoded colors.',
      },
    ],
  },
  {
    title: 'Components',
    items: [
      {
        title: 'Components',
        href: '/docs/components',
        description: 'Registry-backed component catalog.',
      },
      {
        title: 'Button',
        href: '/docs/components/button',
        description: 'Actions, links, and icon buttons.',
      },
    ],
  },
  {
    title: 'Registry',
    items: [
      {
        title: 'Styleguide',
        href: '/styleguide',
        description: 'Current C2 component showroom.',
      },
    ],
  },
];

export const docsPages: DocsPageMeta[] = docsSections.flatMap((section) =>
  section.items.filter((item) => item.href.startsWith('/docs')).map((item) => ({
    title: item.title,
    description: item.description ?? item.title,
    href: item.href,
  })),
);

export function getPager(href: string) {
  const index = docsPages.findIndex((page) => page.href === href);
  return {
    prev: index > 0 ? docsPages[index - 1] : null,
    next: index >= 0 && index < docsPages.length - 1 ? docsPages[index + 1] : null,
  };
}
