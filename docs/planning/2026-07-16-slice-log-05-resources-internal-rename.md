# Slice Log: 2026-07-16 Resources Internal Rename

## Completed

- Added resource-named data-source read models:
  - `lib/data-source/resources-read-model.ts`
  - `ResourceIndexReadModel`
  - `ResourceIndexQuery`
  - `ResourceStatus`
  - `CreateResourceInput`
  - `CreateResourceResult`
- Added resource-named stub store APIs:
  - `lib/data-source/stub-resource-store.ts`
  - `getStubResourcesIndex`
  - `getStubResourceDetail`
  - `createStubResource`
  - `resetStubResourceStoreForTests`
- Updated `getDataSourceAdapters().resources` to use the resource store directly
  and return `resourceId` from creates.
- Kept `getDataSourceAdapters().assets`, `assets-read-model.ts`, and
  `stub-asset-store.ts` as deprecated compatibility wrappers.
- Added resource-named UI helpers:
  - `components/resources/ResourceCreateFlow.tsx`
  - `lib/resources/labels.ts`
- Updated the active `/work/resources` route package to resource naming:
  - page component names
  - detail page component names
  - filters/inventory/overview component names
  - route contract build/validate APIs
  - rail primary object type
- Updated active resource sorting to use `attachments` instead of `evidence` as
  the public sort key.
- Updated stale resource route tests to use resource route contract names.
- Expanded the terminology guard so active resource implementation files cannot
  reintroduce asset terminology.

## Contract Changes

- New resource create responses return:

```json
{
  "resourceId": "resource_..."
}
```

- Deprecated asset create responses still return:

```json
{
  "assetId": "resource_..."
}
```

- Resource rail payloads now use `primaryObject.type = "resource"`.
- The deprecated `asset` primary object type is no longer accepted by the rail
  payload validator.

## Verification

- `npm run typecheck -- --pretty false`
- `npm run check:terminology`
- `npm run lint`
- `npm test -- app/\(app\)/work/resources lib/resources lib/data-source components/context components/attachments`
- `npm test -- 'app/\(app\)/work/resources'`
- `npm test -- --runInBand`
- `npm run build`

## Deferred

- Remove `/api/assets` once compatibility callers/tests are retired.
- Remove `components/assets` and `lib/assets` compatibility wrappers.
- Rename shared seed fixture IDs such as `asset_seed_3` after task/resource
  cross-story references are updated together.
- Rename task-filter query internals from asset/resource once the task read
  model cleanup slice starts.
