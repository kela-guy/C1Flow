import registry from '../../../registry.json';

export type RegistryLifecycle = 'stable' | 'preview' | 'deprecated';

export type RegistryCategory =
  | 'foundations'
  | 'primitives'
  | 'cards'
  | 'tactical'
  | 'map'
  | 'device'
  | 'layout';

export interface RegistryItemRecord {
  name: string;
  type: string;
  title: string;
  description: string;
  dependencies?: string[];
  registryDependencies?: string[];
  meta?: { lifecycle?: RegistryLifecycle; deprecated_for?: string };
  categories?: RegistryCategory[];
  docs?: string;
  files?: Array<{ path: string; target?: string; type?: string }>;
}

const items = registry.items as RegistryItemRecord[];

const byName = new Map(items.map((item) => [item.name, item]));

export const REGISTRY_HOMEPAGE = registry.homepage as string;

export function getRegistryItem(name: string): RegistryItemRecord | undefined {
  return byName.get(name);
}

export function listRegistryItems(): RegistryItemRecord[] {
  return items;
}

export function targetToImportModule(target: string): string {
  if (target.startsWith('@ui/')) {
    return `@/app/components/ui/${target.slice(4).replace(/\.tsx$/, '')}`;
  }
  if (target.startsWith('@lib/')) {
    return `@/lib/${target.slice(5).replace(/\.ts$/, '')}`;
  }
  if (target.startsWith('@hooks/')) {
    return `@/hooks/${target.slice(7).replace(/\.ts$/, '')}`;
  }
  if (target.startsWith('@components/')) {
    return `@/app/components/${target.slice(12).replace(/\.tsx$/, '')}`;
  }
  return target;
}

export function defaultExportName(item: RegistryItemRecord): string {
  const file = item.files?.[0];
  if (!file?.target) return item.title.replace(/\s+/g, '');
  const base = file.target.split('/').pop() ?? item.name;
  return base.replace(/\.(tsx|ts)$/, '');
}

export function installCommand(registryName: string): string {
  return `pnpm dlx shadcn@latest add @c2/${registryName}`;
}

export function importStatement(item: RegistryItemRecord, exportName?: string): string {
  const name = exportName ?? defaultExportName(item);
  const target = item.files?.[0]?.target;
  const modulePath = target ? targetToImportModule(target) : '@/app/components/ui';
  return `import { ${name} } from '${modulePath}'`;
}

export function isDomainComponent(categories: RegistryCategory[] | undefined): boolean {
  if (!categories?.length) return false;
  return categories.some((c) => c === 'tactical' || c === 'map' || c === 'device');
}

export const COMPONENTS_JSON_SNIPPET = `{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "c2-hub",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "css": "src/styles/index.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/app/components",
    "ui": "@/app/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks",
    "utils": "@/app/components/ui/utils"
  },
  "registries": {
    "@c2": "${REGISTRY_HOMEPAGE}/r/{name}.json"
  }
}`;
