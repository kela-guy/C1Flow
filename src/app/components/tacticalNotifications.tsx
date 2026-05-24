import React from "react";
import { toast } from "sonner";
import { X } from "@/lib/icons/central";
import { formatTime, useStrings } from "@/lib/intl";
import { accentHex, slateHex } from "@/primitives/accentHex";
import type { NotificationData, ThreatLevel } from "./notificationData";

const LEVEL_ACCENT: Record<ThreatLevel, string> = {
  critical: accentHex('danger'),
  high: accentHex('tracking'),
  suspect: accentHex('warning'),
  medium: accentHex('warning'),
  info: slateHex(9),
  success: accentHex('success'),
};

const BATCH_WINDOW_MS = 15_000;
const STABLE_TOAST_ID = 'tactical-batch';

type BatchItem = Omit<NotificationData, "id"> & { timestamp: string };

let pendingBatch: BatchItem[] = [];
let batchTimerId: ReturnType<typeof setTimeout> | null = null;
const batchListeners: Set<() => void> = new Set();

function subscribeBatch(cb: () => void) {
  batchListeners.add(cb);
  return () => { batchListeners.delete(cb); };
}

function notifyBatchListeners() {
  batchListeners.forEach(cb => cb());
}

function useBatchItems(): BatchItem[] {
  const [, setTick] = React.useState(0);
  React.useEffect(() => subscribeBatch(() => setTick(t => t + 1)), []);
  return pendingBatch;
}

function LiveBatchedToast({ toastId }: { toastId: string }) {
  const items = useBatchItems();
  const [expanded, setExpanded] = React.useState(false);
  const t = useStrings();
  const nt = t.notifications;

  if (items.length === 0) return null;

  if (items.length === 1) {
    const data = items[0];
    return (
      <div
        className="relative w-[356px] rounded-lg bg-surface-3 shadow-[0_0_0_1px_var(--border-default),0_8px_30px_rgba(0,0,0,0.5)] overflow-hidden cursor-pointer group"
        onClick={() => window.dispatchEvent(new CustomEvent('toast-clicked', { detail: data }))}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); window.dispatchEvent(new CustomEvent('toast-clicked', { detail: data })); } }}
        role="button"
        tabIndex={0}
      >
        <div className="py-3 px-3 flex gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[13px] font-medium text-slate-12 truncate">{data.title}</span>
              <button
                onClick={(e) => { e.stopPropagation(); toast.dismiss(toastId); flushBatch(); }}
                className="text-slate-8 hover:text-slate-10 transition-[color,opacity] duration-150 shrink-0 opacity-0 group-hover:opacity-100 p-1 -m-1"
                aria-label={nt.stackCloseAriaLabel}
              >
                <X size={14} />
              </button>
            </div>
            <p className="text-[12px] text-slate-10 leading-relaxed mt-0.5 line-clamp-2">{data.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-[356px] rounded-lg bg-surface-3 overflow-hidden">
      <div className="py-3 px-3">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-medium text-slate-12">
            {nt.stackNewCount(items.length)}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={(e) => { e.stopPropagation(); setExpanded(prev => !prev); }}
              className="text-[10px] text-slate-9 hover:text-slate-11 transition-colors px-2 py-1.5 rounded hover:bg-state-hover"
              aria-expanded={expanded}
            >
              {expanded ? nt.stackCollapse : nt.stackExpand}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); toast.dismiss(toastId); flushBatch(); }}
              className="text-slate-8 hover:text-slate-10 transition-colors p-1 -m-1"
              aria-label={nt.stackCloseAriaLabel}
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {!expanded && (
          <p className="text-[12px] text-slate-10 mt-1 truncate">
            {items[items.length - 1]?.title}
            {items.length > 1 && nt.stackAndMore(items.length - 1)}
          </p>
        )}

        {expanded && (
          <div className="mt-2 flex flex-col gap-px max-h-[260px] overflow-y-auto">
            {items.map((item) => {
              const itemAccent = LEVEL_ACCENT[item.level] ?? LEVEL_ACCENT.info;
              return (
                <div
                  key={`${item.code ?? item.title}-${item.timestamp}`}
                  className="flex items-start gap-2.5 px-2 py-2 rounded-md hover:bg-state-hover transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-[1px] focus-visible:ring-border-strong"
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (item.code) window.dispatchEvent(new CustomEvent('toast-clicked', { detail: item }));
                  }}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && item.code) {
                      e.preventDefault();
                      e.stopPropagation();
                      window.dispatchEvent(new CustomEvent('toast-clicked', { detail: item }));
                    }
                  }}
                >
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: itemAccent }} />
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-medium text-slate-11 truncate block">{item.title}</span>
                    <span className="text-[10px] text-slate-9 truncate block">{item.message}</span>
                  </div>
                  <span className="text-[9px] font-mono text-slate-8 shrink-0 mt-0.5">{item.timestamp}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function flushBatch() {
  if (batchTimerId) {
    clearTimeout(batchTimerId);
    batchTimerId = null;
  }
  pendingBatch = [];
  notifyBatchListeners();
}

function ensureToastExists() {
  toast.custom(() => <LiveBatchedToast toastId={STABLE_TOAST_ID} />, {
    id: STABLE_TOAST_ID,
    duration: Infinity,
  });
}

export function showTacticalNotification(data: Omit<NotificationData, "id">) {
  if (data.level === 'critical') {
    window.dispatchEvent(new Event('trigger-critical-alert'));
  } else if (data.level === 'suspect') {
    window.dispatchEvent(new Event('trigger-suspect-alert'));
  }

  const locale = document.documentElement.getAttribute('lang') === 'en' ? 'en' : 'he';
  const ts = formatTime(new Date(), locale);
  pendingBatch.push({ ...data, timestamp: ts });

  ensureToastExists();
  notifyBatchListeners();

  if (batchTimerId) clearTimeout(batchTimerId);
  batchTimerId = setTimeout(() => {
    toast.dismiss(STABLE_TOAST_ID);
    flushBatch();
  }, BATCH_WINDOW_MS);
}
