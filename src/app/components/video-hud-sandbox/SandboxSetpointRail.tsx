import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';
import { DirIsland } from '@/lib/direction';
import { Slider } from '@/app/components/ui/slider';
import { useHoldRepeat, type HoldRepeatMultiplier } from './useHoldRepeat';

const ALT_MIN = 80;
const ALT_MAX = 200;
const SPD_MIN = 0;
const SPD_MAX = 20;

const IDLE_WIDTH = 'w-[64px]';
const LANE_WIDTH = 'w-[64px]';
const RAIL_MIN_W = 'min-w-[168px]';
const RAIL_MIN_H = 'min-h-[320px]';

const TRACK_PX = 256;
const THUMB_PX = 12;
const THUMB_PX_BOLD = 14;
const LIVE_DOT_PX = 4;
const LIVE_DOT_PX_BOLD = 6;

// Inline color exception: legibility drop-shadows over variable video frames.
// Per .cursor/rules/no-inline-hex-colors.mdc, rgba(0,0,0,_) overlays that
// darken the substrate are an allowed exception. No CSS var exists for
// text drop-shadows.
const TEXT_SHADOW = '[text-shadow:0_1px_2px_rgba(0,0,0,0.6)]';
const TEXT_SHADOW_STRONG =
  '[text-shadow:0_1px_3px_rgba(0,0,0,0.85),0_0_8px_rgba(0,0,0,0.45)]';
const DOT_HALO_SHADOW = 'shadow-[0_0_0_2px_rgba(0,0,0,0.55)]';

const REVEAL_TRANSITION =
  'transition-[opacity,clip-path,transform] duration-200 ease-out motion-reduce:transition-none';

const SETPOINT_LABELS = {
  ALT: { short: 'ALT', long: 'Altitude' },
  SPD: { short: 'SPD', long: 'Speed' },
} as const;

export type RailDesign =
  | 'shell'
  | 'glass-pills'
  | 'high-contrast'
  | 'tube-chips'
  | 'gutter';

export const RAIL_DESIGN_OPTIONS: { id: RailDesign; label: string }[] = [
  { id: 'shell', label: 'A · Shell' },
  { id: 'glass-pills', label: 'B · Glass pills' },
  { id: 'high-contrast', label: 'C · High contrast' },
  { id: 'tube-chips', label: 'D · Tube + chips' },
  { id: 'gutter', label: 'E · Gutter' },
];

const SLIDER_HAIRLINE =
  'h-full min-h-0 w-7 shrink-0 [&_[data-slot=slider-range]]:bg-slate-12/25 [&_[data-slot=slider-thumb]]:size-3 [&_[data-slot=slider-thumb]]:border [&_[data-slot=slider-thumb]]:border-border-default [&_[data-slot=slider-thumb]]:bg-slate-12 [&_[data-slot=slider-thumb]]:shadow-none [&_[data-slot=slider-thumb]]:focus-visible:ring-2 [&_[data-slot=slider-thumb]]:focus-visible:ring-border-strong [&_[data-slot=slider-track]]:h-full [&_[data-slot=slider-track]]:min-h-0 [&_[data-slot=slider-track]]:w-px [&_[data-slot=slider-track]]:bg-state-hover-strong';

const SLIDER_GLASS =
  'h-full min-h-0 w-7 shrink-0 [&_[data-slot=slider-range]]:bg-slate-12/25 [&_[data-slot=slider-thumb]]:size-3 [&_[data-slot=slider-thumb]]:border [&_[data-slot=slider-thumb]]:border-border-default [&_[data-slot=slider-thumb]]:bg-slate-12 [&_[data-slot=slider-thumb]]:shadow-[0_1px_3px_rgba(0,0,0,0.5)] [&_[data-slot=slider-thumb]]:focus-visible:ring-2 [&_[data-slot=slider-thumb]]:focus-visible:ring-border-strong [&_[data-slot=slider-track]]:h-full [&_[data-slot=slider-track]]:min-h-0 [&_[data-slot=slider-track]]:w-px [&_[data-slot=slider-track]]:bg-slate-12/35';

