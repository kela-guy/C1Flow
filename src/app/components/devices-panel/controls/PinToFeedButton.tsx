/**
 * Larger pin/unpin pill rendered in the expanded-card footer for
 * camera + drone rows. Mirrors the row-header `PinToFeedToggle` but
 * carries a label so it reads explicitly inside the action bar.
 */

import { Pin, PinOff } from '@/lib/icons/central';
import type { Device, DevicesPanelStrings } from '../types';

interface PinToFeedButtonProps {
  device: Device;
  isPinned: boolean;
  isOffline: boolean;
  strings: DevicesPanelStrings;
  onPinToFeed?: (deviceId: string) => void;
  onUnpinFromFeed?: (deviceId: string) => void;
}

export function PinToFeedButton({
  device,
  isPinned,
  isOffline,
  strings,
  onPinToFeed,
  onUnpinFromFeed,
}: PinToFeedButtonProps) {
  const isDisabled = isOffline || (isPinned ? !onUnpinFromFeed : !onPinToFeed);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (isPinned) onUnpinFromFeed?.(device.id);
        else onPinToFeed?.(device.id);
      }}
      disabled={isDisabled}
      aria-pressed={isPinned}
      aria-label={isPinned ? strings.unpinFromFeedAriaLabel : strings.pinToFeedAriaLabel}
      data-handoff-component="device-pin-button"
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium active:scale-[0.98] transition-[background-color,color,transform] duration-150 ease-out cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-white/25 focus-visible:outline-none ${
        isPinned
          ? 'text-sky-100 bg-sky-500/30 ring-1 ring-inset ring-sky-300/45 hover:bg-sky-500/40'
          : 'text-sky-200 bg-sky-500/15 hover:bg-sky-500/25'
      }`}
    >
      {isPinned ? <PinOff size={12} /> : <Pin size={12} />}
      {isPinned ? strings.unpinFromFeed : strings.pinToFeed}
    </button>
  );
}
