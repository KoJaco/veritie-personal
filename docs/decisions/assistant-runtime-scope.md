# Decision Note: Assistant Runtime Scoped by Route Payload

## Date

2026-02-11

## Summary

We will delay mounting the assistant runtime until the current route’s context payload scope matches the derived routeId. This prevents the assistant UI from mounting with a fallback thread key and showing the wrong chat history during navigation.

## Decision

- Only render the assistant runtime when `context.scope` matches the current `routeId`.
- Compute thread keys from `routeId + context.scope` once the payload is aligned.

## Rationale

- Context payload arrives after navigation and can temporarily reflect the previous route.
- Mounting the runtime during this gap causes a fallback thread key and history bleed.
- Deferring mount preserves correct per-route chat history without altering the rail behavior.

## Impact

- Slight delay before the assistant UI appears on navigation.
- Prevents wrong-thread messages from appearing during route transitions.

## Follow-ups

- [ ] Remove debug logs once stability is confirmed.
- [ ] Revisit a non-delayed strategy if assistant-ui exposes a safe runtime reset API.

## References

- Related ADR/Contracts: `docs/architecture/context-rail-resolver.md`
