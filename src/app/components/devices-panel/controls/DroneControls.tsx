/**
 * Drone-specific footer controls: a wipers `Switch` and a
 * three-state calibration button.
 *
 * Both are local-state today (no `on*` props), so the hook lives
 * here. Calibration walks `idle → running (2s) → done (1.5s) → idle`,
 * with `aria-busy` on the running step so screen readers announce
 * progress.
 */

import { useEffect, useState } from 'react';
import { Check, Loader2, Wrench } from '@/lib/icons/central';
import { Switch } from '../../ui/switch';
import type { Device, DevicesPanelStrings } from '../types';

interface DroneControlsProps {
  device: Device;
  strings: DevicesPanelStrings;
}

type CalibState = 'idle' | 'running' | 'done';

export function DroneControls({ device, strings }: DroneControlsProps) {
  const isOffline = device.connectionState === 'offline';
  const [wipersOn, setWipersOn] = useState(false);
  const [calibState, setCalibState] = useState<CalibState>('idle');

  // running → done after 2s
  useEffect(() => {
    if (calibState !== 'running') return;
    const t = setTimeout(() => setCalibState('done'), 2000);
    return () => clearTimeout(t);
  }, [calibState]);

  // done → idle after 1.5s (so the success affordance lingers, then resets)
  useEffect(() => {
    if (calibState !== 'done') return;
    const t = setTimeout(() => setCalibState('idle'), 1500);
    return () => clearTimeout(t);
  }, [calibState]);

  return (
    <>
      <div className="w-px h-5 bg-white/[0.08] mx-0.5" />
      <div className="flex items-center gap-2" data-handoff-component="device-wipers">
        <span className="text-xs text-white/60">{strings.wipers}</span>
        <Switch
          checked={wipersOn}
          onCheckedChange={setWipersOn}
          onClick={(e) => e.stopPropagation()}
          disabled={isOffline}
          aria-label={strings.wipersAriaLabel}
          className="h-[18px] w-8 data-[state=checked]:bg-sky-500/80 data-[state=unchecked]:bg-white/10"
        />
      </div>
      <button
        type="button"
        disabled={isOffline || calibState !== 'idle'}
        aria-busy={calibState === 'running'}
        onClick={(e) => {
          e.stopPropagation();
          setCalibState('running');
        }}
        data-handoff-component="device-calibrate"
        className="ms-auto flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium text-white/70 bg-white/[0.06] hover:bg-white/10 hover:text-white/90 active:scale-[0.98] transition-[background-color,color,transform] duration-150 ease-out cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-white/25 focus-visible:outline-none"
        aria-label={strings.calibrateAriaLabel}
      >
        {calibState === 'running' ? (
          <Loader2 size={12} className="animate-spin motion-reduce:animate-none" />
        ) : calibState === 'done' ? (
          <Check size={12} className="text-emerald-400" />
        ) : (
          <Wrench size={12} />
        )}
        {calibState === 'running'
          ? strings.calibrating
          : calibState === 'done'
            ? strings.calibrated
            : strings.calibrate}
      </button>
    </>
  );
}
