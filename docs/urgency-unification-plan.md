# Unified Urgency for Card + Map Marker — Execution Plan

> Goal: card and map marker speak the same urgency language at a glance, so an operator never has to translate between two color systems.

## Context

### Problem
Urgency color is fragmented across the dashboard today:
- `TargetCard` accepts an `accent` prop (8 lifecycle values) but the spine is **not** rendered. The accent has no visual effect.
- `MapMarker` has its own `InteractionState` enum (10 values) that mixes urgency (`alert`, `weaponLocked`) with interaction (`hovered`, `selected`) with lifecycle (`expired`, `disabled`).
- `StatusChip` colors come from `getActivityStatus()`, a third independent mapping.

The result: an operator scanning the queue and the map sees red/orange/green in multiple places, but those colors do not always mean the same thing.

### Anchor — Target Triage Agent PRD
The [Target Triage Agent PRD](https://www.notion.so/2f621c5d54d08003a216faec74af91ce) introduces a per-target `severity` field on `TrackEnrichment` with four values: **LOW · MEDIUM · HIGH · CRITICAL**. The PRD specifies:

- Target queue sorts live by severity (CRITICAL → HIGH → MEDIUM → LOW), newest within tier.
- The card already displays severity as a chip — the chip is the operator's primary urgency cue per the PRD.
- A pinned/open card stays put even when its severity changes.

This is our forcing function: the visual urgency system must be expressible in those four tiers, and the card + marker must agree.

## Guiding Principles

1. **Urgency owns one color** across surfaces. One function, two consumers.
2. **Four tiers, PRD-aligned**: `LOW · MEDIUM · HIGH · CRITICAL`. No three-tier UI abstraction.
3. **Interaction stays neutral.** Hover and selected become white/dim overlays, never red/orange. Today the marker's `selected` state mutates the ring color — that is part of the problem.
4. **Affiliation ≠ urgency.** Hostile/possibleThreat color the glyph (identity). Urgency colors the ring/spine (severity). They are allowed to disagree (e.g. hostile + mitigated = hostile glyph, gray ring).
5. **Completed states are a modifier, not a fifth color.** Resolved/expired/dismissed desaturate, they do not get their own hue.

## Phased Execution

### Phase 1 — Bake the urgency model (logic only)

**Goal:** one pure function each surface can consume. Zero visual changes.

**Deliverables:**
- `src/primitives/urgency.ts`
  - `export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'`
  - `export function resolveTargetSeverity(target: Detection): Severity`
  - `export const SEVERITY_ORDER` and `export const SEVERITY_LABEL` for UI consumption
  - Folds in: future PRD `severity` (when present), `mitigationStatus`, `weaponPointingStatus`, lifecycle `status`, `entityStage`, `alarmZone`, `affiliation`, `classifiedType`, `bdaStatus`, `dismissReason`.
- **No changes** to `TargetCard`, `MapMarker`, `useCardSlots`, `markerStyles`, or any caller.

> No unit spec file — this repo has no test runner. Instead, Phase 2's review page renders `resolveTargetSeverity(target)` next to every variant, so the mapping is live-verifiable by inspection (tighter feedback than a static spec).

**Exit criteria:**
- Function returns exactly one severity for every `Detection` we construct today.
- Card + marker render identically to before this phase.

### Phase 2 — `/urgency-review` page (UI Craft–compliant)

**Goal:** a clean, dedicated review surface showing every relevant TargetCard + MapMarker variant. Reviewer scans, reacts, drives Phase 3 decisions.

**Route:** `/urgency-review` (added to `src/app/App.tsx`).

**Layout:**
- Tabbed: **Cards** | **Markers**.
- No dashboard chrome (sidebar, header, breadcrumbs).
- Dark plate (same `SURFACE.level0/1` tokens the dashboard uses).
- Each variant labeled with: the state it represents + the `Severity` returned by `resolveTargetSeverity` (proves Phase 1 works end-to-end).

**Cards tab — variants:**
1. CRITICAL — classified hostile drone, active detection
2. HIGH — tracking hostile drone
3. MEDIUM — suspicion
4. LOW — raw_detection
5. Mitigating — `mitigationStatus: 'mitigating'`
6. Mitigated — `mitigationStatus: 'mitigated'`
7. Weapon pointing — `weaponPointingStatus: 'pointing'`
8. Weapon locked — `weaponPointingStatus: 'locked'`
9. Resolved — `status: 'event_resolved'`
10. Expired — `status: 'expired'`

**Markers tab — variants:**
- Severity tiers × {hostile, possibleThreat} affiliations
- Tactical states: alert, jammer, weaponPointing, weaponLocked
- Completed states: disabled, expired

### UI Craft contract for the page

The page itself must clear the UI Craft bar — otherwise we are reviewing components on a generic AI-looking surface, which contaminates judgment.

**Intent (answered before code):**
- **Who** — design reviewers scanning component states to decide unified urgency treatment.
- **What** — see every TargetCard + MapMarker variant in one place, labeled with its severity, react.
- **Feel** — quietly tactical. The page recedes; the components carry all the signal.

**Direction:**
- **Surface system** — reuse the dashboard's existing `SURFACE` tokens (`level0`–`level4` from `src/primitives/tokens.ts`). Part of the same product, not a separate styleguide aesthetic.
- **Depth strategy** — borders-only on page chrome. Only the reviewed components carry depth.
- **Color** — page chrome is monochrome neutral. *Only the components inside show color.*
- **Typography** — existing app stack. Mono for state labels (telemetry language).
- **One accent** — white-at-low-opacity for active tab. No purple, no brand color, no gradient.
- **Signature** — tactical mono-caps state-label header pattern, `tabular-nums` for any counts, hairline rule below. Same language the dashboard already speaks.

**Craft checklist (baked into the build, not bolted on after):**
- Concentric radii: variant card padding + inner radius compose cleanly with `TargetCard`'s 8px radius.
- All interaction states on tabs and variant chrome (default/hover/active/focus/disabled).
- All data states accounted for; "empty" = a labeled placeholder when a variant lacks fixture data.
- Layered transparent `box-shadow`, never solid borders, on any elevated chrome.
- `prefers-reduced-motion` honored on tab transitions.
- No `transition: all` — explicit properties only.
- Tab switching animates `opacity` + small `transform`, never layout properties.

**Rejecting (default outputs to avoid):**
- shadcn-style card grid with rounded corners and soft shadows → would feel like a generic component playground.
- Gradient header with bright accent label → introduces color that competes with the components.
- Full-bleed dashboard chrome → reviewer is here to look at components, not navigate.

**Validation gates before showing the page:**
- **Swap test** — could the chrome be reused for a different review (e.g. icons)? If yes, it is too generic.
- **Squint test** — when blurred, severity tiers should still read as a clear progression CRITICAL → LOW.
- **Token test** — read the tokens used. Should be zinc/white/`SURFACE.*` — should *not* be `--gray-700` or any unscoped neutral.

### Phase 3 — Unified color tokens *(locked after review)*

**Palette (reviewed against `/urgency-review`):**

| Tier | Hex | Source | Treatment |
| --- | --- | --- | --- |
| CRITICAL | `#ff3d40` | hostile glyph red (existing tactical palette) | Icon + icon-surface red @ 0.20 opacity. Marker ring red, **pulsing**. |
| HIGH | `#ff3d40` | same as CRITICAL | Icon + icon-surface red @ 0.14 opacity. Marker ring red, **static**. |
| MEDIUM | `#ff9e3d` | possibleThreat glyph orange (existing tactical palette) | Icon + icon-surface orange @ 0.14 opacity. Marker ring orange, static. |
| LOW | `#71717a` | zinc-500 (existing neutral) | Icon glyph zinc. Icon-surface falls through to default card surface (no tint). Marker ring gray, static. |

**CRITICAL ↔ HIGH differentiator:**
- **Motion** (`SEVERITY_PULSE`) — CRITICAL pulses, HIGH does not. Same convention the marker already uses for `alert` vs `default`.
- **Icon-surface opacity** — CRITICAL `0.20`, HIGH `0.14`. Subtle on the card side, decisive on the marker side via the pulse.
- No hue split between CRITICAL and HIGH — operator-facing meaning is the same ("attend now"); intensity carries the priority.

**Tokens (shipped in `src/primitives/urgency.ts`):**
- `SEVERITY_COLOR: Record<Severity, string>` — single source for ring + icon-bg + spine.
- `SEVERITY_SURFACE_OPACITY: Record<Severity, number>` — icon-surface alpha per tier.
- `SEVERITY_PULSE: Record<Severity, boolean>` — marker-ring pulse flag.

**Affiliation handling:** affiliation no longer colors the card icon-surface. It will color the **glyph** (small IFF chip or marker-glyph fill) in Phase 4 / 5. The review page intentionally drops `affiliation` from `CardHeader` so severity owns the surface.

**One additive API touch:** `CardHeader` gained an optional `iconBgColor?: string` prop so a caller can drive the icon-surface from severity (used by the review page now, used by `useCardSlots` in Phase 4). Existing callers are unchanged.

### Phase 4 — Wire urgency into TargetCard *(landed)*

- **The card's urgency channel is the header icon** — glyph color + icon-surface
  tint, both from severity. There is **no spine / left border**. (An earlier
  iteration rendered a 3px spine; removed per review — it was redundant noise
  next to the colored icon.) `TargetCard` still accepts `severity`/`accent`
  props for API compatibility but renders no urgency chrome of its own.
- `useCardSlots` computes `severity = resolveTargetSeverity(target)` and exposes
  it on `CardSlots`. `slots.accent` stays available but is marked deprecated.
- `buildHeader` no longer reads `target.affiliation` for icon coloring. Icon
  glyph + icon-surface come from severity (via `SEVERITY_COLOR` +
  `SEVERITY_SURFACE_OPACITY`). Missions (flow 4) keep their purple identity
  color — they're operator-initiated, not threats.
- **Confidence (`NN%`) pill removed** from the header — it competed with the
  urgency read and isn't part of the at-a-glance scan. Classification
  confidence still lives in the expanded `CardDetails` block.
- **`StatusChip` deliberately left alone.** Per review feedback, the chip
  remains activity-status driven (`getActivityStatus` → Active / Recently
  active / Timed out / Handled / Dismissed). The chip owns "how recent /
  handled"; the icon owns "how urgent". Two orthogonal channels.
- Consumers updated: `ListOfSystems.tsx` (main dashboard), `StyleguidePage.tsx`
  (surfaces severity in the playground table; deprecated `accent` shown
  below it).

### Phase 5 — Wire urgency into MapMarker *(landed)*

- New `TargetMarkerInteraction` type — the subset of `InteractionState`
  that's about *interaction* (`default | hovered | selected | active |
  disabled | expired`). Urgency-flavoured states like `alert` are gone
  from this axis.
- New `resolveTargetMarkerStyle(target, interaction)` in `markerStyles.ts`
  encapsulates two axes:
    1. **Severity** → ring color, ring pulse, ring opacity, ring width,
       **glyph color**, inner-glow color. The marker speaks one urgency
       hue end-to-end. CRITICAL gets a slightly heavier ring as a visual
       parallel of the card's higher icon-surface opacity at that tier.
    2. **Interaction** → inner-glow opacity + surface emphasis. Never
       overrides color.
  Affiliation is still resolved (so the underlying state matrix picks
  the right surface palette) but no longer colors the glyph — identity
  will surface through a separate channel in a later round.
- Lifecycle finality (`expired` / `disabled`) still wins — those markers
  desaturate wholesale, severity collapses to the gray treatment.
- `resolveMarkerStyle` is untouched; effectors, sensors, drones, launchers,
  jammers — all friendly-asset markers — continue to use the existing API.
  Only the **target** call sites in `TacticalMap.tsx` and
  `CesiumTacticalMap.tsx` migrated to `resolveTargetMarkerStyle`.
- `detectionInteractionState` in `CesiumTacticalMap.tsx` updated to
  return `TargetMarkerInteraction` (no more `alert`).

### Phase 6 — Validate handshake *(landed)*

- New **Handshake** tab is now the default view on `/urgency-review`.
  Each row is one Detection that fans out to *both* a `TargetCard`
  (via the production `useCardSlots` path) and a `MapMarker` (via the
  production `resolveTargetMarkerStyle` path). If colors disagree per
  row, the unification is broken.
- `Cards` and `Markers` tabs remain for deep-dive per surface.
- The handshake row surfaces a warning if `resolveTargetSeverity(target)`
  disagrees with the variant's declared tier — keeps the page honest
  if the Phase 1 logic drifts later.

**Live-dashboard validation:** open `/` and trigger lifecycle transitions
(raw → classified → mitigating → resolved). Card icon (glyph + surface) +
marker ring/glyph should change in lockstep, both reading the new severity
at each step.

## Out of Scope (this round)

- Wiring the actual Triage Agent `TrackEnrichment.severity` into `Detection` — that is upstream of this work.
- Changing target queue sort logic (already severity-aware via `getEffectivePriority`).
- Re-skinning unrelated components (notification toasts, device cards, etc.).
- Localization of new tier labels — existing strings catalog handles labels; we only add the new ones if Phase 4 introduces them.

## File Inventory

**New:**
- `docs/urgency-unification-plan.md` (this file)
- `src/primitives/urgency.ts`
- `src/app/components/UrgencyReviewPage.tsx`

**Modified (across all phases):**
- `src/app/App.tsx` — `/urgency-review` route.
- `src/primitives/CardHeader.tsx` — additive `iconBgColor?: string` prop.
- `src/primitives/TargetCard.tsx` — accepts `severity` prop (no spine; urgency
  lives on the header icon). Confidence pill removed via `useCardSlots`.
- `src/primitives/markerStyles.ts` — new `TargetMarkerInteraction` type and
  `resolveTargetMarkerStyle` helper.
- `src/primitives/urgency.ts` — Phase 1 ordering fix (raw_detection /
  suspicion → MEDIUM is now reachable before `status === 'detection'` lifts
  to HIGH).
- `src/primitives/index.ts` — export severity tokens + new marker helper.
- `src/imports/useCardSlots.ts` — computes severity, drives header from it,
  exposes `slots.severity`.
- `src/imports/ListOfSystems.tsx` — passes `severity` to `TargetCard`.
- `src/app/components/TacticalMap.tsx` — target markers use
  `resolveTargetMarkerStyle`.
- `src/app/components/CesiumTacticalMap.tsx` — target markers use
  `resolveTargetMarkerStyle`; `detectionInteractionState` returns
  `TargetMarkerInteraction`.
- `src/app/components/StyleguidePage.tsx` — passes `severity` to
  `TargetCard`; playground table surfaces severity (accent listed as
  deprecated below it).
- `src/app/components/UrgencyReviewPage.tsx` — Handshake tab now the
  default; Cards / Markers tabs remain for deep-dive.

**Deliberately not changed:**
- `StatusChip` derivation — chip stays lifecycle-driven per review feedback.
- `resolveMarkerStyle` — preserved for all friendly-asset markers (sensors,
  effectors, drones, launchers, jammers).
- `AFFILIATION_PALETTES` — preserved as raw data, but no longer drives the
  glyph color on target markers (severity does). Friendly-asset markers
  still read from it via `resolveMarkerStyle`.

## Decisions Locked

| Question | Decision |
| --- | --- |
| Tier count | 4 — match PRD exactly |
| Scope this round | Phases 1 + 2 + 3 |
| Layout for review page | Tabs (Cards / Markers) |
| Variants on review page | Severity tiers + completed states + key tactical states |
| Sandbox approach | Build a dedicated clean review route, not a comparison sheet |
| Build standard | UI Craft contract above |
| Palette source | Existing tactical palette — hostile red, possibleThreat orange, zinc gray |
| CRITICAL vs HIGH | Same red; CRITICAL pulses + higher icon-bg opacity; HIGH static |
| Affiliation role | Drops out of icon-surface; will color glyph only in Phase 4 / 5 |