const SLIDER_BOLD =
  'h-full min-h-0 w-7 shrink-0 [&_[data-slot=slider-range]]:bg-accent-info [&_[data-slot=slider-thumb]]:size-3.5 [&_[data-slot=slider-thumb]]:border-2 [&_[data-slot=slider-thumb]]:border-surface-1 [&_[data-slot=slider-thumb]]:bg-slate-12 [&_[data-slot=slider-thumb]]:shadow-[0_0_0_1px_rgba(0,0,0,0.5)] [&_[data-slot=slider-thumb]]:focus-visible:ring-2 [&_[data-slot=slider-thumb]]:focus-visible:ring-border-strong [&_[data-slot=slider-track]]:h-full [&_[data-slot=slider-track]]:min-h-0 [&_[data-slot=slider-track]]:w-0.5 [&_[data-slot=slider-track]]:bg-slate-12/55';

const SLIDER_TUBE =
  'h-full min-h-0 w-7 shrink-0 [&_[data-slot=slider-range]]:bg-accent-info [&_[data-slot=slider-thumb]]:size-3 [&_[data-slot=slider-thumb]]:border [&_[data-slot=slider-thumb]]:border-border-default [&_[data-slot=slider-thumb]]:bg-slate-12 [&_[data-slot=slider-thumb]]:shadow-[0_1px_2px_rgba(0,0,0,0.5)] [&_[data-slot=slider-thumb]]:focus-visible:ring-2 [&_[data-slot=slider-thumb]]:focus-visible:ring-border-strong [&_[data-slot=slider-track]]:h-full [&_[data-slot=slider-track]]:min-h-0 [&_[data-slot=slider-track]]:w-1.5 [&_[data-slot=slider-track]]:rounded-full [&_[data-slot=slider-track]]:bg-surface-1/45 [&_[data-slot=slider-track]]:ring-1 [&_[data-slot=slider-track]]:ring-inset [&_[data-slot=slider-track]]:ring-border-default';

interface DesignTokens {
  lane: string;
  label: string;
  chevron: string;
  valueButton: string;
  valueInput: string;
  chip: string;
  slider: string;
  liveDot: 'side-dot' | 'side-dot-bold' | 'tube-tick';
  liveDotClass: string;
  groupGap: string;
}

