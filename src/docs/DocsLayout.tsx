import { lazy, Suspense, useEffect, useMemo, useState, type ComponentType, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { PanelLeft, Search, X } from '@/lib/icons/central';
import { cn } from '@/app/components/ui/utils';
import { CopyButton } from './components';
import { docsSections, getPager, type DocsPageMeta } from './docsConfig';

const DocsSearch = lazy(() => import('./DocsSearch').then((module) => ({ default: module.DocsSearch })));

interface TocItem {
  id: string;
  text: string;
  level: 2 | 3;
}

export function DocsLayout({
  meta,
  children,
  markdown,
}: {
  meta: DocsPageMeta;
  children: ReactNode;
  markdown: string;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [meta.href]);

  return (
    <div className="min-h-screen bg-surface-1 text-slate-12">
      <a
        href="#docs-main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-slate-12 focus:px-3 focus:py-2 focus:text-surface-1"
      >
        Skip to content
      </a>
      <DocsHeader onMobileOpen={() => setMobileOpen(true)} />
      {mobileOpen && <MobileSidebar onClose={() => setMobileOpen(false)} />}
      <div className="mx-auto grid max-w-screen-2xl grid-cols-1 lg:grid-cols-[256px_minmax(0,1fr)_224px]">
        <aside className="hidden border-r border-border-default lg:block">
          <div className="sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto px-6 py-6">
            <DocsSidebar />
          </div>
        </aside>
        <main id="docs-main-content" className="min-w-0 px-4 py-8 lg:px-8 lg:py-10">
          <div className="mx-auto w-full max-w-3xl">
            <DocsPageHeader meta={meta} markdown={markdown} />
            <div className="mt-8">{children}</div>
            <DocsPager href={meta.href} />
          </div>
        </main>
        <DocsToc />
      </div>
    </div>
  );
}

function DocsHeader({ onMobileOpen }: { onMobileOpen: () => void }) {
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border-default bg-surface-1/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-screen-2xl items-center gap-2 px-4 lg:px-8">
          <button
            type="button"
            onClick={onMobileOpen}
            aria-label="Open docs navigation"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-n-9 transition-colors hover:bg-state-hover hover:text-slate-12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-strong lg:hidden"
          >
            <PanelLeft size={18} />
          </button>
          <Link to="/docs" className="mr-4 flex items-center gap-1.5 text-sm font-bold tracking-tight">
            <span>C2 Hub</span>
            <span className="font-normal text-n-8">docs</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm lg:flex">
            <NavLink to="/docs" end className={({ isActive }) => navClass(isActive)}>Docs</NavLink>
            <NavLink to="/docs/components" className={({ isActive }) => navClass(isActive)}>Components</NavLink>
            <NavLink to="/styleguide" className={() => navClass(false)}>Styleguide</NavLink>
          </nav>
          <div className="flex-1" />
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="hidden h-9 w-64 items-center justify-between rounded-md border border-border-default bg-state-hover px-3 text-sm text-n-8 transition-colors hover:border-border-strong hover:text-slate-12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-strong md:inline-flex"
          >
            <span className="inline-flex items-center gap-2">
              <Search size={14} />
              Search documentation
            </span>
            <kbd className="rounded bg-state-hover-strong px-1.5 py-0.5 font-mono text-[10px] text-n-7">⌘K</kbd>
          </button>
        </div>
      </header>
      {searchOpen && (
        <Suspense fallback={null}>
          <DocsSearch open={searchOpen} onOpenChange={setSearchOpen} />
        </Suspense>
      )}
    </>
  );
}

function navClass(isActive: boolean) {
  return cn(
    'font-medium transition-colors hover:text-slate-12',
    isActive ? 'text-slate-12' : 'text-n-8',
  );
}

function MobileSidebar({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        aria-label="Close docs navigation"
        className="absolute inset-0 bg-surface-1/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative h-full w-80 overflow-y-auto border-r border-border-default bg-surface-2 p-6">
        <div className="mb-6 flex items-center justify-between">
          <Link to="/docs" className="text-sm font-bold tracking-tight">C2 Hub docs</Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close docs navigation"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-n-9 hover:bg-state-hover hover:text-slate-12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-strong"
          >
            <X size={18} />
          </button>
        </div>
        <DocsSidebar />
      </div>
    </div>
  );
}

