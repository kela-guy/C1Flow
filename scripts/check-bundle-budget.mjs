import { gzipSync } from 'node:zlib';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';

const DIST_ASSETS_DIR = 'dist/assets';
const DIST_INDEX = 'dist/index.html';
const BASELINE_PATH = 'scripts/bundle-baseline.json';
const KB = 1024;
const REGRESSION_LIMIT = 1.05;

const budgets = {
  appShellJsKb: 400,
  routeJsKb: 125,
  cssKb: 40,
  totalInitialKb: 1200,
  cesiumJsKb: 1800,
};

function gzipKb(path) {
  return gzipSync(readFileSync(path)).length / KB;
}

function listAssets() {
  try {
    return readdirSync(DIST_ASSETS_DIR)
      .map((name) => {
        const path = join(DIST_ASSETS_DIR, name);
        return {
          name,
          path,
          ext: extname(name),
          gzipKb: gzipKb(path),
          rawKb: statSync(path).size / KB,
        };
      })
      .sort((a, b) => b.gzipKb - a.gzipKb);
  } catch {
    throw new Error('dist/assets not found. Run `pnpm build` before `pnpm perf:budget`.');
  }
}

function readInitialJsNames() {
  let html;
  try {
    html = readFileSync(DIST_INDEX, 'utf8');
  } catch {
    throw new Error('dist/index.html not found. Run `pnpm build` before `pnpm perf:budget`.');
  }

  return new Set(
    [...html.matchAll(/<(?:script|link)\b[^>]+(?:src|href)="\/assets\/([^"]+\.js)"/g)]
      .map((match) => match[1]),
  );
}

function isRouteJs(name) {
  return name.endsWith('.js') && name.startsWith('StyleguidePage');
}

function assetKey(name) {
  const ext = extname(name);
  return `${name.slice(0, -ext.length).replace(/-[A-Za-z0-9_-]{6,}$/, '')}${ext}`;
}

function readBaseline() {
  if (!existsSync(BASELINE_PATH)) return null;
  return JSON.parse(readFileSync(BASELINE_PATH, 'utf8'));
}

function fail(message) {
  failures.push(message);
}

const assets = listAssets();
const failures = [];
const jsAssets = assets.filter((asset) => asset.ext === '.js');
const cssAssets = assets.filter((asset) => asset.ext === '.css');
const cesiumAssets = jsAssets.filter((asset) => asset.name.startsWith('cesium'));
const initialJsNames = readInitialJsNames();
const initialJsAssets = jsAssets.filter((asset) => initialJsNames.has(asset.name) && !asset.name.startsWith('cesium'));
const routeJsAssets = jsAssets.filter((asset) => isRouteJs(asset.name));

const appShellJsKb = initialJsAssets.reduce((sum, asset) => sum + asset.gzipKb, 0);
const cssKb = cssAssets.reduce((sum, asset) => sum + asset.gzipKb, 0);
const totalInitialKb = appShellJsKb + cssKb + cesiumAssets.reduce((sum, asset) => sum + asset.gzipKb, 0);
const baseline = readBaseline();

if (appShellJsKb > budgets.appShellJsKb) {
  fail(`App shell JS ${appShellJsKb.toFixed(1)} KB gzip exceeds ${budgets.appShellJsKb} KB.`);
}

if (cssKb > budgets.cssKb) {
  fail(`First-load CSS ${cssKb.toFixed(1)} KB gzip exceeds ${budgets.cssKb} KB.`);
}

if (totalInitialKb > budgets.totalInitialKb) {
  fail(`Initial transfer ${totalInitialKb.toFixed(1)} KB gzip exceeds ${budgets.totalInitialKb} KB.`);
}

for (const asset of routeJsAssets) {
  if (asset.gzipKb > budgets.routeJsKb) {
    fail(`Route chunk ${asset.name} is ${asset.gzipKb.toFixed(1)} KB gzip; budget is ${budgets.routeJsKb} KB.`);
  }
}

for (const asset of cesiumAssets) {
  if (asset.gzipKb > budgets.cesiumJsKb) {
    fail(`Cesium override chunk ${asset.name} is ${asset.gzipKb.toFixed(1)} KB gzip; ceiling is ${budgets.cesiumJsKb} KB.`);
  }
}

if (baseline) {
  const metricValues = { appShellJsKb, cssKb, totalInitialKb };
  for (const [metric, baselineKb] of Object.entries(baseline.metrics ?? {})) {
    const currentKb = metricValues[metric];
    if (typeof currentKb === 'number' && currentKb > baselineKb * REGRESSION_LIMIT) {
      fail(`${metric} regressed from ${baselineKb.toFixed(1)} KB to ${currentKb.toFixed(1)} KB gzip (>5%).`);
    }
  }

  const keyCounts = new Map();
  for (const asset of assets) {
    const key = assetKey(asset.name);
    keyCounts.set(key, (keyCounts.get(key) ?? 0) + 1);
  }

  for (const asset of assets) {
    const key = assetKey(asset.name);
    const baselineKb = baseline.chunks?.[key];
    if (!baselineKb || keyCounts.get(key) !== 1) continue;
    if (asset.gzipKb > baselineKb * REGRESSION_LIMIT) {
      fail(`${key} regressed from ${baselineKb.toFixed(1)} KB to ${asset.gzipKb.toFixed(1)} KB gzip (>5%).`);
    }
  }
}

console.table(
  assets
    .filter((asset) => asset.ext === '.js' || asset.ext === '.css')
    .map((asset) => ({
      asset: asset.name,
      gzipKb: Number(asset.gzipKb.toFixed(1)),
      rawKb: Number(asset.rawKb.toFixed(1)),
    })),
);

console.log(`App shell JS: ${appShellJsKb.toFixed(1)} KB gzip`);
console.log(`CSS: ${cssKb.toFixed(1)} KB gzip`);
console.log(`Initial transfer including Cesium override: ${totalInitialKb.toFixed(1)} KB gzip`);

if (failures.length > 0) {
  for (const failure of failures) console.error(`Budget failure: ${failure}`);
  process.exit(1);
}

console.log('Bundle budgets passed.');
