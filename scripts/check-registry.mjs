#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const REGISTRY_PATH = join(ROOT, 'registry.json');
const CATALOG_PATH = join(ROOT, 'src/app/styleguide/componentCatalog.ts');

const PLACEHOLDER_TARGETS = /^@(ui|lib|hooks|components)\//;
const IMPORT_RE = /from\s+["']([^"']+)["']/g;
const STALE_DEPS = new Set(['lucide-react', 'framer-motion']);

const errors = [];

function fail(message) {
  errors.push(message);
}

function packageRoot(spec) {
  if (spec.startsWith('.') || spec.startsWith('@/')) return null;
  if (spec.startsWith('@')) {
    const parts = spec.split('/');
    return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : spec;
  }
  return spec.split('/')[0];
}

function scanImports(filePath) {
  const full = join(ROOT, filePath);
  if (!existsSync(full)) return [];
  const content = readFileSync(full, 'utf8');
  const specs = [];
  let match;
  while ((match = IMPORT_RE.exec(content))) {
    specs.push(match[1]);
  }
  return specs;
}

function readCatalogRegistryNames() {
  const src = readFileSync(CATALOG_PATH, 'utf8');
  return [...src.matchAll(/registryName:\s*'([^']+)'/g)].map((match) => match[1]);
}

const registry = JSON.parse(readFileSync(REGISTRY_PATH, 'utf8'));
const itemsByName = new Map(registry.items.map((item) => [item.name, item]));

for (const item of registry.items) {
  if (!item.description?.trim()) {
    fail(`${item.name}: missing description`);
  }
  if (!item.meta?.lifecycle) {
    fail(`${item.name}: missing meta.lifecycle`);
  }
  if (!item.categories?.length) {
    fail(`${item.name}: missing categories`);
  }

  for (const file of item.files ?? []) {
    const diskPath = join(ROOT, file.path);
    if (!existsSync(diskPath)) {
      fail(`${item.name}: missing file ${file.path}`);
    }

    if (item.type !== 'registry:base' && file.path && !file.target) {
      fail(`${item.name}: ${file.path} missing target placeholder`);
    }

    if (file.target && !PLACEHOLDER_TARGETS.test(file.target) && !file.target.startsWith('~/')) {
      fail(`${item.name}: target "${file.target}" must use @ui/, @lib/, @hooks/, @components/, or ~/`);
    }

    if (file.type && item.type !== 'registry:base' && file.type !== item.type) {
      fail(`${item.name}: files[].type "${file.type}" should match item type "${item.type}"`);
    }

    const npmImports = scanImports(file.path)
      .map(packageRoot)
      .filter(Boolean);

    for (const dep of item.dependencies ?? []) {
      if (STALE_DEPS.has(dep) && !npmImports.includes(dep)) {
        fail(`${item.name}: stale dependency "${dep}" — not imported by ${file.path}`);
      }
    }

    for (const pkg of npmImports) {
      if (pkg === 'react' || pkg === 'react-dom') continue;
      if (!(item.dependencies ?? []).includes(pkg)) {
        fail(`${item.name}: undeclared dependency "${pkg}" imported by ${file.path}`);
      }
    }
  }
}

for (const registryName of readCatalogRegistryNames()) {
  if (!itemsByName.has(registryName)) {
    fail(`componentCatalog: "${registryName}" has no matching registry item`);
  }
}

if (errors.length > 0) {
  console.error(`Registry check failed (${errors.length} issues):\n`);
  for (const error of errors) {
    console.error(`  • ${error}`);
  }
  process.exit(1);
}

console.log(`Registry check passed (${registry.items.length} items, catalog parity ok).`);
