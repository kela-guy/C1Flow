import { isValidElement, type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Copy } from '@/lib/icons/central';
import { cn } from '@/app/components/ui/utils';

const packageManagers = ['pnpm', 'npm', 'yarn', 'bun'] as const;
type PackageManager = (typeof packageManagers)[number];

function textFromNode(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textFromNode).join('');
  if (isValidElement<{ children?: ReactNode }>(node)) return textFromNode(node.props.children);
  return '';
}

export function CopyButton({
  text,
  className,
  label = 'Copy',
}: {
  text: string;
  className?: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? 'Copied' : label}
      className={cn(
        'inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-n-9 transition-colors hover:bg-state-hover hover:text-slate-12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-strong',
        className,
      )}
    >
      {copied ? <Check size={14} className="text-accent-success" /> : <Copy size={14} />}
      <span>{copied ? 'Copied' : label}</span>
    </button>
  );
}

export function CodeBlock({ children }: { children: ReactNode }) {
  const code = useMemo(() => textFromNode(children), [children]);

  return (
    <figure className="relative my-6 overflow-hidden rounded-lg border border-border-default bg-surface-3">
      <div className="overflow-x-auto p-4 text-sm leading-relaxed">
        {children}
      </div>
      <CopyButton text={code} label="Copy code" className="absolute right-2 top-2 bg-surface-3/90" />
    </figure>
  );
}

function commandForPackageManager(command: string, pm: PackageManager) {
  if (pm === 'pnpm') return command;
  if (command.startsWith('pnpm dlx ')) {
    const rest = command.slice('pnpm dlx '.length);
    if (pm === 'npm') return `npx ${rest}`;
    if (pm === 'yarn') return `yarn dlx ${rest}`;
    return `bunx ${rest}`;
  }
  if (command.startsWith('pnpm add -D ')) {
    const rest = command.slice('pnpm add -D '.length);
    if (pm === 'npm') return `npm install -D ${rest}`;
    if (pm === 'yarn') return `yarn add -D ${rest}`;
    return `bun add -d ${rest}`;
  }
  if (command.startsWith('pnpm add ')) {
    const rest = command.slice('pnpm add '.length);
    if (pm === 'npm') return `npm install ${rest}`;
    if (pm === 'yarn') return `yarn add ${rest}`;
    return `bun add ${rest}`;
  }
  return command;
}

function readPackageManager(): PackageManager {
  if (typeof window === 'undefined') return 'pnpm';
  const stored = window.localStorage.getItem('preferredPM');
  return packageManagers.includes(stored as PackageManager) ? (stored as PackageManager) : 'pnpm';
}

function usePackageManager() {
  const [pm, setPmState] = useState<PackageManager>(readPackageManager);

  useEffect(() => {
    const onChange = (event: Event) => {
      setPmState((event as CustomEvent<PackageManager>).detail);
    };
    window.addEventListener('c2-docs-pm-change', onChange);
    return () => window.removeEventListener('c2-docs-pm-change', onChange);
  }, []);

  const setPm = useCallback((next: PackageManager) => {
    window.localStorage.setItem('preferredPM', next);
    setPmState(next);
    window.dispatchEvent(new CustomEvent('c2-docs-pm-change', { detail: next }));
  }, []);

  return [pm, setPm] as const;
}

export function PMCodeBlock({ command }: { command: string }) {
  const [pm, setPm] = usePackageManager();
  const rendered = commandForPackageManager(command, pm);

  return (
    <figure className="relative my-6 overflow-hidden rounded-lg border border-border-default bg-surface-3">
      <div role="tablist" aria-label="Package manager" className="flex border-b border-border-default px-2">
        {packageManagers.map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={pm === item}
            onClick={() => setPm(item)}
            className={cn(
              'relative px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-strong',
              pm === item
                ? 'text-slate-12 after:absolute after:inset-x-3 after:bottom-[-1px] after:h-px after:bg-slate-12'
                : 'text-n-8 hover:text-n-11',
            )}
          >
            {item}
          </button>
        ))}
      </div>
      <pre className="overflow-x-auto px-4 py-3 font-mono text-sm text-slate-12">{rendered}</pre>
      <CopyButton text={rendered} label="Copy" className="absolute right-2 top-10 bg-surface-3/90" />
    </figure>
  );
}

