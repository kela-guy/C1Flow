import { DirIsland } from '@/lib/direction';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/shared/components/ui/tooltip';

type LinkStatus = 'online' | 'degraded' | 'offline';

interface SourceDevice {
  id: string;
  short: string;
  name: string;
  role: string;
  signalPct: number;
  status: LinkStatus;
}

const MOCK_SOURCES: SourceDevice[] = [
  { id: 'RDR-04', short: 'RDR', name: 'RDR-04', role: 'Radar', signalPct: 92, status: 'online' },
  { id: 'LDR-02', short: 'LDR', name: 'LDR-02', role: 'Lidar', signalPct: 78, status: 'degraded' },
  { id: 'DRN-01', short: 'DRN', name: 'DRN-01', role: 'Drone', signalPct: 88, status: 'online' },
];

const STATUS_DOT: Record<LinkStatus, string> = {
  online: 'bg-accent-success',
  degraded: 'bg-accent-warning',
  offline: 'bg-accent-danger',
};

const STATUS_RING: Record<LinkStatus, string> = {
  online: 'ring-accent-success/35',
  degraded: 'ring-accent-warning/35',
  offline: 'ring-accent-danger/35',
};

const STATUS_LABEL: Record<LinkStatus, string> = {
  online: 'Online',
  degraded: 'Degraded',
  offline: 'Offline',
};

export interface DeviceConnectivityBadgeProps {
  sources?: SourceDevice[];
  className?: string;
}

export function DeviceConnectivityBadge({
  sources = MOCK_SOURCES,
  className,
}: DeviceConnectivityBadgeProps) {
  const worst = worstStatus(sources);

  return (
    <div
      className={`pointer-events-none absolute right-3 top-3 z-30 ${className ?? ''}`}
    >
      <DirIsland direction="ltr">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={`Connectivity: ${STATUS_LABEL[worst]}, ${sources.length} sources`}
              className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-surface-1/75 px-2 py-1 ring-1 ring-inset ring-border-default backdrop-blur-sm transition-colors duration-150 hover:bg-surface-1/90 focus-visible:outline-none focus-visible:ring-border-strong"
            >
              {sources.map((s) => (
                <SourceChip key={s.id} source={s} />
              ))}
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" align="end" sideOffset={8} className="p-0">
            <div className="flex w-[200px] flex-col gap-1.5 p-2">
              <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-slate-9">
                Sources
              </div>
              {sources.map((s) => (
                <SourceRow key={s.id} source={s} />
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      </DirIsland>
    </div>
  );
}

function SourceChip({ source }: { source: SourceDevice }) {
  return (
    <span
      className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.12em] text-slate-12"
      aria-hidden
    >
      <span
        className={`size-1.5 rounded-full ring-2 ${STATUS_DOT[source.status]} ${STATUS_RING[source.status]}`}
      />
      <span>{source.short}</span>
    </span>
  );
}

function SourceRow({ source }: { source: SourceDevice }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-sm px-1.5 py-1 ring-1 ring-inset ring-border-subtle">
      <div className="flex items-center gap-2">
        <span className={`size-2 rounded-full ${STATUS_DOT[source.status]}`} />
        <div className="flex flex-col">
          <span className="font-mono text-[11px] leading-none text-slate-12">{source.name}</span>
          <span className="mt-0.5 text-[9px] leading-none text-slate-10">{source.role}</span>
        </div>
      </div>
      <span className="font-mono text-[11px] tabular-nums text-slate-11">
        {source.signalPct}%
      </span>
    </div>
  );
}

function worstStatus(sources: SourceDevice[]): LinkStatus {
  if (sources.some((s) => s.status === 'offline')) return 'offline';
  if (sources.some((s) => s.status === 'degraded')) return 'degraded';
  return 'online';
}
