/**
 * Simulations — inline-START docked panel.
 *
 * The run gallery for the Flow Builder. Replaces the old CUAS dropdown
 * with a card list grouped into:
 *   1. Built-in scenarios (the existing single / full / swarm injectors).
 *   2. Saved flows (one card per persisted `FlowDef`), with run / edit /
 *      delete affordances.
 *
 * Docks on the inline-START edge in the same mutual-exclusion group as
 * the queue + devices panels (mirrors `DevicesPanelImpl`), so launching
 * a simulation naturally "switches to the target panel."
 *
 * NOT a styleguide entry — single-purpose PM tool. All copy via the
 * `flowBuilder.simulations` strings namespace; all colors/typography via
 * Tailwind; logical direction-aware classes for RTL/LTR.
 */

import { useState } from 'react';
import { Play, Pencil, Trash2, Target, Radar } from '@/lib/icons/central';
import { CuasIcon } from '@/primitives/ProductIcons';
import { DroneCardIcon, CarCardIcon, TankCardIcon, TruckCardIcon } from '@/primitives';
import { Bird } from '@/lib/icons/central';
import { useStrings } from '@/lib/intl';
import { DockedPanel } from '@/app/components/DockedPanel';
import type { FlowDef, FlowEntity } from '@/lib/flowBuilder';
import { peakSeverity } from '@/app/components/flow-builder/flowSeverity';
import { SEVERITY_TW } from '@/app/components/flow-builder/severityTokens';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/app/components/ui/alert-dialog';

// Shared type-scale + surface tokens (kept in step with FlowBuilderPanel,
// Heebo-only, no mono/uppercase/tracking — Hebrew is the source language).
const TYPE_GROUP_TITLE = 'text-[11px] font-semibold text-zinc-400';
const TYPE_CARD_TITLE = 'text-sm font-semibold text-zinc-100';
const TYPE_CARD_DESC = 'text-[11px] text-zinc-400 leading-snug';

type EntityGlyph = (props: { size?: number }) => React.ReactNode;
const ENTITY_GLYPH: Record<FlowEntity, EntityGlyph> = {
  drone: DroneCardIcon,
  car: CarCardIcon,
  tank: TankCardIcon,
  truck: TruckCardIcon,
  bird: (p) => <Bird size={p.size ?? 16} />,
};

export type BuiltinKind = 'single' | 'flow' | 'swarm';

export interface SimulationsPanelProps {
  open: boolean;
  onClose: () => void;
  width?: number;
  noTransition?: boolean;
  presets: FlowDef[];
  onRunBuiltin: (kind: BuiltinKind) => void;
  onRunFlow: (def: FlowDef) => void;
  onEditFlow: (def: FlowDef) => void;
  onDeleteFlow: (def: FlowDef) => void;
}

