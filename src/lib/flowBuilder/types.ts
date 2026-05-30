/**
 * Flow Builder — serializable flow definition + supporting types.
 *
 * A `FlowDef` is the *recipe* a PM authors in the builder panel. The
 * compiler ([compile.ts](./compile.ts)) turns it into an initial
 * `Detection` plus an ordered list of staged mutations the runtime
 * ([useFlowPlayer](../../app/components/flow-builder/useFlowPlayer.ts))
 * applies over time.
 *
 * Why a separate "def" instead of just storing a `Detection`:
 *   - Detection objects carry runtime-derived fields (`createdAtMs`,
 *     `timestamp`, trail points, action log entries). Saving them
 *     directly would freeze a single playback timestamp into the
 *     preset, which is exactly what we DON'T want for a replayable
 *     scenario.
 *   - `FlowDef` is intent ("a hostile drone seen by these sensors,
 *     jam-engagement to BDA"). Playback time is computed when the PM
 *     hits play, so every replay is fresh.
 *   - Serializable JSON: presets can land in localStorage and round-
 *     trip through export/import without coupling to React or to the
 *     production state mutators.
 */

import type { Affiliation } from '@/primitives/markerStyles';

/**
 * Entities the builder exposes. Subset of `ClassifiedType` plus the
 * map back to a `DetectionType`. We deliberately don't surface every
 * ClassifiedType value in the picker — `aircraft` and `unknown` are
 * edge cases the production app handles but the PM rarely composes
 * scenarios around. Drop them in later if a real use case appears.
 */
export type FlowEntity = 'drone' | 'car' | 'tank' | 'truck' | 'bird';

/**
 * Act behavior. Mirrors what the production card actually offers per
 * entity, so the compiler can refuse impossible combinations early
 * (e.g. "bird + weapon" never makes sense) and the panel can hide
 * incompatible options up front.
 *
 *   - `jam`     — non-kinetic. Drones / aircraft path.
 *   - `weapon`  — kinetic. Cars / tanks / trucks path.
 *   - `dismiss` — operator decides this is not a threat. Bird path.
 *   - `manual`  — operator drives the card; the player stops after
 *                 Investigation and leaves the production card actions
 *                 wired up.
 */
export type FlowActKind = 'jam' | 'weapon' | 'dismiss' | 'manual';

/**
 * Derive the effector for an entity. The Flow Builder no longer asks the
 * PM to pick a response — the effector follows from what the entity is
 * (drones are jammed, ground vehicles are engaged kinetically, birds are
 * dismissed as false alarms). Kept as a pure mapping so the panel and the
 * branch-preview diagram stay in lockstep and `compileFlow` keeps a real
 * `act` to schedule.
 */
export function deriveActForEntity(entity: FlowEntity): FlowActKind {
  switch (entity) {
    case 'drone':
      return 'jam';
    case 'car':
    case 'tank':
    case 'truck':
      return 'weapon';
    case 'bird':
      return 'dismiss';
  }
}

/**
 * Location strategy. `preset` uses one of a handful of map-anchored
 * sectors; `custom` is a raw lat/lon for "pick on map" later. Storing
 * the union (rather than always a `{lat,lon}`) keeps presets stable
 * when the underlying sectors move.
 */
export type FlowLocationPresetKey =
  | 'sector-north'
  | 'sector-east'
  | 'sector-south'
  | 'sector-west';

export interface FlowLocationPreset {
  kind: 'preset';
  key: FlowLocationPresetKey;
}
export interface FlowLocationCustom {
  kind: 'custom';
  lat: number;
  lon: number;
}
export type FlowLocation = FlowLocationPreset | FlowLocationCustom;

/**
 * Playback configuration. Speed multiplies the timing values; manual
 * mode short-circuits auto-advance entirely (the panel surfaces a
 * Step button). Kept as a discriminated union so adding more modes
 * later (e.g. `loop`) is non-breaking.
 */
export type FlowPlaybackSpeed = 0.5 | 1 | 2 | 4;
export type FlowPlayback =
  | { mode: 'auto'; speed: FlowPlaybackSpeed }
  | { mode: 'manual' };

/**
 * Per-stage timing in real milliseconds. The player multiplies by the
 * playback speed. Defaults are tuned so an end-to-end auto playback
 * runs in ~10s at 1x — long enough to feel like a sequence, short
 * enough that "play it again" stays satisfying.
 */
export interface FlowTiming {
  /** Delay from start until the lifecycle flips raw_detection -> classified. */
  classifyMs: number;
  /** Delay from classification until Act fires. */
  actMs: number;
  /** Delay from Act-complete until the closure / resolved state lands. */
  closureMs: number;
}

/**
 * Investigation knobs. v1 is intentionally narrow — auto-classify is
 * the only required stage transition; the optional `pointCamera`
 * toggle exists so a PM can demo the "operator points the PTZ at the
 * track" beat without wiring full Flow-3 drone deployment yet.
 */
export interface FlowInvestigation {
  /** When true, request the production camera-point handler at Investigation. */
  pointCamera?: boolean;
}

/**
 * The serializable preset itself. Keep this 100% JSON-safe: no
 * functions, no DOM refs, no Detection (Detection is the *output* of
 * the compiler).
 *
 * `version` exists so the storage module can refuse / migrate older
 * presets cleanly when this shape evolves.
 */
export interface FlowDef {
  id: string;
  name: string;
  version: 1;

  entity: FlowEntity;
  affiliation: Affiliation;
  /** Asset ids from `tacticalAssets.ts` (RAD-..., CAM-..., LIDAR-..., SENS-...). */
  sensorIds: string[];
  location: FlowLocation;

  investigation: FlowInvestigation;
  act: FlowActKind;

  timing: FlowTiming;
  playback: FlowPlayback;
}

/** Default timing — see comment on `FlowTiming`. */
export const DEFAULT_FLOW_TIMING: FlowTiming = {
  classifyMs: 2500,
  actMs: 3500,
  closureMs: 4000,
};

/**
 * Map-anchored sectors. Coordinates sit inside the existing static
 * asset cluster ([tacticalAssets.ts](../../app/components/tacticalAssets.ts))
 * so the spawned target falls within sensor FOVs by default.
 */
export const FLOW_LOCATION_PRESETS: Record<FlowLocationPresetKey, { lat: number; lon: number }> = {
  'sector-north': { lat: 32.4806, lon: 35.0023 },
  'sector-east': { lat: 32.4666, lon: 35.0263 },
  'sector-south': { lat: 32.4506, lon: 35.0083 },
  'sector-west': { lat: 32.4666, lon: 34.9803 },
};

/**
 * Wire format for the on-disk preset bundle. The single `version` at
 * the bundle level + per-preset version lets us evolve either the
 * envelope or individual presets without breaking the other.
 */
export interface FlowPresetBundle {
  version: 1;
  presets: FlowDef[];
}

export const FLOW_PRESET_STORAGE_KEY = 'c2hub.flowBuilder.presets';
