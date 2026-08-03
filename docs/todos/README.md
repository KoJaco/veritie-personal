# Branch todos — Veritie integration

Working checklists for the Veritie integration branch. Archived MVP phase checklists live in [`docs/archive/todos-03-08-2026/`](../archive/todos-03-08-2026/).

## Scope (this branch)

- Voice capture via `@veritie/sdk` through a Next.js API proxy (`/api/veritie`)
- Server-side persist into in-memory stub stores (timeline + captures read models)
- Env configuration and verification

## Out of scope (next branch)

- Drizzle / Supabase persistence
- Session or user auth on app routes and capture flows
- PDF, Image, Text capture modes
- Live WebSocket capture in the UI

## Checklists

| File | Purpose |
| --- | --- |
| [integration-veritie-proxy.md](./integration-veritie-proxy.md) | Proxy implementation, runbook, manual E2E |
| [integration-env-reference.md](./integration-env-reference.md) | Env var matrix and local dev examples |
| [verification-debt.md](./verification-debt.md) | typecheck / lint / test / build / smoke |
| [post-auth-db-audit.md](./post-auth-db-audit.md) | Deferred security and persistence audit follow-ups |

## Related docs

- Canonical plan: [`docs/planning/2026-08-03-voice-log-personal-restructure-plan.md`](../planning/2026-08-03-voice-log-personal-restructure-plan.md)
- SDK: [`sdk/README.md`](../../sdk/README.md)
- Capture flow architecture: [`docs/architecture/capture-flow.md`](../architecture/capture-flow.md)
