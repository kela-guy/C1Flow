/**
 * Audio-track combobox shown inside an expanded speaker card.
 *
 * Local-only state today — the selected track does not flow to the
 * `onSpeakerToggle` callback yet (see `DevicesPanel.spec.ts`), so we
 * keep the selection here in a `useState` until the back-end is wired.
 *
 * Built on `Popover` + cmdk `Command` for type-to-filter behaviour
 * matching the rest of the dashboard.
 */

import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '../../ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover';
import type { DevicesPanelStrings, SpeakerTrack } from '../types';

interface SpeakerTrackSelectProps {
  tracks: SpeakerTrack[];
  strings: DevicesPanelStrings;
}

export function SpeakerTrackSelect({ tracks, strings }: SpeakerTrackSelectProps) {
  const [open, setOpen] = useState(false);
  const [trackId, setTrackId] = useState<string>(tracks[0]?.id ?? '');
  const selected = tracks.find((t) => t.id === trackId) ?? tracks[0];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-label={strings.audioTrackAriaLabel}
          data-handoff-component="device-speaker-track"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          className="flex h-7 min-w-0 max-w-[180px] items-center justify-between gap-1.5 px-2 rounded text-xs font-medium text-white/[0.64] hover:text-white bg-white/[0.05] hover:bg-white/[0.10] transition-[background-color,color,transform] duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20"
        >
          <span className="truncate">{selected?.label ?? strings.audioTrack}</span>
          <ChevronsUpDown size={12} className="shrink-0 opacity-60" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={4}
        className="w-[var(--radix-popover-trigger-width)] min-w-[180px] p-0 bg-zinc-900 text-white border-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_8px_24px_rgba(0,0,0,0.35)] origin-top-left rtl:origin-top-right"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <Command className="bg-transparent">
          <CommandInput
            placeholder={strings.audioTrackSearchPlaceholder}
            className="h-8 text-xs"
          />
          <CommandList>
            <CommandEmpty className="py-3 text-center text-xs text-white/50">
              {strings.audioTrackNoMatches}
            </CommandEmpty>
            <CommandGroup>
              {tracks.map((track) => (
                <CommandItem
                  key={track.id}
                  value={track.label}
                  onSelect={() => {
                    setTrackId(track.id);
                    setOpen(false);
                  }}
                  className="text-xs data-[selected=true]:bg-white/10 data-[selected=true]:text-white"
                >
                  <span className="flex-1 truncate">{track.label}</span>
                  {track.id === trackId && (
                    <Check size={12} className="shrink-0 text-white/80" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