export function SimulationsPanel({
  open,
  onClose,
  width,
  noTransition,
  presets,
  onRunBuiltin,
  onRunFlow,
  onEditFlow,
  onDeleteFlow,
}: SimulationsPanelProps) {
  const tAll = useStrings();
  const t = tAll.flowBuilder;
  const s = t.simulations;

  // Single shared confirm dialog, keyed to the flow pending deletion.
  const [pendingDelete, setPendingDelete] = useState<FlowDef | null>(null);

  const builtins: { kind: BuiltinKind; title: string; desc: string; icon: React.ReactNode }[] = [
    { kind: 'single', title: s.builtin.singleTitle, desc: s.builtin.singleDesc, icon: <Target size={18} /> },
    { kind: 'flow', title: s.builtin.flowTitle, desc: s.builtin.flowDesc, icon: <CuasIcon size={18} strokeWidth={1.5} /> },
    { kind: 'swarm', title: s.builtin.swarmTitle, desc: s.builtin.swarmDesc, icon: <Radar size={18} /> },
  ];

  return (
    <DockedPanel
      open={open}
      onClose={onClose}
      side="start"
      width={width}
      noTransition={noTransition}
      dataHandoff="simulations-panel"
      title={<h2 className="text-sm font-semibold truncate">{s.title}</h2>}
      closeAriaLabel={s.close}
      bodyClassName="px-4 py-3 space-y-5"
    >
      {/* ── Built-in scenarios ───────────────────────────────────── */}
      <>
        <section className="space-y-2">
          <h3 className={TYPE_GROUP_TITLE}>{s.builtinGroup}</h3>
          <div className="space-y-2">
            {builtins.map((b) => (
              <button
                key={b.kind}
                type="button"
                onClick={() => onRunBuiltin(b.kind)}
                className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-start transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25"
              >
                <span className="shrink-0 grid place-items-center size-9 rounded-md bg-white/[0.06] text-zinc-300" aria-hidden>
                  {b.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block truncate ${TYPE_CARD_TITLE}`}>{b.title}</span>
                  <span className={`block ${TYPE_CARD_DESC}`}>{b.desc}</span>
                </span>
                <span className="shrink-0 grid place-items-center size-7 rounded-md text-zinc-400 group-hover:text-white" aria-hidden>
                  <Play size={14} />
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* ── Saved flows ──────────────────────────────────────────── */}
        <section className="space-y-2">
          <h3 className={TYPE_GROUP_TITLE}>{s.savedGroup}</h3>
          {presets.length === 0 ? (
            <p className="text-[11px] text-zinc-500 leading-snug">{s.emptySaved}</p>
          ) : (
            <div className="space-y-2">
              {presets.map((def) => (
                <SavedFlowCard
                  key={def.id}
                  def={def}
                  entityLabel={t.entities[def.entity]}
                  affiliationLabel={t.affiliations[def.affiliation]}
                  actLabel={t.acts[def.act]}
                  sensorsLabel={s.sensorsCount(def.sensorIds.length)}
                  runLabel={s.run}
                  editLabel={s.edit}
                  deleteLabel={s.delete}
                  onRun={() => onRunFlow(def)}
                  onEdit={() => onEditFlow(def)}
                  onDelete={() => setPendingDelete(def)}
                />
              ))}
            </div>
          )}
        </section>
      </>

      {/* ── Delete confirmation ──────────────────────────────────────── */}
      <AlertDialog open={pendingDelete !== null} onOpenChange={(o: boolean) => !o && setPendingDelete(null)}>
        <AlertDialogContent className="border-white/10 bg-zinc-950 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>{s.deleteConfirm.title}</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              {pendingDelete ? s.deleteConfirm.description(pendingDelete.name) : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 bg-transparent text-zinc-200 hover:bg-white/10">
              {s.deleteConfirm.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-500"
              onClick={() => {
                if (pendingDelete) onDeleteFlow(pendingDelete);
                setPendingDelete(null);
              }}
            >
              {s.deleteConfirm.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DockedPanel>
  );
}

function SavedFlowCard({
  def,
  entityLabel,
  affiliationLabel,
  actLabel,
  sensorsLabel,
  runLabel,
  editLabel,
  deleteLabel,
  onRun,
  onEdit,
  onDelete,
}: {
  def: FlowDef;
  entityLabel: string;
  affiliationLabel: string;
  actLabel: string;
  sensorsLabel: string;
  runLabel: string;
  editLabel: string;
  deleteLabel: string;
  onRun: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const Glyph = ENTITY_GLYPH[def.entity];
  const sev = peakSeverity(def);
  const tw = SEVERITY_TW[sev];
  const summary = `${entityLabel} · ${affiliationLabel} · ${sensorsLabel} · ${actLabel}`;

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] overflow-hidden">
      {/* Run is the primary affordance on the card body. */}
      <button
        type="button"
        onClick={onRun}
        className="group w-full flex items-center gap-3 px-3 py-2.5 text-start hover:bg-white/[0.04] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/25"
        aria-label={`${runLabel}: ${def.name}`}
      >
        <span className="relative shrink-0 grid place-items-center size-9 rounded-md bg-white/[0.06] text-zinc-200" aria-hidden>
          {Glyph({ size: 18 })}
          <span className={`absolute -top-0.5 -end-0.5 size-2 rounded-full ring-2 ring-zinc-900 ${tw.bg}`} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-zinc-100">{def.name}</span>
          <span className="block truncate text-[11px] text-zinc-400">{summary}</span>
        </span>
        <span className="shrink-0 grid place-items-center size-7 rounded-md text-zinc-400 group-hover:text-white" aria-hidden>
          <Play size={14} />
        </span>
      </button>

      {/* Secondary row: edit + delete. */}
      <div className="flex items-stretch border-t border-white/10 divide-x divide-white/10 rtl:divide-x-reverse">
        <button
          type="button"
          onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-medium text-zinc-300 hover:bg-white/[0.06] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/25"
        >
          <Pencil size={12} />
          <span>{editLabel}</span>
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-medium text-red-300/80 hover:bg-red-500/10 hover:text-red-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/25"
        >
          <Trash2 size={12} />
          <span>{deleteLabel}</span>
        </button>
      </div>
    </div>
  );
}
