/**
 * Flow Builder — compiler.
 *
 * Turns a serializable [FlowDef](./types.ts) into:
 *   1. An initial `Detection` ready to be appended via `setTargets`.
 *   2. An ordered list of `StagedMutation` records the player applies
 *      over time to walk the detection through Detection ->
 *      Investigation -> Act -> Resolved.
 *
 * Pure module — no clock, no DOM, no React. The caller supplies a
 * `now()` factory so timestamps stay testable and the same module can
 * back both live playback (real `Date.now()`) and any future
 * deterministic replay.
 *
 * The compiler is intentionally light: it sets the *fields* that drive
 * the production lifecycle, but it does NOT call the production
 * engagement handlers (jam / weapon / BDA / dismiss). Those side
 * effects live in `useFlowPlayer` so we keep a single mutation seam
 * shared with the live card buttons (see plan, Phase 2).
 */

import type { Detection, ContributingSensor } from '@/imports/ListOfSystems';
import {
  CAMERA_ASSETS,
  RADAR_ASSETS,
  LIDAR_ASSETS,
  DRONE_HIVE_ASSETS,
  SITE_CENTER,
  type MapAsset,
} from '@/app/components/tacticalAssets';
import {
  type FlowDef,
  type FlowEntity,
  FLOW_LOCATION_PRESETS,
} from './types';

// ─── Entity -> Detection field mapping ─────────────────────────────────
//
// One place that translates the PM-facing `FlowEntity` into the
// `DetectionType` + `ClassifiedType` pair the rest of the app reads.
// Bird is the only entity whose top-level `type` is `'unknown'` — it
// matches how `spawnCuasTarget` treats birds (they aren't UAVs).

interface EntityFields {
  type: Detection['type'];
  classifiedType: NonNullable<Detection['classifiedType']>;
}

const ENTITY_FIELDS: Record<FlowEntity, EntityFields> = {
  drone: { type: 'uav', classifiedType: 'drone' },
  car: { type: 'ground_vehicle', classifiedType: 'car' },
  tank: { type: 'ground_vehicle', classifiedType: 'tank' },
  truck: { type: 'ground_vehicle', classifiedType: 'truck' },
  bird: { type: 'unknown', classifiedType: 'bird' },
};

// ─── Asset registry index ──────────────────────────────────────────────
//
// Sensor ids come in as strings from the panel; the compiler needs to
// recover their `typeLabel` so `contributingSensors[].sensorType`
// matches the production catalog. A flat lookup avoids a quadratic
// scan per compile and keeps the resolver in one place.

const SENSOR_INDEX: Map<string, MapAsset> = new Map();
for (const asset of [
  ...CAMERA_ASSETS,
  ...RADAR_ASSETS,
  ...LIDAR_ASSETS,
  ...DRONE_HIVE_ASSETS,
]) {
  SENSOR_INDEX.set(asset.id, asset);
}

export function resolveSensorAsset(sensorId: string): MapAsset | undefined {
  return SENSOR_INDEX.get(sensorId);
}

// ─── Staged mutations ──────────────────────────────────────────────────
//
// The player walks this list, applying each `patch` at `t = atMs`.
// Splitting "what changes" (patch) from "when" (atMs) keeps timing
// configurable per playback without re-running the compiler.
//
// `kind` lets the player dispatch to the *production* mutation seam
// for Act (so manual stepping and auto playback share one code path)
// and to a plain `setTargets` patch for the lifecycle stage flips.

export type StagedMutationKind =
  | 'patch' // direct setTargets patch (Detection field overrides)
  | 'invoke-act' // call the production engagement handler (jam/weapon/dismiss)
  | 'invoke-camera' // optional: point the PTZ during investigation
  | 'mark-complete'; // resolve / neutralize / closure flip

export interface StagedMutation {
  /** Logical stage this mutation belongs to — drives the panel's stage rail indicator. */
  stage: 'detection' | 'investigation' | 'act' | 'resolved';
  /** Elapsed ms from `play()` when this mutation should fire (pre-speed-scaling). */
  atMs: number;
  kind: StagedMutationKind;
  /** When kind === 'patch' or 'mark-complete', a partial Detection to merge. */
  patch?: Partial<Detection>;
  /** When kind === 'invoke-act', the high-level act to dispatch. */
  act?: FlowDef['act'];
}

/**
 * Straight-line track the player interpolates the spawn along, from its
 * detection edge toward the defended center. `travelMs` spans the whole
 * flow (pre-speed-scaling) so the target is still inbound when it
 * resolves — it never "arrives" and parks.
 */
export interface FlowKinematics {
  startLat: number;
  startLon: number;
  endLat: number;
  endLon: number;
  travelMs: number;
}

export interface CompiledFlow {
  initial: Detection;
  mutations: StagedMutation[];
  kinematics: FlowKinematics;
}

/**
 * Mint a fresh detection id. Mirrors `spawnCuasTarget`'s pattern
 * (`CUAS-${ts}-${rand}`) but with a `FLOW-` prefix so the player can
 * cheaply identify its own spawns during teardown — important for
 * idempotent replay (see plan, Phase 2 risks).
 */
export function newFlowDetectionId(): string {
  return `FLOW-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

/** Format a numeric lat/lon the way the live spawn does. */
function formatCoords(lat: number, lon: number): string {
  return `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
}

function locationLatLon(def: FlowDef): { lat: number; lon: number } {
  if (def.location.kind === 'custom') return { lat: def.location.lat, lon: def.location.lon };
  return FLOW_LOCATION_PRESETS[def.location.key];
}

