/**
 * Floodlight-only inline `Switch` rendered in the collapsed row header.
 *
 * Uses a tooltip for the on/off action label so the small switch reads
 * as labelled. When the device is offline, the switch is disabled —
 * we keep the tooltip but flip its content to the same on/off label
 * so the visual chrome stays consistent.
 */

import { Switch } from '../../ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../ui/tooltip';
import type { Device, DevicesPanelStrings } from '../types';

interface FloodlightSwitchProps {
  device: Device;
  isOn: boolean;
  strings: DevicesPanelStrings;
  onToggle?: (floodlightId: string, next: boolean) => void;
}

export function FloodlightSwitch({ device, isOn, strings, onToggle }: FloodlightSwitchProps) {
  const isOffline = device.connectionState === 'offline';
  const actionLabel = isOn ? strings.floodlightTurnOff : strings.floodlightTurnOn;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className="shrink-0 inline-flex"
          data-handoff-component="device-floodlight-switch"
          onClick={(e) => e.stopPropagation()}
        >
          <Switch
            checked={isOn}
            onCheckedChange={(next) => onToggle?.(device.id, next)}
            onClick={(e) => e.stopPropagation()}
            disabled={isOffline}
            aria-label={actionLabel}
            className="h-[18px] w-8 data-[state=checked]:bg-white data-[state=unchecked]:bg-white/10 [&_[data-slot=switch-thumb]]:data-[state=checked]:bg-zinc-900"
          />
        </span>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        sideOffset={6}
        showArrow={false}
        className="px-2 py-1 text-xs text-zinc-300 bg-zinc-800 shadow-[0_0_0_1px_rgba(255,255,255,0.1)] whitespace-nowrap"
      >
        {actionLabel}
      </TooltipContent>
    </Tooltip>
  );
}
