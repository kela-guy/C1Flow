import { lazy, Suspense, type ComponentType } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { MDXProvider } from '@mdx-js/react';
import { mdxComponents } from './components';
import { withDocsLayout } from './DocsLayout';
import { docsPages, type DocsPageMeta } from './docsConfig';
import introductionMarkdown from '@/content/docs/index.mdx?raw';
import installationMarkdown from '@/content/docs/installation.mdx?raw';
import themingMarkdown from '@/content/docs/theming.mdx?raw';
import componentsMarkdown from '@/content/docs/components/index.mdx?raw';
import buttonMarkdown from '@/content/docs/components/button.mdx?raw';

const Introduction = lazy(() => import('@/content/docs/index.mdx'));
const Installation = lazy(() => import('@/content/docs/installation.mdx'));
const Theming = lazy(() => import('@/content/docs/theming.mdx'));
const Components = lazy(() => import('@/content/docs/components/index.mdx'));
const Button = lazy(() => import('@/content/docs/components/button.mdx'));

const routes: Array<{
  path: string;
  href: string;
  Component: ComponentType;
  markdown: string;
}> = [
  { path: '/', href: '/docs', Component: Introduction, markdown: introductionMarkdown },
  { path: '/installation', href: '/docs/installation', Component: Installation, markdown: installationMarkdown },
  { path: '/theming', href: '/docs/theming', Component: Theming, markdown: themingMarkdown },
  { path: '/components', href: '/docs/components', Component: Components, markdown: componentsMarkdown },
  { path: '/components/button', href: '/docs/components/button', Component: Button, markdown: buttonMarkdown },
];

function metaForHref(href: string): DocsPageMeta {
  const meta = docsPages.find((page) => page.href === href);
  if (!meta) throw new Error(`Missing docs metadata for ${href}`);
  return meta;
}

function DocsRoute({
  Component,
  meta,
  markdown,
}: {
  Component: ComponentType;
  meta: DocsPageMeta;
  markdown: string;
}) {
  return (
    <MDXProvider components={mdxComponents}>
      <Suspense fallback={<div className="h-4 w-32 animate-pulse rounded-md bg-state-hover" />}>
        {withDocsLayout(Component, meta, markdown)}
      </Suspense>
    </MDXProvider>
  );
}

export default function DocsApp() {
  const location = useLocation();

  return (
    <Routes location={location}>
      {routes.map((route) => (
        <Route
          key={route.href}
          path={route.path}
          element={<DocsRoute Component={route.Component} meta={metaForHref(route.href)} markdown={route.markdown} />}
        />
      ))}
      <Route path="*" element={<Navigate to="/docs" replace />} />
    </Routes>
  );
}