const DESIGN_TOKENS: Record<RailDesign, DesignTokens> = {
  shell: {
    lane: 'rounded-md bg-surface-2/85 backdrop-blur-md px-2 py-2 ring-1 ring-inset ring-border-default',
    label: 'text-[10px] font-medium leading-none text-slate-9',
    chevron:
      'text-slate-11 hover:bg-state-hover hover:text-slate-12 rounded-sm',
    valueButton: 'text-slate-12',
    valueInput: 'text-slate-12 ring-1 ring-border-strong',
    chip: 'text-slate-10 hover:text-slate-12 rounded-sm',
    slider: SLIDER_HAIRLINE,
    liveDot: 'side-dot',
    liveDotClass: 'bg-slate-12/65',
    groupGap: 'gap-2',
  },
  'glass-pills': {
    lane: '',
    label: `text-[10px] font-medium leading-none text-slate-9 ${TEXT_SHADOW}`,
    chevron: `bg-surface-1/55 backdrop-blur-md ring-1 ring-inset ring-border-default text-slate-11 hover:bg-surface-1/70 hover:text-slate-12`,
    valueButton: `bg-surface-1/55 backdrop-blur-md ring-1 ring-inset ring-border-default px-2 py-0.5 text-slate-12`,
    valueInput: `bg-surface-1/85 backdrop-blur-md px-2 py-0.5 text-slate-12 ring-1 ring-border-strong`,
    chip: `bg-surface-1/55 backdrop-blur-md ring-1 ring-inset ring-border-default px-1.5 py-0.5 text-slate-10 hover:text-slate-12`,
    slider: SLIDER_GLASS,
    liveDot: 'side-dot',
    liveDotClass: 'bg-slate-12/85',
    groupGap: 'gap-3',
  },
  'high-contrast': {
    lane: '',
    label: `text-[10px] font-semibold leading-none text-slate-12 ${TEXT_SHADOW_STRONG}`,
    chevron: `rounded-sm text-slate-12 hover:bg-state-hover ${TEXT_SHADOW_STRONG}`,
    valueButton: `font-medium text-[15px] text-slate-12 ${TEXT_SHADOW_STRONG}`,
    valueInput: `font-medium text-[15px] text-slate-12 ring-1 ring-border-strong`,
    chip: `text-slate-12 rounded-sm ${TEXT_SHADOW_STRONG}`,
    slider: SLIDER_BOLD,
    liveDot: 'side-dot-bold',
    liveDotClass: `bg-slate-12 ${DOT_HALO_SHADOW}`,
    groupGap: 'gap-3',
  },
  'tube-chips': {
    lane: '',
    label: `text-[10px] font-medium leading-none text-slate-9 ${TEXT_SHADOW}`,
    chevron: `rounded-sm bg-surface-1/45 ring-1 ring-inset ring-border-default text-slate-11 hover:bg-surface-1/65 hover:text-slate-12`,
    valueButton: `rounded-sm bg-surface-1/55 ring-1 ring-inset ring-border-default px-1.5 py-0.5 text-[13px] text-slate-12`,
    valueInput: `rounded-sm bg-surface-1/85 px-1.5 py-0.5 text-[13px] text-slate-12 ring-1 ring-border-strong`,
    chip: `rounded-sm bg-surface-1/55 ring-1 ring-inset ring-border-default px-1.5 py-0.5 text-slate-10 hover:text-slate-12`,
    slider: SLIDER_TUBE,
    liveDot: 'tube-tick',
    liveDotClass: 'bg-slate-12/85',
    groupGap: 'gap-3',
  },
  gutter: {
    lane: '',
    label: 'text-[10px] font-medium leading-none text-slate-9',
    chevron:
      'text-slate-11 hover:bg-state-hover hover:text-slate-12 rounded-sm',
    valueButton: 'text-slate-12',
    valueInput: 'text-slate-12 ring-1 ring-border-strong',
    chip: 'text-slate-10 hover:text-slate-12 rounded-sm',
    slider: SLIDER_HAIRLINE,
    liveDot: 'side-dot',
    liveDotClass: 'bg-slate-12/65',
    groupGap: 'gap-3',
  },
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function snapToStep(value: number, step: number, min: number): number {
  const snapped = min + Math.round((value - min) / step) * step;
  const decimals = step < 1 ? Math.max(0, -Math.floor(Math.log10(step))) : 0;
  return decimals > 0 ? Number(snapped.toFixed(decimals)) : snapped;
}

export interface SandboxSetpointRailProps {
  altitudeM: number;
  velocityMps: number;
  batteryPct?: number;
  targetAltitudeM: number;
  targetVelocityMps: number;
  disabled: boolean;
  forceExpanded?: boolean;
  design?: RailDesign;
  onTargetAltitudeChange: (next: number) => void;
  onTargetVelocityChange: (next: number) => void;
}

export function SandboxSetpointRail({
  altitudeM,
  velocityMps,
  batteryPct,
  targetAltitudeM,
  targetVelocityMps,
  disabled,
  forceExpanded = false,
  design = 'shell',
  onTargetAltitudeChange,
  onTargetVelocityChange,
}: SandboxSetpointRailProps) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [scrubbing, setScrubbing] = useState(false);
  const expanded = !disabled && (forceExpanded || hovered || focused || scrubbing);
  const tokens = DESIGN_TOKENS[design];

  const handleScrubStart = useCallback(() => setScrubbing(true), []);
  const handleScrubEnd = useCallback(() => setScrubbing(false), []);

  const handleBlurCapture = useCallback(
    (e: FocusEvent<HTMLDivElement>) => {
      if (!scrubbing && !e.currentTarget.contains(e.relatedTarget as Node | null)) {
        setFocused(false);
      }
    },
    [scrubbing],
  );

  const handleHoverEnter = useCallback(() => {
    if (!disabled) setHovered(true);
  }, [disabled]);
  const handleHoverLeave = useCallback(() => {
    if (!scrubbing) setHovered(false);
  }, [scrubbing]);

  const lanesGroup = (
    <div className={`flex ${tokens.groupGap}`}>
      <SetpointLane
        design={design}
        shortLabel={SETPOINT_LABELS.ALT.short}
        longLabel={SETPOINT_LABELS.ALT.long}
        current={altitudeM}
        target={targetAltitudeM}
        min={ALT_MIN}
        max={ALT_MAX}
        step={1}
        unit="m"
        format={(v) => `${Math.round(v)}`}
        disabled={disabled}
        onChange={onTargetAltitudeChange}
        onScrubStart={handleScrubStart}
        onScrubEnd={handleScrubEnd}
      />
      <SetpointLane
        design={design}
        shortLabel={SETPOINT_LABELS.SPD.short}
        longLabel={SETPOINT_LABELS.SPD.long}
        current={velocityMps}
        target={targetVelocityMps}
        min={SPD_MIN}
        max={SPD_MAX}
        step={0.5}
        unit="m/s"
        format={(v) => v.toFixed(1)}
        disabled={disabled}
        onChange={onTargetVelocityChange}
        onScrubStart={handleScrubStart}
        onScrubEnd={handleScrubEnd}
      />
    </div>
  );

  return (
    <div
      role="group"
      aria-label="Altitude and speed setpoints"
      aria-disabled={disabled || undefined}
      className={`pointer-events-none absolute z-20 left-0 top-1/2 -translate-y-1/2 transition-opacity duration-150
        ${disabled ? 'opacity-45' : ''}`}
      onFocusCapture={() => {
        if (!disabled) setFocused(true);
      }}
      onBlurCapture={handleBlurCapture}
    >
      <DirIsland direction="ltr">
        <div className="relative flex items-stretch">
          <div
            aria-hidden
            className={`w-3 ${RAIL_MIN_H} ${disabled ? '' : 'pointer-events-auto'}`}
            onMouseEnter={handleHoverEnter}
            onMouseLeave={handleHoverLeave}
          />

          <div className={`relative flex flex-col items-start justify-center ${RAIL_MIN_W} ${RAIL_MIN_H}`}>
            <div
              className={`pointer-events-none flex flex-col justify-center gap-3 ${REVEAL_TRANSITION}
                ${expanded
                  ? 'absolute inset-0 opacity-0 scale-[0.98]'
                  : 'opacity-100 scale-100'}`}
              aria-hidden={expanded}
            >
              {batteryPct != null && (
                <IdleRow
                  label="Battery"
                  value={`${Math.round(batteryPct)}`}
                  unit="%"
                  valueClass="text-accent-success"
                />
              )}
              <IdleRow
                label={SETPOINT_LABELS.ALT.long}
                value={`${Math.round(altitudeM)}`}
                unit="m"
              />
              <IdleRow
                label={SETPOINT_LABELS.SPD.long}
                value={velocityMps.toFixed(1)}
                unit="m/s"
              />
            </div>

            <div
              className={`absolute inset-0 flex items-center justify-center ${REVEAL_TRANSITION}
                ${expanded
                  ? 'pointer-events-auto opacity-100 [clip-path:inset(0_0_0_0)] translate-x-0'
                  : 'pointer-events-none opacity-0 [clip-path:inset(0_10%_0_0)] -translate-x-0.5'}`}
              aria-hidden={!expanded}
              onMouseEnter={handleHoverEnter}
              onMouseLeave={handleHoverLeave}
            >
              {design === 'gutter' ? (
                <div className="rounded-md bg-surface-2/80 backdrop-blur-md px-2 py-3 ring-1 ring-inset ring-border-default">
                  {lanesGroup}
                </div>
              ) : (
                lanesGroup
              )}
            </div>
          </div>
        </div>
      </DirIsland>
    </div>
  );
}