function buildContributingSensors(
  sensorIds: string[],
  nowIso: string,
): ContributingSensor[] {
  return sensorIds.map((id) => {
    const asset = SENSOR_INDEX.get(id);
    return {
      sensorId: id,
      sensorType: asset?.typeLabel ?? id,
      firstDetectedAt: nowIso,
      lastDetectedAt: nowIso,
    };
  });
}

/**
 * Compile a flow definition.
 *
 * `nowMs` / `nowLabel` are injected for test friendliness and so the
 * caller controls when "now" is sampled. In live playback the player
 * calls `compileFlow(def, Date.now(), localeTimeString())`.
 */
export function compileFlow(
  def: FlowDef,
  nowMs: number,
  nowLabel: string,
): CompiledFlow {
  const { lat, lon } = locationLatLon(def);
  const fields = ENTITY_FIELDS[def.entity];
  const id = newFlowDetectionId();

  // Initial detection — a raw sensor blip with NO identity yet. A bare
  // sensor track can't tell us what the object is, so we spawn it as a
  // gray "unknown": `classifiedType` undefined, `type: 'unknown'`,
  // `affiliation: 'unknown'`, low confidence. The marker renders as a
  // plain gray dot (see `isUnclassifiedUnknown` in urgency.ts) until a
  // camera observes it and the classify mutation reveals the real
  // identity, affiliation, and severity the PM authored. The urgency
  // model still reads `raw_detection` as MEDIUM ("needs review") so the
  // queue surfaces it. See [urgency.ts] branch 4.
  const isVehicle =
    fields.classifiedType === 'car' ||
    fields.classifiedType === 'tank' ||
    fields.classifiedType === 'truck';
  const initial: Detection = {
    id,
    name: id,
    type: 'unknown',
    classifiedType: undefined,
    affiliation: 'unknown',
    status: 'detection',
    entityStage: 'raw_detection',
    timestamp: nowLabel,
    createdAtMs: nowMs,
    coordinates: formatCoords(lat, lon),
    distance: '—',
    flowType: 5,
    mitigationStatus: 'idle',
    weaponPointingStatus: undefined,
    contributingSensors: buildContributingSensors(def.sensorIds, nowLabel),
    trail: [{ lat, lon, timestamp: nowLabel }],
    confidence: 35,
  };

  const kinematics: FlowKinematics = {
    startLat: lat,
    startLon: lon,
    endLat: SITE_CENTER.lat,
    endLon: SITE_CENTER.lon,
    travelMs: Math.max(
      1,
      def.timing.classifyMs + def.timing.actMs + def.timing.closureMs,
    ),
  };

  // Build the timeline. Numbers are pre-speed-scaling; the player
  // divides by `speed` before scheduling timers.
  const mutations: StagedMutation[] = [];

  // Stage 2 — Investigation, part 1: point a camera at the still-unknown
  // blip. This is the always-on shape — a sensor gives us a location, so
  // the nearest PTZ slews to look. Scheduled BEFORE the classify reveal;
  // the gap to `classifyMs` is the camera's dwell/observation time.
  mutations.push({
    stage: 'investigation',
    atMs: Math.round(def.timing.classifyMs * 0.4),
    kind: 'invoke-camera',
  });

  // Stage 2, part 2 — the classify reveal. Only after the camera has
  // observed it do we learn what it is: identity (`type` +
  // `classifiedType`), the PM-chosen `affiliation`, and confidence all
  // land together, flipping the marker from gray to its severity color
  // and starting the Cesium trail (gated on `classified`).
  mutations.push({
    stage: 'investigation',
    atMs: def.timing.classifyMs,
    kind: 'patch',
    patch: {
      entityStage: 'classified',
      type: fields.type,
      classifiedType: fields.classifiedType,
      affiliation: def.affiliation,
      confidence: 80,
      weaponPointingStatus: isVehicle ? 'idle' : undefined,
    },
  });

  // Stage 3 — Act. Delegate to the player so it calls the production
  // handler (`onMitigate` / `onPointWeapon` / `onDismiss`), giving us
  // identical state transitions to the live card.
  if (def.act !== 'manual') {
    mutations.push({
      stage: 'act',
      atMs: def.timing.classifyMs + def.timing.actMs,
      kind: 'invoke-act',
      act: def.act,
    });
  }

  // Stage 4 — Resolved. Closure depends on the act kind:
  //   - jam   -> mitigated + bda:complete -> event_resolved
  //   - weapon-> mitigated (event_neutralized via completeMission)
  //   - dismiss -> event_resolved (already set by the dismiss handler)
  //   - manual -> player stops at the end of Investigation
  if (def.act === 'jam') {
    mutations.push({
      stage: 'resolved',
      atMs: def.timing.classifyMs + def.timing.actMs + def.timing.closureMs,
      kind: 'mark-complete',
      patch: {
        mitigationStatus: 'mitigated',
        bdaStatus: 'complete',
        status: 'event_resolved',
      },
    });
  } else if (def.act === 'weapon') {
    // Weapon flow drives its own pointing -> pointed -> locking -> locked
    // chain through the production handlers; we just close the
    // mission once the closure delay elapses.
    mutations.push({
      stage: 'resolved',
      atMs: def.timing.classifyMs + def.timing.actMs + def.timing.closureMs,
      kind: 'mark-complete',
      patch: { status: 'event_neutralized', missionStatus: 'complete' },
    });
  } else if (def.act === 'dismiss') {
    mutations.push({
      stage: 'resolved',
      atMs: def.timing.classifyMs + def.timing.actMs + def.timing.closureMs,
      kind: 'mark-complete',
      patch: { status: 'event_resolved' },
    });
  }

  return { initial, mutations, kinematics };
}
