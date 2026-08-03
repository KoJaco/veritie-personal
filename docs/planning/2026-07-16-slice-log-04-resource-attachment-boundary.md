# Slice Log: 2026-07-16 Resource and Attachment Boundary

## Completed

- Added generic data-source adapter aliases:
  - `getDataSourceAdapters().resources`
  - `getDataSourceAdapters().attachments`
- Added generic API routes:
  - `POST /api/resources`
  - `POST /api/attachments/versions`
- Moved new resource creation client calls to `/api/resources`.
- Moved attachment version upload client calls to `/api/attachments/versions`.
- Kept legacy asset/evidence adapters and API routes as temporary compatibility
  while the internal stores and read models are still being renamed.
- Updated active markdown renderer documentation to remove stale domain-specific
  framing and point at the implemented component path.
- Replaced the active evidence route contract with an attachment route contract
  that records `/work/evidence` as removed from the public route family.
- Added a resources compatibility contract documenting where asset-shaped
  internals are still tolerated.
- Expanded the terminology guard to fail implementation code that reintroduces
  retired public routes or legacy API calls in the active Work/client boundary.
- Updated stale sidebar tests to use the current Shell brand and valid
  scope-lens IDs.

## Contract Changes

- New UI code should prefer:
  - `lib/resources/create-resource-client.ts`
  - `lib/attachments/upload-attachment-version-client.ts`
  - `getDataSourceAdapters().resources`
  - `getDataSourceAdapters().attachments`
- Legacy compatibility remains available behind the adapter layer:
  - `/api/assets`
  - `/api/evidence/versions`
  - `getDataSourceAdapters().assets`
  - `getDataSourceAdapters().evidence`
- Active Work implementation files are guarded against:
  - `/dashboard`
  - `/work/assets`
  - `/work/evidence`
  - `/work/frameworks`
  - `/work/controls`
  - `/api/assets`
  - `/api/evidence`

## Verification

- `npm run check:terminology`
- `npm run typecheck -- --pretty false`
- `npm run lint`
- `npm test -- lib/resources lib/attachments app/api/attachments app/api/resources lib/data-source components/attachments`
- `npm test -- 'app/\(app\)/work'`
- `npm test -- --runInBand`
- `npm run build`

## Deferred

- Rename asset read-model types, store files, and component directory to
  resource terminology.
- Rename evidence read-model types, store files, and component directory to
  attachment terminology.
- Remove `/api/assets` and `/api/evidence/versions` after all compatibility
  tests and remaining callers are moved.
- Replace `assetId` and evidence-root-shaped result fields in public write
  contracts with fully generic resource and attachment identifiers.
- Continue active-doc cleanup for framework/control-shaped contracts that still
  describe internal implementation details.
