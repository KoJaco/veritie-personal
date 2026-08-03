# Contract: Retired Resources Compatibility Boundary

## Purpose

Record the retired boundary between the public Resources surface and the
legacy asset-named compatibility wrappers that previously backed it.

## Active Public Vocabulary

- Route: `/work/resources`
- Generic API route: `POST /api/resources`
- Generic client: `lib/resources/create-resource-client.ts`
- Generic adapter key: `getDataSourceAdapters().resources`
- Generic read model: `lib/data-source/resources-read-model.ts`
- Generic stub store: `lib/data-source/stub-resource-store.ts`
- Generic UI component: `components/resources/ResourceCreateFlow.tsx`

## Retired Compatibility

The legacy asset compatibility wrappers have been removed. New code must not
restore these paths, imports, adapter keys, or response shapes:

- `POST /api/assets`
- `components/assets/*`
- `lib/assets/*`
- `lib/data-source/assets-read-model.ts`
- `lib/data-source/stub-asset-store.ts`
- `getDataSourceAdapters().assets`
- `CreateAssetInput`, `CreateAssetResult`, and `AssetsReadAdapter`

## Invariants

- Active UI copy should say resource, not asset.
- New client code should call `/api/resources`, not `/api/assets`.
- New adapter consumers should use `resources`, not `assets`.
- Active `/work/resources`, `components/resources`, and `lib/resources`
  implementation files are guarded against asset terminology.
- Removed compatibility paths and imports are guarded against reintroduction in
  active app, component, and library code.

## Deferred Cleanup

- Replace asset fixture IDs in seed data with resource IDs where doing so does
  not break cross-story references.
- Fixture-level task/resource seed fields may still use asset naming until the
  fixture normalization slice.
