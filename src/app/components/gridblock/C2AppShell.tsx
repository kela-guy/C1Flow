import {
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { useStrings } from "@/lib/intl";
import {
  useGridblockPanelSizes,
  PANEL_WIDTH_END_MAX_PX,
} from "@/app/hooks/useGridblockPanelSizes";

import { GridblockShell } from "./GridblockShell";
import { GridblockHeader } from "./GridblockHeader";
import { GridblockLeftRail } from "./GridblockLeftRail";
import { GridblockRightRail } from "./GridblockRightRail";
import { GridblockPanel } from "./GridblockPanel";
import type { GridblockRailTab } from "./types";

export interface C2AppShellTab<Id extends string = string> {
  id: Id;
  label: string;
  icon: ReactNode;
  panel: ReactNode;
  toolbar?: ReactNode;
  headerActions?: ReactNode;
  footer?: ReactNode;
  testId?: string;
}

export interface C2AppShellLabels {
  settings?: string;
  startRail?: string;
  endRail?: string;
  resizePanel?: string;
  closePanel?: string;
  closeTooltip?: string;
}

export interface C2AppShellProps<
  L extends string = string,
  R extends string = string,
> {
  main: ReactNode;
  leftTabs?: ReadonlyArray<C2AppShellTab<L>>;
  rightTabs?: ReadonlyArray<C2AppShellTab<R>>;
  brand?: ReactNode;
  headerCenterSlot?: ReactNode;
  startRailBottomSlot?: ReactNode;
  labels?: C2AppShellLabels;
  leftTab?: L | null;
  rightTab?: R | null;
  defaultLeftTab?: L | null;
  defaultRightTab?: R | null;
  onLeftTabChange?: (tab: L | null) => void;
  onRightTabChange?: (tab: R | null) => void;
  endPanelMaxPx?: number;
  resizable?: boolean;
}

function useAppShellLabels(override?: C2AppShellLabels) {
  const t = useStrings();
  return useMemo(
    () => ({
      settings: override?.settings ?? t.gridblock.settings,
      startRail: override?.startRail ?? t.gridblock.startRail,
      endRail: override?.endRail ?? t.gridblock.endRail,
      resizePanel: override?.resizePanel ?? t.gridblock.resizePanel,
      closePanel: override?.closePanel ?? t.gridblock.closePanel,
      closeTooltip:
        override?.closeTooltip ?? t.gridblock.closeTooltip,
    }),
    [override, t.gridblock],
  );
}

function toRailTabs<Id extends string>(
  tabs: ReadonlyArray<C2AppShellTab<Id>> | undefined,
): ReadonlyArray<GridblockRailTab<Id>> {
  return (tabs ?? []).map((tab) => ({
    id: tab.id,
    label: tab.label,
    icon: tab.icon,
  }));
}

function findTab<Id extends string>(
  tabs: ReadonlyArray<C2AppShellTab<Id>> | undefined,
  id: Id | null,
): C2AppShellTab<Id> | undefined {
  if (id == null || !tabs?.length) return undefined;
  return tabs.find((tab) => tab.id === id);
}

export function C2AppShell<L extends string = string, R extends string = string>({
  main,
  leftTabs,
  rightTabs,
  brand,
  headerCenterSlot,
  startRailBottomSlot,
  labels: labelsOverride,
  leftTab: leftTabControlled,
  rightTab: rightTabControlled,
  defaultLeftTab = null,
  defaultRightTab = null,
  onLeftTabChange,
  onRightTabChange,
  endPanelMaxPx = PANEL_WIDTH_END_MAX_PX,
  resizable = true,
}: C2AppShellProps<L, R>) {
  const labels = useAppShellLabels(labelsOverride);
  const panelSizes = useGridblockPanelSizes();

  const [leftTabInternal, setLeftTabInternal] = useState<L | null>(
    defaultLeftTab,
  );
  const [rightTabInternal, setRightTabInternal] = useState<R | null>(
    defaultRightTab,
  );

  const leftTab =
    leftTabControlled !== undefined ? leftTabControlled : leftTabInternal;
  const rightTab =
    rightTabControlled !== undefined ? rightTabControlled : rightTabInternal;

  const setLeftTab = useCallback(
    (next: L | null) => {
      if (leftTabControlled === undefined) setLeftTabInternal(next);
      onLeftTabChange?.(next);
    },
    [leftTabControlled, onLeftTabChange],
  );

  const setRightTab = useCallback(
    (next: R | null) => {
      if (rightTabControlled === undefined) setRightTabInternal(next);
      onRightTabChange?.(next);
    },
    [rightTabControlled, onRightTabChange],
  );

  const closeStartPanel = useCallback(() => setLeftTab(null), [setLeftTab]);
  const closeEndPanel = useCallback(() => setRightTab(null), [setRightTab]);

  const leftRailTabs = useMemo(() => toRailTabs(leftTabs), [leftTabs]);
  const rightRailTabs = useMemo(() => toRailTabs(rightTabs), [rightTabs]);

  const activeLeft = findTab(leftTabs, leftTab);
  const activeRight = findTab(rightTabs, rightTab);

  const startPanel = activeLeft ? (
    <GridblockPanel
      title={activeLeft.label}
      onClose={closeStartPanel}
      closeAriaLabel={labels.closePanel}
      closeTooltip={labels.closeTooltip}
      testId={activeLeft.testId ?? `app-shell-panel-${activeLeft.id}`}
      toolbar={activeLeft.toolbar}
      headerActions={activeLeft.headerActions}
      footer={activeLeft.footer}
    >
      {activeLeft.panel}
    </GridblockPanel>
  ) : null;

  const endPanel = activeRight ? (
    <GridblockPanel
      title={activeRight.label}
      onClose={closeEndPanel}
      closeAriaLabel={labels.closePanel}
      closeTooltip={labels.closeTooltip}
      testId={activeRight.testId ?? `app-shell-panel-${activeRight.id}`}
      toolbar={activeRight.toolbar}
      headerActions={activeRight.headerActions}
      footer={activeRight.footer}
    >
      {activeRight.panel}
    </GridblockPanel>
  ) : null;

  return (
    <GridblockShell
      header={
        <GridblockHeader
          brand={brand}
          centerSlot={headerCenterSlot}
          labels={{ settings: labels.settings }}
        />
      }
      startRail={
        <GridblockLeftRail
          tabs={leftRailTabs}
          value={leftTab}
          onChange={setLeftTab}
          ariaLabel={labels.startRail}
          bottomSlot={startRailBottomSlot}
        />
      }
      endRail={
        <GridblockRightRail
          tabs={rightRailTabs}
          value={rightTab}
          onChange={setRightTab}
          ariaLabel={labels.endRail}
        />
      }
      startPanel={startPanel}
      endPanel={endPanel}
      map={main}
      startPanelWidthPx={panelSizes.startPx}
      endPanelWidthPx={panelSizes.endPx}
      onStartPanelResize={resizable ? panelSizes.setStartPx : undefined}
      onEndPanelResize={resizable ? panelSizes.setEndPx : undefined}
      onStartPanelClose={resizable ? closeStartPanel : undefined}
      onEndPanelClose={resizable ? closeEndPanel : undefined}
      endPanelMaxPx={endPanelMaxPx}
      startResizeAriaLabel={labels.resizePanel}
      endResizeAriaLabel={labels.resizePanel}
    />
  );
}
