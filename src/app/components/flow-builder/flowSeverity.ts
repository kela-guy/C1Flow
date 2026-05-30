/**
 * Flow Builder — severity trajectory helper.
 *
 * Walks a compiled flow's mutations, applying each patch onto a running
 * Detection snapshot, and records the severity `resolveTargetSeverity`
 * yields at the end of each playback stage. Shared by the Flow Builder
 * panel (trajectory chip row) and the Simulations panel (peak-severity
 * dot on a saved-flow card) so both read identical numbers.
 *
 * Pure module — no clock dependency beyond the `Date.now()` seed passed
 * to `compileFlow`, which only stamps timestamps the severity model
 * ignores.
 */

import type { Detection } from '@/imports/ListOfSystems';
import { resolveTargetSeverity, type Severity } from '@/primitives/urgency';
import { compileFlow, type FlowDef } from '@/lib/flowBuilder';
import type { FlowPlaybackStage } from './useFlowPlayer';

export interface StageSeverity {
  stage: FlowPlaybackStage;
  severity: Severity;
}

const SEVERITY_RANK: Record<Severity, number> = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
  CRITICAL: 3,
};

export function computeSeverityTrajectory(draft: FlowDef): StageSeverity[] {
  const { initial, mutations } = compileFlow(draft, Date.now(), '');
  const seen: StageSeverity[] = [];

  let snapshot: Detection = { ...initial };
  const stagesHit = new Set<FlowPlaybackStage>();
  seen.push({ stage: 'detection', severity: resolveTargetSeverity(snapshot) });
  stagesHit.add('detection');

  for (const m of mutations) {
    if (m.kind === 'patch' || m.kind === 'mark-complete') {
      snapshot = { ...snapshot, ...(m.patch ?? {}) };
    } else if (m.kind === 'invoke-act') {
      // Approximate the side effect the production handler would have on
      // the Detection so the trajectory matches playback. We don't run
      // the real handler here, but the urgency-relevant fields are well
      // known per act kind.
      if (m.act === 'jam') {
        snapshot = { ...snapshot, mitigationStatus: 'mitigating' };
      } else if (m.act === 'weapon') {
        snapshot = { ...snapshot, weaponPointingStatus: 'locked' };
      } else if (m.act === 'dismiss') {
        snapshot = { ...snapshot, status: 'event_resolved' };
      }
    }
    if (!stagesHit.has(m.stage)) {
      seen.push({ stage: m.stage, severity: resolveTargetSeverity(snapshot) });
      stagesHit.add(m.stage);
    } else {
      const idx = seen.findIndex((s) => s.stage === m.stage);
      if (idx >= 0) seen[idx] = { stage: m.stage, severity: resolveTargetSeverity(snapshot) };
    }
  }
  return seen;
}

/** Highest severity tier the flow reaches across its whole trajectory. */
export function peakSeverity(draft: FlowDef): Severity {
  const traj = computeSeverityTrajectory(draft);
  let peak: Severity = 'LOW';
  for (const it of traj) {
    if (SEVERITY_RANK[it.severity] > SEVERITY_RANK[peak]) peak = it.severity;
  }
  return peak;
}

/**
 * The severity a flow settles at the moment of classification — the
 * affiliation's *verdict* tier, before any effector engagement spikes it.
 *
 * Why this and not `peakSeverity` for the affiliation branch picker: the
 * Act stage always engages an effector (jam -> `mitigating`, weapon ->
 * `locked`), which `resolveTargetSeverity` reads as CRITICAL regardless
 * of affiliation. So the *peak* is identical (CRITICAL) for every branch
 * and can't communicate the choice. The classification verdict is the
 * value that actually colors the marker ring on the map once the camera
 * reveals the entity, so it's the honest thing to preview per branch.
 */
export function classificationSeverity(draft: FlowDef): Severity {
  const traj = computeSeverityTrajectory(draft);
  const investigation = traj.find((s) => s.stage === 'investigation');
  return investigation?.severity ?? traj[traj.length - 1]?.severity ?? 'LOW';
}

/**
 * The set of playback stages a flow actually reaches. Detection +
 * Investigation always run; Act + Resolved only run for non-`manual`
 * acts (a `manual` flow hands control to the operator after
 * Investigation). Drives the "skipped stage" placeholders in the rail.
 */
export function reachedStages(draft: FlowDef): Set<FlowPlaybackStage> {
  const set = new Set<FlowPlaybackStage>(['detection', 'investigation']);
  if (draft.act !== 'manual') {
    set.add('act');
    set.add('resolved');
  }
  return set;
}

/**
 * Estimated wall-clock duration of an auto playback, in ms, after
 * speed scaling. Manual flows stop after Investigation, so only the
 * classify delay counts. Returns the *pre-scale* total for manual mode
 * (speed is irrelevant there).
 */
export function estimateFlowDurationMs(draft: FlowDef): number {
  const { classifyMs, actMs, closureMs } = draft.timing;
  const totalPreScale =
    draft.act === 'manual' ? classifyMs : classifyMs + actMs + closureMs;
  if (draft.playback.mode !== 'auto') return totalPreScale;
  const speed = draft.playback.speed > 0 ? draft.playback.speed : 1;
  return totalPreScale / speed;
}
