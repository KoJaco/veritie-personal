# Branch 10 - AI Suggestions

Suggested branch: `feature/ai-suggestions`

## Objective

Add AI assistance after deterministic manual flows are working. AI should suggest organization choices, matches, and merges, while the user remains in control of accept/confirm actions.

## Depends On

- Branch 01 projection foundation.
- Branches for the target domains that AI will assist, especially goals, records/resources, and tasks.

## In Scope

- Goal progress match suggestions.
- Duplicate task/resource suggestions.
- Record append/merge suggestions.
- Cross-aspect/link suggestions.
- Optional braindump fragment suggestions if Branch 09 emits loose content.
- Review UI affordances that distinguish suggestions from committed actions.
- Evaluation tests using deterministic fixtures.

## Out of Scope

- Auto-accept high confidence items.
- Autonomous background reorganization.
- Training/fine-tuning workflows.
- User-visible AI chat as the primary organization interface.

## Implementation Checklist

### Suggestion Model

- [ ] Define `organization_suggestions` or reuse existing artifact storage if appropriate.
- [ ] Store suggestion type, source value id, target entity type/id, confidence, rationale, status, timestamps.
- [ ] Add status values: `pending`, `accepted`, `dismissed`, `superseded`.
- [ ] Ensure suggestions are account-scoped and auditable.

### Suggestion Producers

- [ ] Goal progress -> likely goal suggestions.
- [ ] Task duplicate suggestions by title/date/list.
- [ ] Resource duplicate/merge suggestions by name/category/aspect.
- [ ] Record append suggestions by title/topic.
- [ ] Cross-aspect links where evidence supports it.

### UI

- [ ] Show suggestions inside accept/resolution UI, not as hidden automation.
- [ ] Require explicit user confirmation.
- [ ] Explain why a suggestion exists in concise product language.
- [ ] Let users dismiss suggestions.
- [ ] Avoid blocking manual alternatives when suggestions fail.

### Safety and Determinism

- [ ] Keep deterministic projection mappers as the source of truth.
- [ ] Never mutate domain rows from suggestion generation alone.
- [ ] Log model/provider errors without breaking review flows.
- [ ] Add fixture-based tests for suggestion ranking and UI states.

### Tests

- [ ] Suggestion repository tests.
- [ ] Producer tests with deterministic fixture inputs.
- [ ] UI tests for accept/dismiss/manual override.
- [ ] Regression test that no suggestion auto-confirms a review item.

## Acceptance Criteria

- Users can accept review items without using AI suggestions.
- AI suggestions improve picker/merge flows but never commit without confirmation.
- Failed suggestion generation does not block timeline review.
- Suggestion decisions are persisted and auditable.

## Open Questions

- Which model/provider should power suggestions, and what budget/latency constraints apply?
- Should suggestions be generated on capture completion, on timeline load, or on demand in the accept UI?
- Should suggestion rationales be stored or regenerated?
- What telemetry is acceptable for evaluating suggestion usefulness?

