# Contract: Scope Lens Contract

## Purpose

Define the stable URL and UI contract for scope lens state used across Work routes, navigation links, and rail context payloads.

## Scope

Included:

- URL scope key and normalization behavior
- Link preservation rules
- Dialog/switcher UI state mapping rules
- Lens payload shape when sent to rail context

Out of scope:

- Backend persistence of lens preferences
- Cross-device/profile lens synchronization
- Scope-specific metric business rules

## Versioning

- **Current version:** v1
- **Compatibility:** Backward compatible
- **Change policy:** Changing key names or scope semantics is breaking.

## Definitions

- **Scope lens**: View scope filter for Work routes.
- **Canonical URL key**: `scope`.
- **Lens-relevant pages**: Work, Tasks, Resources, Documents, Scopes, Connections, and Settings.

## Contract Shape

### Required fields

- `scope` — one of `"all" | "operations-readiness" | "delivery-observability" | "workspace-resilience" | "knowledge-hygiene"`.

### Optional fields

- None in the public contract. Legacy framework/mode/window fields may still exist internally during migration, but active surfaces must serialize only `scope`.

## Invariants

- Scope lens is always defined after normalization (`scope` defaults to `"all"`).
- Active navigation preserves the current `scope` unless intentionally reset.
- Invalid or oversized lens input fails closed to a safe normalized default.
- Active surfaces must not emit legacy query keys such as `framework`, `mode`, `window`, `start`, or `end`.

## Error Handling

- Invalid or malformed lens params normalize to `scope=all`.
- Oversized lens input is rejected and normalized to `scope=all`.
- UI controls must tolerate missing or invalid scope values without crashing.

## Examples

### Minimal valid example

```json
{
  "scope": "all"
}
```

### Scope-specific example

```json
{
  "scope": "delivery-observability"
}
```

## Operational Notes

- Shared helpers in `lib/lens` are the supported implementation path for parsing, normalization, serialization, and link merging.
- Scope matching, bounded `all` behavior, cache-tag naming, and prefetch policy are documented in `docs/contracts/scope-matching-contract.md`.

## References

- Related ADRs: `docs/adr/0010-framework-lens-url-contract.md`
- Related contracts: `docs/contracts/context-rail-contract.md`
