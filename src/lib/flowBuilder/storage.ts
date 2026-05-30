/**
 * Flow Builder — persistence + export/import.
 *
 * Follows the codebase's existing `c2hub.*` localStorage convention
 * (see [DirectionProvider](../direction/DirectionProvider.tsx) and
 * [perf/flags](../perf/flags.ts)):
 *   - Single namespaced key.
 *   - JSON value with a top-level `version` envelope.
 *   - try / catch around every read and write so private mode,
 *     blocked storage, or quota exceptions degrade gracefully — the
 *     panel still works, presets just don't persist.
 *
 * Export / import mirror the perf-trace pattern in
 * [perf/trace.ts](../perf/trace.ts): build a `Blob`, trigger a
 * transient `<a download>`, revoke the object URL after the click.
 * No new dependencies.
 */

import {
  FLOW_PRESET_STORAGE_KEY,
  type FlowDef,
  type FlowPlaybackSpeed,
  type FlowPresetBundle,
} from './types';

const VALID_SPEEDS: FlowPlaybackSpeed[] = [0.5, 1, 2, 4];

/**
 * Coerce a preset's playback speed into the supported set. Legacy or
 * hand-edited JSON might carry an out-of-range speed (or the old
 * `1 | 2` union); anything we don't recognise snaps back to 1× so the
 * player never schedules against a bad multiplier.
 */
function normalizeFlowDef(def: FlowDef): FlowDef {
  if (def.playback.mode !== 'auto') return def;
  if ((VALID_SPEEDS as number[]).includes(def.playback.speed)) return def;
  return { ...def, playback: { mode: 'auto', speed: 1 } };
}

/**
 * Defensive shape check. We can't fully validate `FlowDef` at runtime
 * without a schema lib, but we can catch the cases that would crash
 * the player (missing required fields, wrong version). Anything that
 * passes here is good enough to compile — the panel re-validates on
 * load and surfaces a clear error if the preset is malformed.
 */
function isFlowDef(value: unknown): value is FlowDef {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<FlowDef>;
  return (
    typeof v.id === 'string' &&
    typeof v.name === 'string' &&
    v.version === 1 &&
    typeof v.entity === 'string' &&
    typeof v.affiliation === 'string' &&
    Array.isArray(v.sensorIds) &&
    !!v.location &&
    !!v.timing &&
    !!v.playback &&
    typeof v.act === 'string'
  );
}

function isBundle(value: unknown): value is FlowPresetBundle {
  if (!value || typeof value !== 'object') return false;
  const b = value as Partial<FlowPresetBundle>;
  return b.version === 1 && Array.isArray(b.presets) && b.presets.every(isFlowDef);
}

/**
 * Read all saved presets. Returns an empty array on any failure
 * (storage disabled, corrupted JSON, version mismatch) — the caller
 * cannot distinguish "no presets yet" from "couldn't read," which is
 * the right UX: in both cases the panel shows the empty state.
 */
export function readFlowPresets(): FlowDef[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(FLOW_PRESET_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!isBundle(parsed)) return [];
    return parsed.presets.map(normalizeFlowDef);
  } catch {
    return [];
  }
}

/**
 * Replace the stored preset list. The caller owns ordering — we don't
 * sort here so the panel can present "most recently edited first" or
 * any other order without fighting the storage layer. Failures are
 * swallowed (see `readFlowPresets` rationale).
 */
export function writeFlowPresets(presets: FlowDef[]): void {
  if (typeof window === 'undefined') return;
  const bundle: FlowPresetBundle = { version: 1, presets };
  try {
    window.localStorage.setItem(FLOW_PRESET_STORAGE_KEY, JSON.stringify(bundle));
  } catch {
    /* private mode, quota, etc. — non-fatal. */
  }
}

/** Convenience: replace a single preset by id, inserting if new. */
export function upsertFlowPreset(preset: FlowDef): FlowDef[] {
  const all = readFlowPresets();
  const idx = all.findIndex((p) => p.id === preset.id);
  const next = idx >= 0
    ? [...all.slice(0, idx), preset, ...all.slice(idx + 1)]
    : [preset, ...all];
  writeFlowPresets(next);
  return next;
}

export function deleteFlowPreset(id: string): FlowDef[] {
  const next = readFlowPresets().filter((p) => p.id !== id);
  writeFlowPresets(next);
  return next;
}

/**
 * Download a preset as JSON. Sanitizes the filename so it's safe on
 * Windows/macOS (no slashes, colons, etc.) and falls back to the id
 * if the name is empty after sanitization.
 */
export function exportFlow(def: FlowDef): void {
  if (typeof document === 'undefined') return;
  const json = JSON.stringify(def, null, 2);
  const safeName = (def.name || def.id).replace(/[^a-z0-9-_]+/gi, '-').toLowerCase() || def.id;
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `flow-${safeName}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Parse a single-preset JSON file. Returns `null` if the file isn't a
 * valid `FlowDef` (wrong version, missing fields, malformed JSON) so
 * the caller can show a clean error toast without try/catch noise at
 * the call site.
 */
export async function importFlowFromFile(file: File): Promise<FlowDef | null> {
  try {
    const text = await file.text();
    const parsed: unknown = JSON.parse(text);
    return isFlowDef(parsed) ? normalizeFlowDef(parsed) : null;
  } catch {
    return null;
  }
}