function IdleRow({
  label,
  value,
  unit,
  valueClass = 'text-slate-12',
}: {
  label: string;
  value: string;
  unit: string;
  valueClass?: string;
}) {
  const labelId = useId();
  const valueId = useId();

  return (
    <div
      role="group"
      aria-labelledby={`${labelId} ${valueId}`}
      className={`flex ${IDLE_WIDTH} items-stretch gap-1.5`}
    >
      <span className="mt-0.5 w-px shrink-0 bg-slate-12/40" aria-hidden />
      <div>
        <div id={labelId} className="text-[12px] font-medium leading-none text-slate-11">
          {label}
        </div>
        <span
          id={valueId}
          className={`mt-1.5 block whitespace-nowrap font-mono text-[20px] leading-none tabular-nums ${valueClass}`}
        >
          {value}
          <span className="ms-0.5 text-[12px] text-slate-11">{unit}</span>
        </span>
      </div>
    </div>
  );
}

function SetpointLane({
  design,
  shortLabel,
  longLabel,
  current,
  target,
  min,
  max,
  step,
  unit,
  format,
  disabled,
  onChange,
  onScrubStart,
  onScrubEnd,
}: {
  design: RailDesign;
  shortLabel: string;
  longLabel: string;
  current: number;
  target: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  format: (v: number) => string;
  disabled: boolean;
  onChange: (next: number) => void;
  onScrubStart: () => void;
  onScrubEnd: () => void;
}) {
  const labelId = useId();
  const valueId = useId();
  const tokens = DESIGN_TOKENS[design];
  const range = max - min;
  const thumbPx = design === 'high-contrast' ? THUMB_PX_BOLD : THUMB_PX;
  const thumbInsetPx = thumbPx / 2;

  const livePct =
    range <= 0 ? 0 : Math.min(100, Math.max(0, ((current - min) / range) * 100));
  const targetPct =
    range <= 0 ? 0 : Math.min(100, Math.max(0, ((target - min) / range) * 100));
  const travelPx = TRACK_PX - thumbPx;
  const liveBottomPx = clamp(
    thumbInsetPx + (livePct / 100) * travelPx,
    thumbInsetPx,
    TRACK_PX - thumbInsetPx,
  );
  const targetBottomPx = clamp(
    thumbInsetPx + (targetPct / 100) * travelPx,
    thumbInsetPx,
    TRACK_PX - thumbInsetPx,
  );

  const targetText = unit ? `${format(target)} ${unit}` : format(target);
  const liveText = unit ? `${format(current)} ${unit}` : format(current);
  const pending = Math.abs(target - current) >= step / 2;

  const stepBy = useCallback(
    (delta: number) => {
      const next = clamp(target + delta, min, max);
      onChange(snapToStep(next, step, min));
    },
    [target, step, min, max, onChange],
  );

  const tickUp = useCallback(
    (multiplier: HoldRepeatMultiplier) => stepBy(multiplier * step),
    [stepBy, step],
  );
  const tickDown = useCallback(
    (multiplier: HoldRepeatMultiplier) => stepBy(-multiplier * step),
    [stepBy, step],
  );

  const handleMatchLive = useCallback(() => {
    if (disabled) return;
    onChange(snapToStep(clamp(current, min, max), step, min));
  }, [current, disabled, max, min, step, onChange]);

  const handleSliderKeyDownCapture = useCallback(
    (e: KeyboardEvent<HTMLSpanElement>) => {
      if (!e.shiftKey) return;
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
      e.preventDefault();
      e.stopPropagation();
      stepBy((e.key === 'ArrowUp' ? 1 : -1) * step * 10);
    },
    [stepBy, step],
  );

  const liveDotPx =
    tokens.liveDot === 'side-dot-bold' ? LIVE_DOT_PX_BOLD : LIVE_DOT_PX;

  const showHeadline = design === 'tube-chips';

  return (
    <div
      className={`flex ${LANE_WIDTH} shrink-0 flex-col items-center gap-1 ${tokens.lane}`}
    >
      {showHeadline && (
        <header
          className={`font-mono text-[9px] uppercase tracking-[0.18em] leading-none text-slate-9 ${TEXT_SHADOW}`}
          aria-hidden
        >
          {longLabel}
        </header>
      )}
      <div id={labelId} className={tokens.label}>
        <span aria-hidden>{shortLabel}</span>
        <span className="sr-only">{longLabel}</span>
      </div>

      <ChevronStepButton
        direction="up"
        ariaLabel={`Increase ${longLabel}`}
        disabled={disabled || target >= max}
        onTick={tickUp}
        className={tokens.chevron}
      />

      <div
        className="relative w-7 shrink-0 overflow-hidden"
        style={{ height: TRACK_PX }}
      >
        {tokens.liveDot === 'tube-tick' ? (
          <div
            className={`pointer-events-none absolute z-0 start-1/2 h-px w-1.5 -translate-x-1/2 ${tokens.liveDotClass}`}
            style={{ bottom: liveBottomPx }}
            aria-hidden
          />
        ) : (
          <div
            className={`pointer-events-none absolute z-0 rounded-full ${tokens.liveDotClass}`}
            style={{
              height: liveDotPx,
              width: liveDotPx,
              bottom: liveBottomPx - liveDotPx / 2,
              left: 8,
            }}
            aria-hidden
          />
        )}
        {pending && tokens.liveDot !== 'tube-tick' && (
          <div
            className="pointer-events-none absolute start-1/2 z-0 w-px -translate-x-1/2 bg-accent-info"
            style={{
              bottom: Math.min(liveBottomPx, targetBottomPx),
              height: Math.abs(targetBottomPx - liveBottomPx),
            }}
            aria-hidden
          />
        )}
        <Slider
          orientation="vertical"
          min={min}
          max={max}
          step={step}
          value={[target]}
          disabled={disabled}
          onValueChange={([v]) => onChange(v)}
          onPointerDown={onScrubStart}
          onPointerUp={onScrubEnd}
          onPointerCancel={onScrubEnd}
          onKeyDownCapture={handleSliderKeyDownCapture}
          aria-labelledby={`${labelId} ${valueId}`}
          aria-valuetext={
            pending ? `${targetText}, pending live ${liveText}` : targetText
          }
          className={tokens.slider}
        />
      </div>

      <ChevronStepButton
        direction="down"
        ariaLabel={`Decrease ${longLabel}`}
        disabled={disabled || target <= min}
        onTick={tickDown}
        className={tokens.chevron}
      />

      <EditableValue
        id={valueId}
        target={target}
        min={min}
        max={max}
        step={step}
        format={format}
        unit={unit}
        disabled={disabled}
        ariaLabel={`${longLabel} target`}
        displayText={targetText}
        onCommit={onChange}
        buttonClass={tokens.valueButton}
        inputClass={tokens.valueInput}
      />

      {pending && !disabled && (
        <button
          type="button"
          onClick={handleMatchLive}
          aria-label={`Match live ${longLabel}, ${liveText}`}
          className={`whitespace-nowrap px-1 py-0.5 font-mono text-[10px] leading-none tabular-nums transition-transform active:scale-[0.97] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border-strong ${tokens.chip}`}
        >
          = {liveText}
        </button>
      )}
    </div>
  );
}