function DocsSidebar() {
  return (
    <nav aria-label="Docs navigation" className="space-y-6">
      {docsSections.map((section) => (
        <div key={section.title}>
          <h2 className="mb-1 rounded-md px-2 py-1 text-sm font-semibold text-slate-12">{section.title}</h2>
          <ul>
            {section.items.map((item) => (
              <li key={item.href}>
                <NavLink
                  to={item.href}
                  end={item.href === '/docs'}
                  className={({ isActive }) =>
                    cn(
                      'flex h-8 items-center rounded-md px-2 text-sm transition-colors hover:bg-state-hover hover:text-slate-12',
                      isActive ? 'bg-state-hover-strong font-medium text-slate-12' : 'text-n-8',
                    )
                  }
                >
                  {item.title}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function DocsPageHeader({ meta, markdown }: { meta: DocsPageMeta; markdown: string }) {
  return (
    <header>
      <div className="flex items-start justify-between gap-4">
        <h1 className="scroll-m-20 text-3xl font-bold tracking-tight">{meta.title}</h1>
        <CopyButton text={markdown} label="Copy Page" className="shrink-0 border border-border-default" />
      </div>
      <p className="mt-4 text-lg leading-8 text-n-9">{meta.description}</p>
    </header>
  );
}

function DocsPager({ href }: { href: string }) {
  const { prev, next } = getPager(href);
  if (!prev && !next) return null;

  return (
    <nav className="mt-12 flex items-center justify-between border-t border-border-default pt-6" aria-label="Docs pager">
      <div>
        {prev && (
          <Link to={prev.href} className="inline-flex flex-col items-start text-sm hover:text-slate-12">
            <span className="text-xs text-n-8">Previous</span>
            <span className="font-medium">{prev.title}</span>
          </Link>
        )}
      </div>
      <div>
        {next && (
          <Link to={next.href} className="inline-flex flex-col items-end text-sm hover:text-slate-12">
            <span className="text-xs text-n-8">Next</span>
            <span className="font-medium">{next.title}</span>
          </Link>
        )}
      </div>
    </nav>
  );
}

function DocsToc() {
  const { pathname } = useLocation();
  const [items, setItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const headings = Array.from(document.querySelectorAll<HTMLHeadingElement>('main h2[id], main h3[id]'));
    const nextItems = headings.map((heading) => ({
      id: heading.id,
      text: heading.textContent ?? heading.id,
      level: Number(heading.tagName.slice(1)) as 2 | 3,
    }));
    setItems(nextItems);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting);
        if (visible) setActiveId(visible.target.id);
      },
      { rootMargin: '0% 0% -80% 0%', threshold: 0 },
    );
    headings.forEach((heading) => observer.observe(heading));
    return () => observer.disconnect();
  }, [pathname]);

  const renderedItems = useMemo(() => items, [items]);

  return (
    <aside className="hidden lg:block">
      <nav aria-label="On this page" className="sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto py-10 pr-8">
        {renderedItems.length > 0 && (
          <>
            <p className="mb-2 text-sm font-medium text-slate-12">On This Page</p>
            <ul>
              {renderedItems.map((item) => (
                <li key={item.id} className={item.level === 3 ? 'pl-4' : undefined}>
                  <a
                    href={`#${item.id}`}
                    className={cn(
                      'inline-block py-1 text-sm transition-colors hover:text-slate-12',
                      activeId === item.id ? 'font-medium text-slate-12' : 'text-n-8',
                    )}
                  >
                    {item.text}
                  </a>
                </li>
              ))}
            </ul>
          </>
        )}
      </nav>
    </aside>
  );
}

export function withDocsLayout(Component: ComponentType, meta: DocsPageMeta, markdown: string) {
  return (
    <DocsLayout meta={meta} markdown={markdown}>
      <Component />
    </DocsLayout>
  );
}
