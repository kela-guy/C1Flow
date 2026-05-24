/**
 * Public surface of the Gridblock shell.
 *
 * Pages compose `GridblockShell` with the rail, panel, header,
 * and footer primitives below. Domain rendering (target lists,
 * camera feeds, devices) lives in the page that mounts the shell,
 * NOT inside this folder — the shell stays content-agnostic.
 */

export { C2AppShell } from "./C2AppShell";
export type {
  C2AppShellTab,
  C2AppShellLabels,
  C2AppShellProps,
} from "./C2AppShell";
export { GridblockShell } from "./GridblockShell";
export type { GridblockHeaderLabels } from "./GridblockHeader";
export { GridblockHeader } from "./GridblockHeader";
export {
  GridblockFooter,
  type ScrubberMarker,
  type ScrubberSpan,
} from "./GridblockFooter";
export { GridblockLeftRail } from "./GridblockLeftRail";
export { GridblockRightRail } from "./GridblockRightRail";
export { GridblockRailButton } from "./GridblockRailButton";
export { GridblockPanel } from "./GridblockPanel";
export { GridblockPanelRow } from "./GridblockPanelRow";
export {
  formatGridblockClock,
  formatGridblockShortClock,
  formatGridblockTickLabel,
  tzSuffix,
  useGridblockClock,
  UTC_TZ,
} from "./useGridblockClock";
export type {
  GridblockRailTab,
  GridblockSceneMode,
  GridblockCameraState,
  GridblockCursorPos,
  GridblockCameraCommands,
} from "./types";
