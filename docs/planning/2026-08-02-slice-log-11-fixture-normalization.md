# Slice Log 11: Fixture Normalization

Date: 2026-08-02

## Summary

Normalized stub/seed data, markdown fixture IDs, and stub module names so fixture
vocabulary matches the already-neutral runtime surface (resources, attachments,
checks, scopes).

## Completed

- Renamed seed fields and stub types:
  `missingAttachmentCount`, `linkedAttachmentIds`, `attachmentStatus`,
  `checkContext`, `AttachmentStub`, `NormalizedAttachmentSeed`,
  `NormalizedResourceSeed`, and related types.
- Migrated named fixture IDs atomically:
  - Attachments: `ev_*` → `att_*`
  - Resources: `asset_seed_*` → `resource_seed_*`
  - Documents: `policy-access-governance`, `gap-analysis-standards`,
    `check-narrative`, `attachment-mapping-summary`
  - Task: `task-attachment-coverage-reconciliation`
- Renamed four markdown artifact files and updated
  [`fixtures/markdown/index.ts`](../../fixtures/markdown/index.ts).
- Renamed stub modules:
  [`lib/stubs/attachment-stubs.ts`](../../lib/stubs/attachment-stubs.ts),
  [`lib/stubs/resource-stubs.ts`](../../lib/stubs/resource-stubs.ts).
- Removed translation helper [`lib/stubs/task-relationships.ts`](../../lib/stubs/task-relationships.ts).
- Renamed check presets: `AGGREGATED_CHECK_PRESETS` with `chk_*` IDs.
- Renamed `ObjectType` value `"control"` → `"procedure"`.
- Added [`lib/data-source/fixture-id-map.ts`](../../lib/data-source/fixture-id-map.ts)
  as the legacy ID reference table.
- Expanded [`scripts/check-terminology.mjs`](../../scripts/check-terminology.mjs)
  with fixture normalization guards for stub and fixture paths.

## Deferred

- Neutralizing markdown artifact **body copy** (headings and prose inside `.md` files).
- Archiving superseded contracts under `docs/contracts/` (documentation slice).
- [`lib/onboarding-stub/fresh-data.ts`](../../lib/onboarding-stub/fresh-data.ts) audit if
  wired into active routes later.

## Verification

- `npm run typecheck -- --pretty false`
- `npm run check:terminology`
- `npm test -- --runInBand` (68 suites, 327 tests)
- `npm run lint` (existing warnings only)
- `npm run build`
