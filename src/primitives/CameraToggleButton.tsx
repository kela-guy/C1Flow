import React from 'react';
import { ActionButton, type ActionButtonSize } from './ActionButton';

export interface CameraToggleButtonProps {
  /** Whether the camera is currently live/locked on the target. */
  on: boolean;
  /** Transient slew phase between off and on; shows a spinner and is non-interactive. */
  pending?: boolean;
  size?: ActionButtonSize;
  /** Label shown in the off (idle) state, e.g. "Point camera". */
  offLabel: string;
  /** Label shown in the on (live) state, e.g. "Release camera". */
  onLabel: string;
  /** Label shown while slewing. Falls back to `onLabel`. */
  pendingLabel?: string;
  offIcon?: React.ElementType;
  onIcon?: React.ElementType;
  onToggle: (e: React.MouseEvent) => void;
  className?: string;
}

/**
 * Single on/off camera control. Off invites "point the camera"; pressing it
 * slews (pending) and settles into a brighter "on" state. Pressing again
 * stops the camera. The on state reads the same idle or hovered. Wraps
 * {@link ActionButton} so motion, sizing, and focus rings stay consistent
 * with every other card action.
 */
export function CameraToggleButton({
  on,
  pending = false,
  size = 'sm',
  offLabel,
  onLabel,
  pendingLabel,
  offIcon,
  onIcon,
  onToggle,
  className = '',
}: CameraToggleButtonProps) {
  if (pending) {
    return (
      <ActionButton
        label={pendingLabel ?? onLabel}
        variant="fill"
        size={size}
        loading
        pressed
        onClick={onToggle}
        className={`w-full ${className}`}
      />
    );
  }

  return (
    <ActionButton
      label={on ? onLabel : offLabel}
      icon={on ? onIcon : offIcon}
      variant="fill"
      size={size}
      pressed={on}
      onClick={onToggle}
      className={`w-full ${className}`}
    />
  );
}
