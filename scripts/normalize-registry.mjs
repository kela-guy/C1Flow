import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { basename, join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const REGISTRY_PATH = join(ROOT, 'registry.json');

const PRIMITIVE_NAMES = new Set([
  'status-chip',
  'action-button',
  'split-action-button',
  'accordion-section',
  'telemetry-row',
  'new-updates-pill',
  'filter-bar',
]);

const CARD_NAMES = new Set([
  'card-header',
  'card-actions',
  'card-details',
  'card-sensors',
  'card-media',
  'card-log',
  'card-closure',
  'card-timeline',
  'card-footer-dock',
  'target-card',
]);

const MAP_NAMES = new Set(['map-marker-states', 'map-marker', 'map-icons']);

const FOUNDATION_NAMES = new Set(['utils', 'use-mobile', 'tokens']);

const AGGREGATORS = new Set(['domain-primitives', 'map-kit', 'all']);

const DOCS_BY_NAME = {
  'filter-bar':
    'Requires domain types (ActivityStatus, FilterState) from the consumer app.',
};

function packageRoot(spec) {
  if (spec.startsWith('.')) return null;
  if (spec.startsWith('@/')) return null;
  if (spec.startsWith('@')) {
    const parts = spec.split('/');
    return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : spec;
  }
  return spec.split('/')[0];
}

function scanNpmDeps(filePath) {
  const full = join(ROOT, filePath);
  if (!existsSync(full)) return [];
  const content = readFileSync(full, 'utf8');
  const deps = new Set();
  const re = /from\s+["']([^"']+)["']/g;
  let match;
  while ((match = re.exec(content))) {
    const root = packageRoot(match[1]);
    if (root) deps.add(root);
  }
  return [...deps].sort();
}

function inferTarget(filePath, itemType) {
  const name = basename(filePath);
  if (itemType === 'registry:hook') return `@hooks/${name}`;
  if (itemType === 'registry:lib') return `@lib/${name}`;
  if (name.endsWith('.ts') && !name.endsWith('.tsx')) return `@lib/${name}`;
  if (filePath.includes('src/app/components/ui/')) return `@ui/${name}`;
  if (filePath.includes('src/primitives/')) return `@ui/${name}`;
  return `@components/${name}`;
}

function getCategories(name, filePath) {
  if (name === 'app-shell') return ['layout'];
  if (FOUNDATION_NAMES.has(name)) return ['foundations'];
  if (MAP_NAMES.has(name)) return ['map', 'tactical'];
  if (CARD_NAMES.has(name)) return ['cards'];
  if (PRIMITIVE_NAMES.has(name)) return ['primitives'];
  if (filePath?.includes('src/app/components/gridblock/')) return ['layout'];
  if (filePath?.includes('src/app/components/ui/')) return ['foundations'];
  if (filePath?.includes('src/primitives/')) return ['primitives'];
  return ['foundations'];
}

function normalizeFileEntry(file, item) {
  const fileType = item.type === 'registry:ui' ? 'registry:ui' : file.type;
  return {
    ...file,
    type: fileType,
    target: file.target ?? inferTarget(file.path, item.type),
  };
}

function buildC2Base(homepage) {
  return {
    name: 'c2-base',
    type: 'registry:base',
    title: 'C2 Hub Design System',
    description:
      'Bootstraps a project with C2 tokens, primitives, aliases, and registry namespace.',
    version: '1.0.0',
    config: {
      style: 'c2-hub',
      iconLibrary: 'lucide',
      tsx: true,
      rsc: false,
      tailwind: {
        baseColor: 'neutral',
        css: 'src/styles/index.css',
        cssVariables: true,
      },
      aliases: {
        components: '@/app/components',
        ui: '@/app/components/ui',
        lib: '@/lib',
        hooks: '@/hooks',
        utils: '@/app/components/ui/utils',
      },
      registries: {
        '@c2': `${homepage}/r/{name}.json`,
      },
    },
    dependencies: ['clsx', 'tailwind-merge', 'class-variance-authority'],
    registryDependencies: [
      'utils',
      'tokens',
      'status-chip',
      'action-button',
      'split-action-button',
      'accordion-section',
      'telemetry-row',
      'new-updates-pill',
      'card-header',
      'card-actions',
      'card-details',
      'card-sensors',
      'card-media',
      'card-log',
      'card-closure',
      'card-timeline',
      'card-footer-dock',
      'target-card',
      'map-marker-states',
      'map-marker',
      'map-icons',
    ],
    cssVars: {
      theme: {
        '--slate-1': 'oklch(0.165 0.005 256)',
        '--slate-12': 'oklch(0.965 0.010 256)',
        '--surface-void': 'oklch(0.06 0 0)',
        '--surface-1': 'var(--slate-1)',
        '--surface-2': 'var(--slate-2)',
        '--surface-3': 'var(--slate-3)',
        '--border-default': 'oklch(0.490 0.016 256 / 0.55)',
        '--border-strong': 'oklch(0.580 0.018 256 / 0.80)',
        '--accent-danger': 'oklch(0.660 0.220 27)',
        '--accent-warning': 'oklch(0.770 0.170 70)',
        '--accent-success': 'oklch(0.790 0.180 145)',
        '--accent-info': 'oklch(0.790 0.140 230)',
        '--state-hover': 'color-mix(in oklch, var(--slate-12) 4%, transparent)',
        '--state-selected': 'color-mix(in oklch, var(--slate-12) 12%, transparent)',
      },
      dark: {
        '--slate-2': 'oklch(0.205 0.006 256)',
        '--slate-3': 'oklch(0.245 0.008 256)',
        '--slate-9': 'oklch(0.665 0.018 256)',
        '--slate-10': 'oklch(0.760 0.018 256)',
      },
    },
    css: {
      '@keyframes tile-detection-pulse': {
        '0%': { opacity: '0' },
        '18%': { opacity: '0.95' },
        '50%': { opacity: '0.6' },
        '100%': { opacity: '0' },
      },
      '@keyframes tile-detection-pulse-reduced': {
        '0%': { opacity: '0' },
        '50%': { opacity: '0.6' },
        '100%': { opacity: '0' },
      },
    },
    meta: { lifecycle: 'stable' },
    categories: ['foundations'],
    files: [],
  };
}

const registry = JSON.parse(readFileSync(REGISTRY_PATH, 'utf8'));

const normalizedItems = registry.items
  .filter((item) => !AGGREGATORS.has(item.name))
  .map((item) => {
    const files = (item.files ?? []).map((file) => normalizeFileEntry(file, item));
    const scannedDeps =
      files.length > 0
        ? [...new Set(files.flatMap((file) => scanNpmDeps(file.path)))]
        : (item.dependencies ?? []);

    const next = {
      ...item,
      files,
      dependencies: scannedDeps.length > 0 ? scannedDeps : undefined,
      meta: item.meta ?? { lifecycle: 'stable' },
      categories: item.categories ?? getCategories(item.name, files[0]?.path),
    };

    if (!next.dependencies?.length) delete next.dependencies;

    const docs = DOCS_BY_NAME[item.name];
    if (docs) next.docs = docs;
    else if (next.docs && !DOCS_BY_NAME[item.name]) delete next.docs;

    return next;
  });

registry.items = [buildC2Base(registry.homepage), ...normalizedItems];

writeFileSync(REGISTRY_PATH, `${JSON.stringify(registry, null, 2)}\n`);
console.log(`Normalized ${registry.items.length} registry items.`);
