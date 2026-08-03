# 0016: Connections Route Contract Hardening

## Status

Accepted

## Context

The connections dashboard routes had a placeholder page-model schema and a
singleton rail identity. That left the route contract weak, allowed JSON-unsafe
values like `href: undefined` into the page-model, and made the index and detail
pages share the same assistant/context scope even though both pages exist.

## Decision

- Connections routes use explicit page-model and rail-payload schemas following
  the stronger dashboard/tasks/evidence pattern.
- Connections index and connections detail are distinct route identities:
  `connections_index` and `connections_detail`.
- Page-model inputs must match the rendered UI slice exactly. Builders do not
  widen `refs.visible` beyond what the page renders.
- JSON-safe optional fields are omitted when absent rather than serialized as
  `undefined`.

## Consequences

- Assistant thread state and context payloads are now scoped correctly per
  connections page.
- The connections route contract is now a reusable template for upgrading other
  placeholder routes later.
- Future routes with both index and detail pages should split route ids, rail
  scopes, and thread keys the same way.
