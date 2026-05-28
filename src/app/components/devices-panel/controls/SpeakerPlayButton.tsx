/**
 * Speaker-only inline Play/Stop button in the collapsed row header.
 *
 * Mirrors the ECM jam-button placement so the two effector controls
 * read as a pair. When the device is offline the button is disabled
 * and wrapped in a `ReasonTooltip` with `speakerDisabledOffline`.
 */

import { Square } from 'lucide-react';
import { Button } from '../../ui/button';
import { PlayFilledIcon } from '../icons';
import { ReasonTooltip } from './ReasonTooltip';
import type { Device, DevicesPanelStrings } from '../types';

interface SpeakerPlayButtonProps {
  device: Device;
  isPlaying: boolean;
  strings: DevicesPanelStrings;
  onSpeakerToggle?: (speakerId: string, next: boolean) => void;
}

export function SpeakerPlayButton({
  device,
  isPlaying,
  strings,
  onSpeakerToggle,
}: SpeakerPlayButtonProps) {
  const isOffline = device.connectionState === 'offline';
  const reason = isOffline ? strings.speakerDisabledOffline : null;

  const btn = (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={(e) => {
        e.stopPropagation();
        onSpeakerToggle?.(device.id, !isPlaying);
      }}
      disabled={isOffline}
      aria-pressed={isPlaying}
      data-handoff-component="device-speaker-play"
      className="shrink-0 h-7 gap-1.5 px-2 rounded text-xs font-medium"
    >
      {isPlaying ? <Square size={12} /> : <PlayFilledIcon size={12} />}
      {isPlaying ? strings.speakerStop : strings.speakerPlay}
    </Button>
  );

  return <ReasonTooltip reason={reason}>{btn}</ReasonTooltip>;
}
