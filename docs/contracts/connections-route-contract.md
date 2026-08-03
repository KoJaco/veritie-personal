# Contract: Connections Routes

## Purpose

Define the frontend contract for the platform-level connections routes:

- `/work/connections` as the overview list
- `/work/connections/[connectionId]` as the inspection + impact detail page

## Scope

Included:

- Lean grouped overview cards for connected and disconnected providers
- Detail route for connected and errored connections
- Action-only dialog/drawer flows for connect, reconnect, sync, and disconnect

Out of scope:

- Persisted provider onboarding or destructive connection mutations
- Read-only scopes/status inspection inside modal surfaces
- Detail routes for never-connected catalog entries

## Invariants

- The index is overview-only and optimized for quick scanning.
- The detail page owns inspection, impact, scopes, and generated-attachment context.
- `DataSourceAdapters.connections.getConnectionsIndex()` supplies only list-level data plus provider setup options.
- `DataSourceAdapters.connections.getConnectionDetail(id)` supplies detail-only inspection data.
- Dialogs and drawers are action surfaces only.
- Disconnected catalog entries do not get a detail route in this branch.

## Core Data Shape

- Index:
  - grouped `connected[]` and `disconnected[]`
  - each card includes name, status, last sync, short coverage summary, and minimal action/navigation metadata
  - `providerOptions[]` back the connect/reconnect flow
- Detail:
  - sync/health state
  - coverage/scopes
  - generated attachments summaries and links
  - action availability for header controls

## References

- Related plan: `docs/branch-plan.md`
- Related code: `app/(app)/work/connections/page.tsx`
- Related code: `app/(app)/work/connections/[connectionId]/page.tsx`
