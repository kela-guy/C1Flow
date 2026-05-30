/**
 * Flow Builder — runtime player.
 *
 * Walks a compiled flow ([compileFlow](../../../lib/flowBuilder/compile.ts))
 * through Detection -> Investigation -> Act -> Resolved, applying
 * each `StagedMutation` at the right moment.
 *
 * Design contract:
 *   - Stage-flip mutations (raw_detection -> classified, resolved
 *     fields) are plain `setTargets` patches via `ops.patchDetection`.
 *   - Act mutations call the PRODUCTION engagement handlers through
 *     `ops.dispatchAct` so manual stepping and the real card button
 *     run identical code. No second mutation seam.
 *   - Idempotent replay: every detection id and every timer is
 *     tracked, so `reset()` and re-entry from `play()` leave nothing
 *     behind (no orphaned effectors, no duplicate detections, no
 *     leaked timeouts).
 *   - Unmount cleanup mirrors `reset()`.
 *
 * The hook is intentionally framework-light: one timer at a time,
 * monotonic clock via `performance.now()`, no scheduler library. The
 * panel surfaces `state.stage` to drive the stage rail indicator.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Detection } from '@/imports/ListOfSystems';
import {
  compileFlow,
  type CompiledFlow,
  type FlowDef,
  type FlowActKind,
  type StagedMutation,
} from '@/lib/flowBuilder';

export type FlowPlaybackStage =
  | 'detection'
  | 'investigation'
  | 'act'
  | 'resolved';

export type FlowPlayerStatus = 'idle' | 'playing' | 'paused' | 'complete';

export interface FlowPlayerState {
  status: FlowPlayerStatus;
  /** The stage the most recently applied mutation belongs to. */
  stage: FlowPlaybackStage;
  /** Spawned detection id, or null when nothing is in flight. */
  activeDetectionId: string | null;
  /** 0..1, derived from mutations applied vs total. */
  progress: number;
}

/**
 * Production seams the player calls into. Dashboard owns the
 * implementation; the player just dispatches by `kind`. Keeping this
 * surface small makes the contract explicit and easy to test.
 */
export interface FlowPlayerOps {
  /** Append a freshly compiled Detection to `targets`. */
  appendDetection: (det: Detection) => void;
  /** Merge a partial Detection by id (stage-flip patches). */
  patchDetection: (id: string, patch: Partial<Detection>) => void;
  /** Remove a Detection by id. Used during teardown. */
  removeDetection: (id: string) => void;
  /**
   * Run the production engagement chain for `kind`. Dashboard maps
   * this to `handleMitigate` / `handlePointWeapon` (+ `handleLockWeapon`
   * + `handleCompleteMission`) / `handleDismiss`. The player doesn't
   * peek inside.
   */
  dispatchAct: (args: { kind: FlowActKind; targetId: string }) => void;
  /** Optional camera-point during Investigation when the def requests it. */
  invokeCameraPoint?: (targetId: string) => void;
  /**
   * Restore any effectors / launchers the player or its act calls
   * activated. Dashboard's implementation flips them back to
   * 'available' status with cleared `activeTargetId`. Idempotent.
   */
  resetEffectors: () => void;
  /** Called once after a detection appends so the dashboard can focus the map. */
  onDetectionAppended?: (det: Detection) => void;
}

interface UseFlowPlayerArgs {
  ops: FlowPlayerOps;
  /** Locale-aware "now" label (e.g. "14:32:17") — same source spawnCuasTarget uses. */
  nowLabel: () => string;
}

const INITIAL_STATE: FlowPlayerState = {
  status: 'idle',
  stage: 'detection',
  activeDetectionId: null,
  progress: 0,
};

