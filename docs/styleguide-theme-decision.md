# Styleguide Theme Decision

Decision: `/docs` uses the existing C2 token stack instead of adding a scoped shadcn neutral theme.

## Reason

Per Law 3, ship less. The current C2 token stack already provides the surface, slate, border, state, and semantic shadcn-compatible variables required by the docs shell. Adding a second neutral theme would duplicate CSS and create a second design contract for the same registry.

## Measured Impact

Measured with:

```bash
pnpm build
pnpm perf:budget
```

| Metric | Before `/docs` | After `/docs` | Delta |
| --- | ---: | ---: | ---: |
| First-load CSS | 31.6 KB gzip | 31.6 KB gzip | 0 KB |
| App shell JS | 249.2 KB gzip | 249.5 KB gzip | +0.3 KB |
| Docs shell chunk | n/a | 6.4 KB gzip | +6.4 KB |
| Docs search chunk | n/a | 0.7 KB gzip | loaded on open |
| Search index chunk | n/a | 0.7 KB gzip | loaded on open |

The docs shell stays below the docs route budget: <= 100 KB first-load JS, <= 30 KB docs-owned CSS, and <= 50 KB per-route JS. The shared app CSS remains 31.6 KB gzip, which is over the docs-only ideal but unchanged by this decision.

## Deviation From The Imported Spec

The implementation plan described shadcn's neutral OKLCH preset and Geist fonts. C2 Hub keeps its existing tactical OKLCH palette, surface ladder, slate text ladder, and Central icon system. The docs pages must describe those tokens as the product source of truth rather than pretending to be a pure `ui.shadcn.com` clone.

## Follow-up Rule

Any future neutral theme for `/docs` needs a measured CSS delta before implementation. If it pushes first-load CSS above the current 31.6 KB gzip baseline by more than 5%, the change needs a performance override.
