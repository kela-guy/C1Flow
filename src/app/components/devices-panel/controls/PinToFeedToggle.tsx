/**
 * Tiny pin/unpin toggle that lives in the row header for camera +
 * drone rows. Differs from the larger expanded-card pin button by
 * being icon-only and inline-sized.
 */

import { Pin, PinFilled } from '@/lib/icons/central';
import { Toggle } from '../../ui/toggle';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../ui/tooltip';
import type { Device, DevicesPanelStrings } from '../types';

interface PinToFeedToggleProps {
  device: Device;
  isPinned: boolean;
  isOffline: boolean;
  strings: DevicesPanelStrings;
  onPinToFeed?: (deviceId: string) => void;
  onUnpinFromFeed?: (deviceId: string) => void;
}

export function PinToFeedToggle({
  device,
  isPinned,
  isOffline,
  strings,
  onPinToFeed,
  onUnpinFromFeed,
}: PinToFeedToggleProps) {
  const tooltipLabel = isPinned ? strings.pinnedToFeedTooltip : strings.pinToFeedTooltip;
  // Disable when the corresponding handler isn't supplied — the pin
  // toggle should never fire a no-op transition.
  const isDisabled = isOffline || (isPinned ? !onUnpinFromFeed : !onPinToFeed);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Toggle
          pressed={isPinned}
          disabled={isDisabled}
          onPressedChange={(next) => {
            if (next) onPinToFeed?.(device.id);
            else onUnpinFromFeed?.(device.id);
          }}
          onClick={(e) => e.stopPropagation()}
          aria-label={tooltipLabel}
          data-handoff-component="device-pin-toggle"
          // Override the default Toggle sizing (h-9/min-w-9) to fit
          // inline with the other badges in the row, and strip the
          // accent background normally applied in the on state — we
          // want a clean white pin glyph (line off, filled on), not a
          // filled chip.
          className="size-6 min-w-0 p-0 rounded text-white/70 hover:bg-white/10 hover:text-white data-[state=on]:bg-transparent data-[state=on]:text-white [&_svg]:size-3"
        >
          {/*
            On = Central's filled Pin (separate package variant).
            Off = Central's outlined Pin. Both ship as native variant
            components so we no longer need the fill/strokeWidth hack.
          */}
          {isPinned ? <PinFilled /> : <Pin />}
        </Toggle>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        sideOffset={6}
        showArrow={false}
        className="px-2 py-1 text-xs text-zinc-300 bg-zinc-800 shadow-[0_0_0_1px_rgba(255,255,255,0.1)] whitespace-nowrap"
      >
        {tooltipLabel}
      </TooltipContent>
    </Tooltip>
  );
}