export function useFlowPlayer({ ops, nowLabel }: UseFlowPlayerArgs) {
  const [def, setDef] = useState<FlowDef | null>(null);
  const [state, setState] = useState<FlowPlayerState>(INITIAL_STATE);

  // Refs that don't trigger renders — the player needs these mutable
  // across timer callbacks without re-creating the closures.
  const compiledRef = useRef<CompiledFlow | null>(null);
  const cursorRef = useRef<number>(0); // index of NEXT mutation to apply
  const timerRef = useRef<number | null>(null);
  const pausedRemainingMsRef = useRef<number | null>(null);
  const spawnedIdsRef = useRef<Set<string>>(new Set());

  // ── Continuous movement (auto mode) ──────────────────────────────────
  // The discrete stage mutations fire on top of a steadily moving track.
  // We interpolate spawn -> defended center over `kinematics.travelMs`
  // (speed-scaled to match the mutation timeline) and patch coordinates
  // + trail every tick. Trail points are throttled so we don't grow the
  // ground-clamped polyline every frame (mirrors Dashboard's sim loops).
  const moveTimerRef = useRef<number | null>(null);
  const moveOriginRef = useRef<number | null>(null); // performance.now() of current segment
  const moveElapsedRef = useRef<number>(0); // accumulated ms across pause/resume
  const trailRef = useRef<{ lat: number; lon: number; timestamp: string }[]>([]);
  const lastTrailMsRef = useRef<number>(0);
  const MOVE_TICK_MS = 200;
  const TRAIL_SAMPLE_MS = 1000;
  const TRAIL_CAP = 60;
  const opsRef = useRef<FlowPlayerOps>(ops);
  // Keep ops fresh without restarting timers when Dashboard re-renders.
  opsRef.current = ops;
  // Defs sometimes change synchronously immediately before play()/step()
  // is called (panel calls loadFlow + play in the same tick); reading
  // from a ref guarantees the latest definition without waiting for
  // React's commit phase.
  const defRef = useRef<FlowDef | null>(null);
  defRef.current = def;

  const speedScale = useCallback((): number => {
    const current = defRef.current;
    if (!current) return 1;
    if (current.playback.mode === 'manual') return 1; // not used
    // `speed` is a multiplier (0.5×..4×); the timer delay scales by its
    // inverse, so 2× fires twice as fast and 0.5× half as fast. Guard
    // against a non-finite / zero value sneaking in from hand-edited JSON.
    const speed = current.playback.speed;
    return speed > 0 ? 1 / speed : 1;
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const clearMoveTimer = useCallback(() => {
    if (moveTimerRef.current != null) {
      window.clearInterval(moveTimerRef.current);
      moveTimerRef.current = null;
    }
  }, []);

  /** One movement tick: lerp spawn->center by elapsed fraction, patch the track. */
  const moveTick = useCallback(() => {
    const compiled = compiledRef.current;
    const origin = moveOriginRef.current;
    if (!compiled || origin == null) return;
    const k = compiled.kinematics;
    // `travelMs` is logical (pre-speed); scale to wall time the same way
    // the mutation scheduler does so motion and stage flips stay in sync.
    const effectiveTravelMs = Math.max(1, k.travelMs * speedScale());
    const elapsed = moveElapsedRef.current + (performance.now() - origin);
    const frac = Math.max(0, Math.min(1, elapsed / effectiveTravelMs));
    const lat = k.startLat + (k.endLat - k.startLat) * frac;
    const lon = k.startLon + (k.endLon - k.startLon) * frac;

    let trail = trailRef.current;
    if (elapsed - lastTrailMsRef.current >= TRAIL_SAMPLE_MS) {
      lastTrailMsRef.current = elapsed;
      trail = [...trail, { lat, lon, timestamp: nowLabel() }];
      if (trail.length > TRAIL_CAP) trail = trail.slice(-TRAIL_CAP);
      trailRef.current = trail;
    }

    opsRef.current.patchDetection(compiled.initial.id, {
      coordinates: `${lat.toFixed(5)}, ${lon.toFixed(5)}`,
      trail,
    });

    // Reached the center — freeze the track (no parking jitter) but leave
    // the detection in place for the remaining stage mutations.
    if (frac >= 1) clearMoveTimer();
  }, [clearMoveTimer, nowLabel, speedScale]);

  /** Begin / resume the movement segment. Auto mode only. */
  const startMovement = useCallback(() => {
    if (defRef.current?.playback.mode !== 'auto') return;
    if (!compiledRef.current) return;
    clearMoveTimer();
    moveOriginRef.current = performance.now();
    moveTimerRef.current = window.setInterval(moveTick, MOVE_TICK_MS);
  }, [clearMoveTimer, moveTick]);

  /** Freeze movement, banking elapsed so resume picks up where it left off. */
  const pauseMovement = useCallback(() => {
    if (moveOriginRef.current != null) {
      moveElapsedRef.current += performance.now() - moveOriginRef.current;
      moveOriginRef.current = null;
    }
    clearMoveTimer();
  }, [clearMoveTimer]);

  /** Tear movement down to baseline. */
  const stopMovement = useCallback(() => {
    clearMoveTimer();
    moveOriginRef.current = null;
    moveElapsedRef.current = 0;
    lastTrailMsRef.current = 0;
    trailRef.current = [];
  }, [clearMoveTimer]);

  const applyMutation = useCallback((m: StagedMutation, targetId: string) => {
    const o = opsRef.current;
    if (m.kind === 'patch' || m.kind === 'mark-complete') {
      if (m.patch) o.patchDetection(targetId, m.patch);
      return;
    }
    if (m.kind === 'invoke-camera') {
      o.invokeCameraPoint?.(targetId);
      return;
    }
    if (m.kind === 'invoke-act' && m.act) {
      o.dispatchAct({ kind: m.act, targetId });
      return;
    }
  }, []);

  /**
   * Advance the cursor by one mutation. Returns true if a mutation
   * was applied; false if we ran out (transitions state to 'complete').
   */
  const advanceOne = useCallback((): boolean => {
    const compiled = compiledRef.current;
    if (!compiled) return false;
    const idx = cursorRef.current;
    if (idx >= compiled.mutations.length) {
      setState((s) => ({ ...s, status: 'complete', progress: 1 }));
      return false;
    }
    const m = compiled.mutations[idx];
    applyMutation(m, compiled.initial.id);
    cursorRef.current = idx + 1;
    const total = compiled.mutations.length;
    setState((s) => ({
      ...s,
      stage: m.stage,
      progress: total > 0 ? (idx + 1) / total : 1,
      status: idx + 1 >= total ? 'complete' : s.status,
    }));
    return true;
  }, [applyMutation]);

  /**
   * Schedule the NEXT mutation against the wall clock. Auto mode
   * computes a delta from `compiled.mutations[cursor].atMs` minus the
   * previous mutation's `atMs`, scales by speed, and sets a single
   * timeout. Pause/resume snapshots the remaining time so resumes
   * land exactly where they would have.
   */
  const scheduleNext = useCallback(() => {
    const compiled = compiledRef.current;
    const current = defRef.current;
    if (!compiled || !current || current.playback.mode === 'manual') return;
    const idx = cursorRef.current;
    if (idx >= compiled.mutations.length) {
      setState((s) => ({ ...s, status: 'complete', progress: 1 }));
      return;
    }
    const m = compiled.mutations[idx];
    const prevAtMs = idx === 0 ? 0 : compiled.mutations[idx - 1].atMs;
    const deltaMs =
      pausedRemainingMsRef.current != null
        ? pausedRemainingMsRef.current
        : Math.max(0, (m.atMs - prevAtMs)) * speedScale();
    pausedRemainingMsRef.current = null;

    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      advanceOne();
      scheduleNext();
    }, deltaMs);
  }, [advanceOne, speedScale]);

  // ── Public transport API ─────────────────────────────────────────────

  /** Wipe any active flow back to baseline. Safe to call repeatedly. */
  const reset = useCallback(() => {
    clearTimer();
    stopMovement();
    pausedRemainingMsRef.current = null;
    cursorRef.current = 0;
    const o = opsRef.current;
    for (const id of spawnedIdsRef.current) o.removeDetection(id);
    spawnedIdsRef.current.clear();
    o.resetEffectors();
    compiledRef.current = null;
    setState(INITIAL_STATE);
  }, [clearTimer, stopMovement]);

  /** Load a new flow definition. Does NOT auto-play. */
  const loadFlow = useCallback((next: FlowDef | null) => {
    reset();
    // Push to the ref synchronously so a same-tick play()/step() sees
    // the latest definition without waiting for React's commit.
    defRef.current = next;
    setDef(next);
  }, [reset]);

  /**
   * Compile + spawn the initial detection, then either schedule the
   * first auto mutation or wait for `step()`. Calling `play()` while
   * already playing is a no-op; calling after `complete` resets and
   * replays — the natural "play again" gesture.
   */
  const play = useCallback(() => {
    const current = defRef.current;
    if (!current) return;
    if (state.status === 'playing') return;
    // Resuming a paused run is a different transport verb — route to
    // resume() rather than respawning the detection.
    if (state.status === 'paused') {
      // Inlined resume body to avoid the cyclic dep with `resume`.
      setState((s) => ({ ...s, status: 'playing' }));
      if (current.playback.mode === 'auto') {
        scheduleNext();
        startMovement();
      }
      return;
    }

    // Replay-from-complete: clear remnants of the previous run first.
    if (state.status === 'complete' || compiledRef.current === null) {
      reset();
      // reset() wiped defRef indirectly via state? No — reset() does
      // NOT touch def/defRef. But it set state.status to 'idle'; the
      // value of `current` we captured above is still valid.
    }

    const compiled = compileFlow(current, Date.now(), nowLabel());
    compiledRef.current = compiled;
    cursorRef.current = 0;
    spawnedIdsRef.current.add(compiled.initial.id);
    // Seed the movement track at the spawn edge so resume/trail math
    // starts from a known baseline.
    moveElapsedRef.current = 0;
    lastTrailMsRef.current = 0;
    trailRef.current = compiled.initial.trail
      ? [...compiled.initial.trail]
      : [];

    const o = opsRef.current;
    o.appendDetection(compiled.initial);
    o.onDetectionAppended?.(compiled.initial);

    setState({
      status: 'playing',
      stage: 'detection',
      activeDetectionId: compiled.initial.id,
      progress: 0,
    });

    if (current.playback.mode === 'auto') {
      scheduleNext();
      startMovement();
    }
  }, [nowLabel, reset, scheduleNext, startMovement, state.status]);

  /** Cancel pending auto timer, remember remaining time for resume. */
  const pause = useCallback(() => {
    if (state.status !== 'playing') return;
    // We can't read the remaining time from setTimeout — store the
    // ORIGINAL scheduled delta so resume re-uses it. Cheap and
    // accurate enough for a PM demo tool (sub-second drift). For
    // perfect resume we'd diff performance.now() bookmarks; not worth
    // the complexity here.
    const compiled = compiledRef.current;
    if (compiled) {
      const idx = cursorRef.current;
      if (idx < compiled.mutations.length) {
        const prevAtMs = idx === 0 ? 0 : compiled.mutations[idx - 1].atMs;
        const delta = Math.max(0, compiled.mutations[idx].atMs - prevAtMs) * speedScale();
        pausedRemainingMsRef.current = delta;
      }
    }
    clearTimer();
    pauseMovement();
    setState((s) => ({ ...s, status: 'paused' }));
  }, [clearTimer, pauseMovement, speedScale, state.status]);

  const resume = useCallback(() => {
    if (state.status !== 'paused') return;
    setState((s) => ({ ...s, status: 'playing' }));
    if (defRef.current?.playback.mode === 'auto') {
      scheduleNext();
      startMovement();
    }
  }, [scheduleNext, startMovement, state.status]);

  /**
   * Apply exactly one staged mutation. Available in both manual and
   * paused-auto states — same code path either way, which is exactly
   * the "manual stepping == real card button" invariant the plan
   * calls out.
   */
  const step = useCallback(() => {
    const current = defRef.current;
    if (!current) return;

    // First step also spawns the detection so a manual flow doesn't
    // surprise the PM with an empty map until the first stage flip.
    if (compiledRef.current === null) {
      const compiled = compileFlow(current, Date.now(), nowLabel());
      compiledRef.current = compiled;
      cursorRef.current = 0;
      spawnedIdsRef.current.add(compiled.initial.id);
      const o = opsRef.current;
      o.appendDetection(compiled.initial);
      o.onDetectionAppended?.(compiled.initial);
      setState({
        status: 'playing',
        stage: 'detection',
        activeDetectionId: compiled.initial.id,
        progress: 0,
      });
      return; // Stage 1 lives in the initial Detection; next click advances.
    }

    advanceOne();
  }, [advanceOne, nowLabel]);

  // Unmount cleanup — matches reset(). Without this a panel toggle
  // mid-playback would leak the timer + leave the detection orphaned
  // in `targets`.
  useEffect(() => {
    return () => {
      clearTimer();
      clearMoveTimer();
      const o = opsRef.current;
      for (const id of spawnedIdsRef.current) o.removeDetection(id);
      spawnedIdsRef.current.clear();
      o.resetEffectors();
    };
  }, [clearTimer, clearMoveTimer]);

  return {
    def,
    state,
    loadFlow,
    play,
    pause,
    resume,
    step,
    reset,
  };
}

export type FlowPlayer = ReturnType<typeof useFlowPlayer>;
