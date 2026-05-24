import type { RegistryCategory, RegistryLifecycle } from './registryMeta';

export type Category = RegistryCategory;
export type Lifecycle = RegistryLifecycle;

export interface ExampleSpec {
  id: string;
  label: string;
  variant: 'neutral' | 'domain';
}

export type CatalogEntry =
  | {
      kind: 'component';
      navId: string;
      registryName: string;
      lifecycle: Lifecycle;
      category: Category;
      exportName?: string;
      examples?: ExampleSpec[];
    }
  | {
      kind: 'concept';
      navId: string;
      title: string;
      description: string;
    };

const PRIMITIVE_EXAMPLES: ExampleSpec[] = [
  { id: 'neutral', label: 'Neutral', variant: 'neutral' },
  { id: 'domain', label: 'C2', variant: 'domain' },
];

export const CATALOG: CatalogEntry[] = [
  { kind: 'concept', navId: 'icon-library', title: 'Icon Library', description: 'Central icon registry and tactical glyphs.' },
  { kind: 'concept', navId: 'styling', title: 'Styling', description: 'Palette, substrate, and token reference.' },
  { kind: 'concept', navId: 'quick-start', title: 'Quick Start', description: 'Onboarding for the design system.' },
  { kind: 'component', navId: 'app-shell', registryName: 'app-shell', lifecycle: 'stable', category: 'layout', exportName: 'C2AppShell' },
  { kind: 'concept', navId: 'releases', title: 'Releases', description: 'Changelog and version notes.' },
  { kind: 'component', navId: 'status-chip', registryName: 'status-chip', lifecycle: 'stable', category: 'primitives', exportName: 'StatusChip', examples: PRIMITIVE_EXAMPLES },
  { kind: 'component', navId: 'new-updates', registryName: 'new-updates-pill', lifecycle: 'stable', category: 'primitives', exportName: 'NewUpdatesPill', examples: PRIMITIVE_EXAMPLES },
  { kind: 'component', navId: 'action-button', registryName: 'action-button', lifecycle: 'stable', category: 'primitives', exportName: 'ActionButton', examples: PRIMITIVE_EXAMPLES },
  { kind: 'component', navId: 'split-action', registryName: 'split-action-button', lifecycle: 'stable', category: 'primitives', exportName: 'SplitActionButton', examples: PRIMITIVE_EXAMPLES },
  { kind: 'component', navId: 'accordion', registryName: 'accordion-section', lifecycle: 'stable', category: 'primitives', exportName: 'AccordionSection', examples: PRIMITIVE_EXAMPLES },
  { kind: 'component', navId: 'telemetry', registryName: 'telemetry-row', lifecycle: 'stable', category: 'primitives', exportName: 'TelemetryRow', examples: PRIMITIVE_EXAMPLES },
  { kind: 'component', navId: 'card-header', registryName: 'card-header', lifecycle: 'stable', category: 'cards', exportName: 'CardHeader' },
  { kind: 'component', navId: 'card-media', registryName: 'card-media', lifecycle: 'stable', category: 'cards', exportName: 'CardMedia' },
  { kind: 'component', navId: 'card-actions', registryName: 'card-actions', lifecycle: 'stable', category: 'cards', exportName: 'CardActions' },
  { kind: 'component', navId: 'card-details', registryName: 'card-details', lifecycle: 'stable', category: 'cards', exportName: 'CardDetails' },
  { kind: 'component', navId: 'card-sensors', registryName: 'card-sensors', lifecycle: 'stable', category: 'cards', exportName: 'CardSensors' },
  { kind: 'component', navId: 'card-log', registryName: 'card-log', lifecycle: 'stable', category: 'cards', exportName: 'CardLog' },
  { kind: 'component', navId: 'card-closure', registryName: 'card-closure', lifecycle: 'stable', category: 'cards', exportName: 'CardClosure' },
  { kind: 'concept', navId: 'card-states', title: 'Card States', description: 'Visual state matrix for detection cards.' },
  { kind: 'component', navId: 'target-card', registryName: 'target-card', lifecycle: 'stable', category: 'cards', exportName: 'TargetCard' },
  { kind: 'component', navId: 'filter-bar', registryName: 'filter-bar', lifecycle: 'stable', category: 'primitives', exportName: 'FilterBar', examples: PRIMITIVE_EXAMPLES },
  { kind: 'concept', navId: 'devices-panel', title: 'DevicesPanel', description: 'C2 device list shell — not a generic primitive.' },
  { kind: 'concept', navId: 'target-card-flows', title: 'Target Card + Map', description: 'Interaction flows between card and map.' },
  { kind: 'concept', navId: 'device-card-flows', title: 'Device Card + Map', description: 'Device hover and asset selection flows.' },
  { kind: 'concept', navId: 'engagement-line-flows', title: 'Engagement Line', description: 'Line anatomy and animation spec.' },
  { kind: 'concept', navId: 'map-markers', title: 'Map Markers', description: 'Marker layers, states, and icon catalog.' },
  { kind: 'concept', navId: 'cesium-map', title: 'Cesium Map', description: '3D map integration patterns.' },
  { kind: 'concept', navId: 'playback-investigation', title: 'Playback Investigation', description: 'Historical playback UI patterns.' },
];

export function getCatalogEntry(navId: string): CatalogEntry | undefined {
  return CATALOG.find((entry) => entry.navId === navId);
}

export function getComponentCatalogEntry(navId: string) {
  const entry = getCatalogEntry(navId);
  return entry?.kind === 'component' ? entry : undefined;
}

export function listComponentCatalogEntries() {
  return CATALOG.filter((entry): entry is Extract<CatalogEntry, { kind: 'component' }> => entry.kind === 'component');
}