function ChevronStepButton({
  direction,
  ariaLabel,
  disabled,
  onTick,
  className,
}: {
  direction: 'up' | 'down';
  ariaLabel: string;
  disabled: boolean;
  onTick: (multiplier: HoldRepeatMultiplier) => void;
  className: string;
}) {
  const hold = useHoldRepeat(onTick);

  const handlePointerDown = useCallback(
    (e: PointerEvent<HTMLButtonElement>) => {
      if (disabled) return;
      if (e.button !== 0) return;
      e.preventDefault();
      hold.start(e.shiftKey ? 10 : 1);
    },
    [disabled, hold],
  );

  const handlePointerEnd = useCallback(() => {
    hold.cancel();
  }, [hold]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>) => {
      if (disabled) return;
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      onTick(e.shiftKey ? 10 : 1);
    },
    [disabled, onTick],
  );

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onPointerLeave={handlePointerEnd}
      onKeyDown={handleKeyDown}
      className={`flex h-4 w-7 items-center justify-center transition-[color,background-color,transform] duration-150 ease-out active:scale-[0.97] disabled:opacity-30 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border-strong ${className}`}
    >
      <ChevronGlyph direction={direction} />
    </button>
  );
}

function ChevronGlyph({ direction }: { direction: 'up' | 'down' }) {
  return (
    <svg
      width="10"
      height="6"
      viewBox="0 0 10 6"
      fill="none"
      aria-hidden
      style={direction === 'down' ? { transform: 'rotate(180deg)' } : undefined}
    >
      <path
        d="M1 5L5 1L9 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EditableValue({
  id,
  target,
  min,
  max,
  step,
  format,
  unit,
  disabled,
  ariaLabel,
  displayText,
  onCommit,
  buttonClass,
  inputClass,
}: {
  id: string;
  target: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  unit: string;
  disabled: boolean;
  ariaLabel: string;
  displayText: string;
  onCommit: (next: number) => void;
  buttonClass: string;
  inputClass: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const skipBlurCommitRef = useRef(false);

  useEffect(() => {
    if (editing) {
      const node = inputRef.current;
      if (node) {
        node.focus();
        node.select();
      }
    }
  }, [editing]);

  const startEdit = useCallback(() => {
    if (disabled) return;
    skipBlurCommitRef.current = false;
    setDraft(format(target));
    setEditing(true);
  }, [disabled, format, target]);

  const commit = useCallback(() => {
    const parsed = Number.parseFloat(draft);
    if (Number.isFinite(parsed)) {
      onCommit(snapToStep(clamp(parsed, min, max), step, min));
    }
    setEditing(false);
  }, [draft, max, min, onCommit, step]);

  const cancel = useCallback(() => {
    skipBlurCommitRef.current = true;
    setEditing(false);
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        commit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancel();
      }
    },
    [cancel, commit],
  );

  const handleBlur = useCallback(() => {
    if (skipBlurCommitRef.current) {
      skipBlurCommitRef.current = false;
      return;
    }
    commit();
  }, [commit]);

  if (editing) {
    return (
      <input
        ref={inputRef}
        id={id}
        type="text"
        inputMode="decimal"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        aria-label={`${ariaLabel}${unit ? ` in ${unit}` : ''}`}
        className={`w-full text-center font-mono text-[14px] leading-tight tabular-nums outline-none ${inputClass}`}
      />
    );
  }

  return (
    <button
      type="button"
      id={id}
      onClick={startEdit}
      disabled={disabled}
      aria-label={`${ariaLabel}, ${displayText}. Click to edit.`}
      aria-live="polite"
      aria-atomic="true"
      className={`w-full cursor-text whitespace-nowrap text-center font-mono text-[14px] leading-tight tabular-nums transition-colors disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border-strong ${buttonClass}`}
    >
      {displayText}
    </button>
  );
}