export function Callout({ children }: { children: ReactNode }) {
  return (
    <div className="my-6 rounded-lg border border-border-default bg-state-hover px-4 py-3 text-sm leading-6 text-slate-11">
      {children}
    </div>
  );
}

export function PickerGrid({ children }: { children: ReactNode }) {
  return <div className="my-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}

export function PickerCard({
  href,
  title,
  children,
}: {
  href: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      className="flex flex-col gap-1 rounded-lg border border-border-default p-4 text-left transition-colors hover:border-border-strong hover:bg-state-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-strong"
    >
      <span className="text-sm font-semibold text-slate-12">{title}</span>
      <span className="text-sm leading-6 text-n-9">{children}</span>
    </a>
  );
}

export function ApiTable({
  rows,
}: {
  rows: Array<{ prop: string; type: string; defaultValue: string }>;
}) {
  return (
    <div className="my-6 w-full overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            {['Prop', 'Type', 'Default'].map((header) => (
              <th key={header} scope="col" className="border border-border-default px-4 py-2 text-left font-semibold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.prop} className="even:bg-state-hover">
              <td className="border border-border-default px-4 py-2">
                <code className="font-mono text-xs">{row.prop}</code>
              </td>
              <td className="border border-border-default px-4 py-2">
                <code className="font-mono text-xs">{row.type}</code>
              </td>
              <td className="border border-border-default px-4 py-2">
                <code className="font-mono text-xs">{row.defaultValue}</code>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const mdxComponents = {
  h2: (props: React.ComponentProps<'h2'>) => (
    <h2
      className="mt-12 scroll-m-20 border-b border-border-default pb-2 text-2xl font-semibold tracking-tight first:mt-0"
      {...props}
    />
  ),
  h3: (props: React.ComponentProps<'h3'>) => (
    <h3 className="mt-8 scroll-m-20 text-xl font-semibold tracking-tight" {...props} />
  ),
  p: (props: React.ComponentProps<'p'>) => <p className="leading-7 text-slate-10 [&:not(:first-child)]:mt-6" {...props} />,
  a: (props: React.ComponentProps<'a'>) => (
    <a className="font-medium text-slate-12 underline underline-offset-4 hover:text-n-9" {...props} />
  ),
  ul: (props: React.ComponentProps<'ul'>) => <ul className="my-6 ml-6 list-disc text-slate-10 [&>li]:mt-2" {...props} />,
  ol: (props: React.ComponentProps<'ol'>) => <ol className="my-6 ml-6 list-decimal text-slate-10 [&>li]:mt-2" {...props} />,
  blockquote: (props: React.ComponentProps<'blockquote'>) => <blockquote className="mt-6 border-l-2 border-border-default pl-6 italic text-n-9" {...props} />,
  code: (props: React.ComponentProps<'code'>) => <code className="rounded bg-state-hover px-1.5 py-0.5 font-mono text-sm font-semibold text-slate-12" {...props} />,
  pre: CodeBlock,
  table: (props: React.ComponentProps<'table'>) => (
    <div className="my-6 w-full overflow-x-auto">
      <table className="w-full text-sm" {...props} />
    </div>
  ),
  th: (props: React.ComponentProps<'th'>) => <th className="border border-border-default px-4 py-2 text-left font-semibold" {...props} />,
  td: (props: React.ComponentProps<'td'>) => <td className="border border-border-default px-4 py-2 text-left" {...props} />,
  Callout,
  PickerGrid,
  PickerCard,
  PMCodeBlock,
  ApiTable,
};
