import { useCallback, useState } from 'react';
import { DirIsland } from '@/lib/direction';
import { Slider } from '@/app/components/ui/slider';

const ALT_MIN = 80;
const ALT_MAX = 200;
const SPD_MIN = 0;
const SPD_MAX = 20;

const IDLE_WIDTH = 'w-[72px]';
const EXPANDED_WIDTH = 'w-[208px]';
const EXPANDED_CHROME =
  'rounded-md bg-black/45 px-3 py-3 backdrop-blur-sm ring-1 ring-inset ring-border-default';

const TRACK_PX = 96;
const THUMB_PX = 24;
const THUMB_INSET_PX = THUMB_PX / 2;

const VERTICAL_SLIDER =
  'h-full min-h-0 w-9 shrink-0 [&_[data-slot=slider-range]]:bg-slate-12/25 [&_[data-slot=slider-thumb]]:size-6 [&_[data-slot=slider-thumb]]:border-2 [&_[data-slot=slider-thumb]]:border-border-default [&_[data-slot=slider-thumb]]:bg-slate-12 [&_[data-slot=slider-thumb]]:shadow-none [&_[data-slot=slider-track]]:h-full [&_[data-slot=slider-track]]:min-h-0 [&_[data-slot=slider-track]]:w-1 [&_[data-slot=slider-track]]:bg-state-hover-strong';

const REVEAL_OPEN = '[clip-path:inset(0_0_0_0)]';
const REVEAL_CLOSED = '[clip-path:inset(0_100%_0_0)]';

export interface SandboxSetpointRailProps {
  altitudeM: number;
  velocityMps: number;
  targetAltitudeM: number;
  targetVelocityMps: number;
  disabled: boolean;
  onTargetAltitudeChange: (next: number) => void;
  onTargetVelocityChange: (next: number) => void;
}

