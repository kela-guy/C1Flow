/**
 * Local 30-minute mute timer for the Devices Panel.
 *
 * The hook owns:
 *   - the `id → expiry` map of currently-muted devices
 *   - a single 1s interval (only attached while the map is non-empty)
 *     that drops expired entries and forces the countdown labels to
 *     re-render
 *   - `toggle` to mute/unmute and `getRemaining` to format the
 *     remaining `mm:ss` for a single device
 *
 * Behavior is intentionally identical to the inline implementation
 * the panel previously hosted — same 30-minute window, same one
 * shared interval, same in-memory-only persistence.
 */

import { useCallback, useEffect, useState } from 'react';
import { MUTE_DURATION_MS } from './constants';
import { formatMuteRemaining } from './utils';

export interface UseMutedDevicesReturn {
  /** True iff the device is currently muted. */
  isMuted: (deviceId: string) => boolean;
  /** Remaining mute time as `mm:ss`, or null when not muted. */
  getRemaining: (deviceId: string) => string | null;
  /** Mute the device for `MUTE_DURATION_MS`, or unmute if already muted. */
  toggle: (deviceId: string) => void;
}

export function useMutedDevices(): UseMutedDevicesReturn {
  const [muted, setMuted] = useState<Map<string, number>>(new Map());
  // `tick` is a forced-render counter so the `getRemaining` reads
  // recompute every second while at least one device is muted.
  const [, setTick] = useState(0);

  // Single shared interval — attached only while there's something to
  // tick. The dependency uses a boolean so we don't re-arm the timer
  // every time a single entry changes.
  const hasMuted = muted.size > 0;
  useEffect(() => {
    if (!hasMuted) return;
    const id = setInterval(() => {
      const now = Date.now();
      setMuted((prev) => {
        let changed = false;
        const next = new Map(prev);
        for (const [deviceId, expiry] of next) {
          if (expiry <= now) {
            next.delete(deviceId);
            changed = true;
          }
        }
        return changed ? next : prev;
      });
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [hasMuted]);

  const toggle = useCallback((deviceId: string) => {
    setMuted((prev) => {
      const next = new Map(prev);
      if (next.has(deviceId)) {
        next.delete(deviceId);
      } else {
        next.set(deviceId, Date.now() + MUTE_DURATION_MS);
      }
      return next;
    });
  }, []);

  const isMuted = useCallback((deviceId: string) => muted.has(deviceId), [muted]);

  const getRemaining = useCallback(
    (deviceId: string) => formatMuteRemaining(muted.get(deviceId), Date.now()),
    [muted],
  );

  return { isMuted, getRemaining, toggle };
}
