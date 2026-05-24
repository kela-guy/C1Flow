# C2 Hub Registry

Internal shadcn-compatible registry for C2 Hub components.

## Bootstrap

Drop this into your project's `components.json`, then run the one-liner:

```bash
pnpm dlx shadcn@latest add @c2/c2-base
```

```json
{
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
    "@c2": "https://c2-hub-three.vercel.app/r/{name}.json"
  }
}
```

## Install a component

```bash
pnpm dlx shadcn@latest add @c2/status-chip
pnpm dlx shadcn@latest add @c2/action-button
pnpm dlx shadcn@latest add @c2/target-card
```

## What's in `@c2`

| Category | Examples |
| --- | --- |
| Foundations | `utils`, `tokens`, shadcn UI primitives |
| Primitives | `status-chip`, `action-button`, `filter-bar`, `telemetry-row` |
| Cards | `card-header`, `card-actions`, `target-card` |
| Map / tactical | `map-marker`, `map-icons`, `map-marker-states` |

Aggregators `all`, `domain-primitives`, and `map-kit` were removed — use `@c2/c2-base` instead.

## Styleguide

Interactive docs with install commands, import snippets, and live previews:

`/styleguide` in the C2 Hub app (or the deployed preview URL).

## Maintenance

```bash
pnpm registry:check   # validate contract + catalog parity
pnpm registry:build   # check, build, post-process
```
