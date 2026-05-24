import { useCallback, useState } from 'react';
import { Check, Copy, ExternalLink, Search } from '@/lib/icons/central';
import { useDirection } from '@/lib/direction';
import { findGroupForId, NAV } from './navConfig';
import { COMPONENTS_JSON_SNIPPET, REGISTRY_HOMEPAGE } from './registryMeta';

interface StyleguideHeaderProps {
  activeItem: string;
  onSearchOpen: () => void;
}

export function StyleguideHeader({
  activeItem,
  onSearchOpen,
}: StyleguideHeaderProps) {
  const group = findGroupForId(activeItem);
  const item = NAV.flatMap((g) => g.items).find((i) => i.id === activeItem);
  const { direction, setDirection } = useDirection();

  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent);
  const [configCopied, setConfigCopied] = useState(false);

  const handleCopyConfig = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(COMPONENTS_JSON_SNIPPET);
      setConfigCopied(true);
      window.setTimeout(() => setConfigCopied(false), 1800);
    } catch {
      setConfigCopied(false);
    }
  }, []);

  const headerActionClass =
    'inline-flex min-h-10 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] text-n-8 transition-[color,background-color,transform] duration-150 ease-out hover:bg-state-hover hover:text-n-10 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-[2px] focus-visible:ring-border-strong motion-reduce:transition-none motion-reduce:active:scale-100';

  return (
    <header className="sticky top-0 z-10 flex items-center h-14 px-8 bg-surface-2/90 shadow-[var(--shadow-2)] backdrop-blur-sm">
      <nav className="flex items-center gap-1.5 text-[14px] min-w-0 flex-1">
        {group && (
          <>
            <span className="text-n-8 shrink-0">{group.label}</span>
            <span className="text-n-7 shrink-0">/</span>
          </>
        )}
        {item && (
          <span className="text-n-11 font-medium truncate">{item.label}</span>
        )}
      </nav>

      <div className="flex items-center gap-2 shrink-0">
        {/*
          Direction switcher — segmented control wired to the global
          DirectionProvider. The choice persists to localStorage and
          mirrors onto `<html dir>` + `<html lang>` immediately, so the
          rest of the styleguide (and every preview frame inside it)
          re-renders in the new direction without a reload.
          A long-term home for this control is the user-settings panel;
          the styleguide header is the natural temporary location while
          we audit the visual diff between RTL and LTR.
        */}
        <div
          role="group"
          aria-label="Writing direction"
          className="flex items-stretch rounded-md border border-border-default bg-state-hover p-0.5 text-[12px]"
        >
          <button
            type="button"
            onClick={() => setDirection('rtl')}
            aria-pressed={direction === 'rtl'}
            title="Switch to Right-to-Left (Hebrew)"
            className={`px-2 py-1 rounded-sm transition-[color,background-color] duration-150 ease-out focus-visible:outline-none focus-visible:ring-[2px] focus-visible:ring-border-strong ${
              direction === 'rtl'
                ? 'bg-state-hover-strong text-n-11'
                : 'text-n-8 hover:text-n-10 hover:bg-state-hover'
            }`}
          >
            עב
          </button>
          <button
            type="button"
            onClick={() => setDirection('ltr')}
            aria-pressed={direction === 'ltr'}
            title="Switch to Left-to-Right (English)"
            className={`px-2 py-1 rounded-sm transition-[color,background-color] duration-150 ease-out focus-visible:outline-none focus-visible:ring-[2px] focus-visible:ring-border-strong ${
              direction === 'ltr'
                ? 'bg-state-hover-strong text-n-11'
                : 'text-n-8 hover:text-n-10 hover:bg-state-hover'
            }`}
          >
            EN
          </button>
        </div>

        <button
          type="button"
          onClick={onSearchOpen}
          className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border-default bg-state-hover px-3 py-1.5 text-[13px] text-n-8 transition-[border-color,background-color,transform] duration-150 ease-out hover:border-border-strong active:scale-[0.97] focus-visible:outline-none focus-visible:ring-[2px] focus-visible:ring-border-strong motion-reduce:active:scale-100"
        >
          <Search size={14} />
          <kbd className="text-[11px] font-mono text-n-7 bg-state-hover-strong rounded px-1.5 py-0.5 tabular-nums">
            {isMac ? '⌘' : 'Ctrl'} K
          </kbd>
        </button>

        <button
          type="button"
          onClick={handleCopyConfig}
          aria-label={configCopied ? 'components.json copied' : 'Copy components.json snippet'}
          className={headerActionClass}
        >
          {configCopied ? <Check size={13} className="text-accent-success" /> : <Copy size={13} />}
          <span>{configCopied ? 'Copied' : 'components.json'}</span>
        </button>

        <a
          href={`${REGISTRY_HOMEPAGE}/r/registry.json`}
          target="_blank"
          rel="noreferrer"
          className={headerActionClass}
        >
          <span>Registry</span>
          <ExternalLink size={13} />
        </a>

        <a href="/" className={headerActionClass}>
          <span>App</span>
          <ExternalLink size={13} />
        </a>
      </div>
    </header>
  );
}
