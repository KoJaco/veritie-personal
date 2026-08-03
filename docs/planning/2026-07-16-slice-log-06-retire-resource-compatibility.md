# Slice Log: 2026-07-16 Retire Resource Compatibility

## Completed

- Removed the legacy resource compatibility API and wrappers:
  - `POST /api/assets`
  - `components/assets/*`
  - `lib/assets/*`
  - `lib/data-source/assets-read-model.ts`
  - `lib/data-source/stub-asset-store.ts`
- Removed `getDataSourceAdapters().assets` from the data-source contract,
  stub adapter, and backend adapter.
- Removed asset create/read aliases from the data-source barrel exports.
- Updated resource adapter tests and explicit `DataSourceAdapters` mocks to use
  the resource adapter only.
- Updated the resources compatibility contract to record the compatibility layer
  as retired.
- Expanded the terminology guard to block reintroduction of the removed
  compatibility paths and identifiers.

## Contract Changes

- `POST /api/assets` is no longer available.
- `getDataSourceAdapters().assets` is no longer part of the adapter contract.
- `CreateAssetInput`, `CreateAssetResult`, `AssetsReadAdapter`, and asset
  read-model aliases are no longer exported from `lib/data-source`.

## Deferred

- Keep `asset_seed_*` fixture IDs until fixture normalization or task/document
  relationship cleanup.
- Keep task `asset` query params and task asset relationship fields until the
  task/document relationship cleanup slice.
- Keep `lib/stubs/asset.ts` and `AssetStub` aliases while shared fixtures still
  depend on asset-shaped seed internals.
