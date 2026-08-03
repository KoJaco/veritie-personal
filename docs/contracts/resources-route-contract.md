# Contract: Resources Route Contract

## Purpose

Define the active public contract for the Resources surface at `/work/resources`.

## Scope

Included:

- Resources index and detail routes under `app/(app)/work/resources/**`
- Generic create API: `POST /api/resources`
- Generic client: `lib/resources/create-resource-client.ts`
- Adapter key: `getDataSourceAdapters().resources`

Out of scope:

- Legacy asset compatibility wrappers (removed)
- Backend persistence implementation

## Invariants

- Active UI copy uses resource terminology.
- New client code calls `/api/resources`.
- New adapter consumers use `resources`, not retired `assets` keys.
- Fixture seed IDs use `resource_seed_*` naming in normalized stories.

## References

- Related contracts: `docs/contracts/page-model-contract.md`, `docs/contracts/context-rail-contract.md`
