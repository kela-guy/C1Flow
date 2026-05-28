/**
 * ECM-only inline button rendered in the collapsed row header.
 *
 * - Enabled: red-tinted "Activate" pill that fires `onJamActivate`.
 * - Disabled: same pill at 40% opacity, wrapped in a `ReasonTooltip`
 *   that explains why (offline / malfunction / already jamming).
 *
 * Label flips to "Jam active" when `device.status === 'active'`,
 * even when the button is disabled, so operators see live state at a
 * glance.
 */

import { JamIcon } from '@/primitives/ProductIcons';
import { getJamDisabledReason } from '../utils';
import type { Device, DevicesPanelStrings } from '../types';
import { ReasonTooltip } from './ReasonTooltip';

interface JamButtonProps {
  device: Device;
  strings: DevicesPanelStrings;
  onJamActivate?: (jammerId: string) => void;
}

export function JamButton({ device, strings, onJamActivate }: JamButtonProps) {
  const reason = getJamDisabledReason(device, strings);
  const isDisabled = reason !== null;

  const btn = (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onJamActivate?.(device.id);
      }}
      disabled={isDisabled}
      data-handoff-component="device-jam-button"
      className="shrink-0 flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-[background-color,transform] duration-150 ease-out disabled:opacity-40 disabled:cursor-not-allowed bg-[oklch(0.348_0.111_17)] text-[oklch(0.927_0.062_17)] ring-1 ring-inset ring-[oklch(0.348_0.111_17_/_0.4)] hover:bg-[oklch(0.445_0.151_17)] active:scale-[0.98] active:bg-[oklch(0.295_0.082_17)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25"
    >
      <JamIcon size={12} />
      {device.status === 'active' ? strings.jamActive : strings.jam}
    </button>
  );

  return <ReasonTooltip reason={reason}>{btn}</ReasonTooltip>;
}
