# Branch 07 - Records and Resources

Suggested branch: `feature/records-resources`

## Objective

Replace the legacy compliance-era records surface with personal records, and complete resource projection from accepted timeline items. Records hold durable knowledge and notes; resources hold people, places, services, subscriptions, tools, and other reusable entities.

## Depends On

- Branch 01 projection foundation.

## In Scope

- Personal `records` route rebuild using `db/schema/objects.ts`.
- Record projection on accept.
- Resource projection on accept.
- Resource merge prompt for deterministic name matches.
- Manual create/edit for records and resources.
- Link provenance to captures/extracted values.
- Preserve existing resource route strengths while removing stale `/work` redirects if touched.

## Out of Scope

- Full document management/compliance workflow.
- Rich collaborative editing.
- External knowledge sync.
- AI semantic merge beyond suggestions in Branch 10.

## Implementation Checklist

### Records Schema and Read Model

- [ ] Confirm `records` table supports title, kind, markdown content, aspect, links, and provenance.
- [ ] Replace legacy `objects` adapter usage on `/records`.
- [ ] Add repository methods for index/detail/create/update/delete or archive.
- [ ] Preserve route contracts for `/records` and `/records/[id]`.

### Record Projection

- [ ] Map title, kind, markdown content, aspect, source quote, and provenance.
- [ ] Add resolution UI for "new record" vs "append to existing" if included in this branch.
- [ ] If append is deferred, accept creates a new record only and documents the limitation.
- [ ] Rollback deletes created record if unedited and single-source.
- [ ] Rollback removes appended source content only if the edit model can do so safely; otherwise keep record and remove provenance.

### Resources

- [ ] Confirm current resource repository and API behavior.
- [ ] Add resource projection mapper for name, category, summary, aspect ids, and provenance.
- [ ] Add deterministic exact-name merge prompt on accept.
- [ ] Add manual edit path for projected resources.
- [ ] Keep resource detail sections working with projected data.

### Route UI

- [ ] Rebuild `/records` as personal notes/knowledge, not compliance documents.
- [ ] Add record detail with markdown content.
- [ ] Ensure `/resources` shows projected and manually created resources consistently.
- [ ] Add source/provenance affordance where useful, without making the UI noisy.

### Tests

- [ ] Records repository tests.
- [ ] Record projection accept/rollback tests.
- [ ] Resource projection accept/rollback tests.
- [ ] Merge prompt/action tests.
- [ ] Route tests for records index/detail and resources index/detail.

## Acceptance Criteria

- `/records` no longer depends on the legacy compliance objects adapter.
- Accepted records appear in `/records`.
- Accepted resources appear in `/resources`.
- Exact duplicate resource names trigger a merge decision rather than silent duplication.
- Rollback is safe for created, merged, and edited rows.

## Open Questions

- Should append-to-existing-record ship in this branch or wait until editor semantics are stronger?
- Should resources use `aspectIds` from the start, aligned with goals?
- Should record kinds be constrained (`note`, `checklist`, `journal`, `document`) or free text initially?
- Should deleting a record/resource hard delete or archive?