export function SandboxSetpointRail({
  altitudeM,
  velocityMps,
  targetAltitudeM,
  targetVelocityMps,
  disabled,
  onTargetAltitudeChange,
  onTargetVelocityChange,
}: SandboxSetpointRailProps) {
  const [hovered, setHovered] = useState(false);
  const [scrubbing, setScrubbing] = useState(false);
  const expanded = !disabled && (hovered || scrubbing);

  const altPending = Math.round(targetAltitudeM) !== Math.round(altitudeM);
  const spdPending = Math.abs(targetVelocityMps - velocityMps) > 0.05;

  const handleScrubStart = useCallback(() => setScrubbing(true), []);
  const handleScrubEnd = useCallback(() => setScrubbing(false), []);

  return (
    <div
      className={`absolute z-20 left-3 top-1/2 -translate-y-1/2 transition-opacity duration-150
        ${disabled ? 'opacity-45 pointer-events-none' : 'pointer-events-auto'}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        if (!scrubbing) setHovered(false);
      }}
    >
      <DirIsland direction="ltr">
        <div className="relative">
          <div
            className={`flex flex-col gap-1.5 transition-opacity duration-150 ease-out motion-reduce:transition-none
              ${expanded ? 'pointer-events-none absolute start-0 top-0 opacity-0' : 'opacity-100'}`}
            aria-hidden={expanded}
          >
            <IdleRow
              label="ALT"
              current={`${Math.round(altitudeM)}m`}
              pending={altPending ? `${Math.round(targetAltitudeM)}` : undefined}
              pendingClass="text-accent-warning"
            />
            <IdleRow
              label="SPD"
              current={velocityMps.toFixed(1)}
              pending={spdPending ? targetVelocityMps.toFixed(1) : undefined}
              pendingClass="text-accent-info"
            />
          </div>

          <div
            className={`${EXPANDED_WIDTH} ${EXPANDED_CHROME} flex gap-3 transition-[clip-path,opacity] duration-200 ease-out motion-reduce:transition-none
              ${expanded
                ? `relative ${REVEAL_OPEN} opacity-100`
                : `pointer-events-none absolute start-0 top-0 ${REVEAL_CLOSED} opacity-0`}`}
            aria-hidden={!expanded}
          >
            <ScrubColumn
              label="ALT"
              current={altitudeM}
              target={targetAltitudeM}
              min={ALT_MIN}
              max={ALT_MAX}
              step={1}
              unit="m"
              format={(v) => `${Math.round(v)}`}
              onChange={onTargetAltitudeChange}
              onScrubStart={handleScrubStart}
              onScrubEnd={handleScrubEnd}
            />
            <ScrubColumn
              label="SPD"
              current={velocityMps}
              target={targetVelocityMps}
              min={SPD_MIN}
              max={SPD_MAX}
              step={0.5}
              unit=""
              format={(v) => v.toFixed(1)}
              onChange={onTargetVelocityChange}
              onScrubStart={handleScrubStart}
              onScrubEnd={handleScrubEnd}
            />
          </div>
        </div>
      </DirIsland>
    </div>
  );
}

function IdleRow({
  label,
  current,
  pending,
  pendingClass,
}: {
  label: string;
  current: string;
  pending?: string;
  pendingClass: string;
}) {
  return (
    <div className={`flex ${IDLE_WIDTH} items-stretch gap-2`}>
      <span className="mt-0.5 w-px shrink-0 bg-slate-12/25" aria-hidden />
      <div>
        <div className="text-[8px] font-medium uppercase tracking-[0.12em] text-slate-9">{label}</div>
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-sm tabular-nums text-slate-12">{current}</span>
          {pending != null && (
            <span className={`font-mono text-[10px] tabular-nums ${pendingClass}`}>→{pending}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function ScrubColumn({
  label,
  current,
  target,
  min,
  max,
  step,
  unit,
  format,
  onChange,
  onScrubStart,
  onScrubEnd,
}: {
  label: string;
  current: number;
  target: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  format: (v: number) => string;
  onChange: (next: number) => void;
  onScrubStart: () => void;
  onScrubEnd: () => void;
}) {
  const livePct = ((current - min) / (max - min)) * 100;
  const travelPx = TRACK_PX - THUMB_PX;
  const liveBottomPx = THUMB_INSET_PX + (livePct / 100) * travelPx;
  const targetText = unit ? `${format(target)}${unit}` : format(target);
  const liveText = unit ? `${format(current)}${unit}` : format(current);
  const pending = unit
    ? Math.round(target) !== Math.round(current)
    : Math.abs(target - current) > 0.05;

  return (
    <div className="flex min-w-0 flex-1 flex-col items-stretch gap-2">
      <div className="min-w-0">
        <div className="text-[8px] font-medium uppercase tracking-[0.12em] text-slate-9">{label}</div>
        <div className="truncate font-mono text-[11px] tabular-nums leading-tight text-slate-12">
          {targetText}
        </div>
      </div>

      <div
        className="relative mx-auto w-9 shrink-0 overflow-hidden"
        style={{ height: TRACK_PX }}
      >
        <div
          className="pointer-events-none absolute start-1/2 z-0 h-px w-4 -translate-x-1/2 bg-slate-12/40"
          style={{ bottom: liveBottomPx }}
          aria-hidden
        />
        <Slider
          orientation="vertical"
          min={min}
          max={max}
          step={step}
          value={[target]}
          onValueChange={([v]) => onChange(v)}
          onPointerDown={onScrubStart}
          onPointerUp={onScrubEnd}
          onPointerCancel={onScrubEnd}
          aria-label={`${label} setpoint`}
          className={VERTICAL_SLIDER}
        />
      </div>

      <div className="min-h-[14px]">
        {pending && (
          <span className="block truncate text-center font-mono text-[10px] tabular-nums text-slate-9">
            Live {liveText}
          </span>
        )}
      </div>
    </div>
  );
}
