# Decision Note: Chat Regenerate Persistence Behavior

## Date

2026-02-13

## Summary

When a user regenerates (refreshes) an assistant message, we persist only the currently active message path for the thread. On reload, users see the active regenerated result, not both the original and regenerated variants.

## Decision

Use active-path-only persistence for chat threads. Do not persist all regenerate variants/branches in local storage at this time.

## Rationale

- Keeps client-side persistence model simple (`messages[]` linear history).
- Reduces storage overhead and migration complexity.
- Matches current runtime write pattern that saves active thread state.

## Impact

- Reload restores the selected regenerated output and prior conversation turns.
- Original regenerated alternatives are not recoverable after reload.
- Branch/variant history is out of scope for current MVP persistence.

## Follow-ups

- [ ] Revisit if product requires branch picker history across reloads.
- [ ] Add explicit UX copy if needed to clarify regenerate replacement behavior.

## References

- Related Decision: `docs/decisions/assistant-runtime-scope.md`
- Related Implementation: `components/assistant-ui/AssistantProvider.tsx`
- Related Implementation: `components/assistant-ui/chat-store.ts`
