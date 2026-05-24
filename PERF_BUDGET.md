# C2 Hub Performance Budget

This budget is the contract for performance work in this repo. Per Law 5,
every optimization needs a before number, an after number, and the command or
field signal that proves the delta.

## Frontend Budgets

| Surface | Budget |
| --- | --- |
| App shell first-load JS | Current CI ceiling <= 600 KB gzip; target <= 200 KB gzip, excluding the documented Cesium override |
| Per-route additional JS | Current CI ceiling <= 125 KB gzip; target <= 50 KB gzip |
| First-load CSS | <= 40 KB gzip |
| Initial transferred weight | <= 1.2 MB |
| Single critical-path dependency | <= 30 KB gzip unless explicitly documented below |

## Field Budgets

| Metric | Target | Hard ceiling |
| --- | --- | --- |
| LCP | <= 2.5 s p75 | 4.0 s |
| INP | <= 200 ms p75 | 500 ms |
| CLS | <= 0.1 p75 | 0.25 |
| TTFB | <= 600 ms p75 | 1.5 s |

Production RUM is wired from `src/lib/rum.ts`. Vercel Analytics records page
views automatically; Web Vitals are sent to `VITE_RUM_ENDPOINT` when configured.

## API Budgets

C2 Hub is currently a Vite SPA with no production API layer. When a backend is
introduced, use these budgets:

| Endpoint class | P95 |
| --- | --- |
| Cached read | < 50 ms |
| Uncached read | < 200 ms |
| Single-record write | < 500 ms |
| Search / aggregate | < 800 ms |
| Background enqueue | < 100 ms |

## Cesium Override

`cesium` is the tactical map runtime and intentionally exceeds the single
dependency budget. The chunk is isolated by `vite.config.ts` and budgeted
separately.

PERF-OVERRIDE: single critical-path dependency budget — Cesium is the product's
WebGL map runtime. It remains allowed while the `cesium` chunk is isolated,
measured on every budget run, and blocked from regressing by more than 5%.

| Chunk | Ceiling |
| --- | --- |
| `cesium-*.js` | <= 1.8 MB gzip |

## CI Enforcement

Run:

```bash
pnpm build
pnpm perf:budget
```

`scripts/check-bundle-budget.mjs` fails when first-load chunks, CSS, route
chunks, or the Cesium override exceed the ceilings above.

## Baseline — 2026-05-22

Captured after the styleguide stabilization pass with:

```bash
pnpm build
pnpm perf:budget
pnpm dlx lighthouse http://127.0.0.1:4173/styleguide --quiet --chrome-flags="--headless=new --no-sandbox" --output=json --output-path=reports/lighthouse-styleguide-baseline.json
```

| Metric | Baseline |
| --- | --- |
| Build time | 4.5 s |
| App shell JS | 249.2 KB gzip |
| First-load CSS | 31.6 KB gzip |
| Initial transfer including Cesium override | 280.8 KB gzip |
| `StyleguidePage` route chunk | 55.2 KB gzip |
| Runtime Shiki chunk | 1635.2 KB gzip |
| Lighthouse Performance | 49 |
| Lighthouse Accessibility | 93 |
| Lighthouse Best Practices | 96 |
| Lighthouse SEO | 92 |
| FCP | 12.1 s |
| LCP | 13.2 s |
| TBT | 300 ms |
| CLS | 0 |

The Shiki chunk is the largest measured docs/styleguide debt. New `/docs`
work must move highlighting to build time and stay inside the docs budget:
<= 100 KB first-load JS, <= 30 KB first-load CSS, and <= 50 KB per-route JS.
