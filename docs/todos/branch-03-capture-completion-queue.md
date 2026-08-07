# Branch 03 - Capture Completion Queue

Suggested branch: `feature/capture-completion-queue`

## Objective

Make post-transcript voice capture completion durable. After transcript readiness, the client should enqueue server-owned work and the capture should finish persisting/extracting/indexing even if the app closes, the tab dies, or the device sleeps.

## Depends On

- Current voice capture flow.
- Existing Veritie job lease registry.
- Existing capture persist/enrich helpers.

## In Scope

- `capture_completion_jobs` table and repository.
- Durable enqueue endpoint at `POST /api/captures/jobs/:jobId/complete`.
- Claim/retry/backoff/lease state machine.
- Opportunistic in-process runner.
- Manual retry for failed jobs.
- Observability and admin/debug visibility.
- Client handoff change so success means durable enqueue, not client-owned completion.

## Out of Scope

- General-purpose queue abstraction for every app workflow unless it falls out naturally.
- Dedicated always-on worker process unless Phase 3 is explicitly pulled into this branch.
- Reminder delivery jobs. This branch should create the pattern reminders reuse.

## Implementation Checklist

### Schema

- [ ] Add `capture_completion_jobs` with fields from the queue plan.
- [ ] Add status enum or text constraint for `queued`, `running`, `waiting_veritie`, `succeeded`, `failed`, `cancelled`.
- [ ] Add indexes for claim queries and account diagnostics.
- [ ] Add uniqueness by active `veritie_job_id`.

### Repository

- [ ] Implement enqueue/upsert by Veritie job id.
- [ ] Implement claim with row locking and expired lease handling.
- [ ] Implement transition helpers for running, waiting, succeeded, failed, cancelled, retry.
- [ ] Keep all repository methods account-scoped where user-visible.
- [ ] Store compact, safe `last_error` values.

### API

- [ ] Replace non-durable handoff behavior in `POST /api/captures/jobs/:jobId/complete`.
- [ ] Validate session and job id.
- [ ] Verify Veritie job lease ownership before enqueue.
- [ ] Return `202` with completion job id and status.
- [ ] Optionally nudge the runner with `after()` as an optimization only.

### Runner

- [ ] Add bounded runner that claims due jobs.
- [ ] Persist capture shell idempotently.
- [ ] Poll Veritie once or a bounded number of times.
- [ ] Move pending extraction/indexing to `waiting_veritie` with `run_after`.
- [ ] Enrich capture once ready.
- [ ] Back off retryable errors and fail terminal errors.
- [ ] Prevent concurrent processing of the same job.

### UI

- [ ] Voice panel treats `202` enqueue as durable handoff.
- [ ] If enqueue fails, show retryable warning before allowing silent close.
- [ ] Captures/timeline show processing state until job succeeds.
- [ ] Failed jobs have an account-visible retry path.

### Tests

- [ ] Repository enqueue idempotency.
- [ ] Repository claim ordering and lock expiry.
- [ ] Runner success path.
- [ ] Runner waiting path.
- [ ] Runner retryable failure path.
- [ ] Runner terminal failure path.
- [ ] API auth/lease tests.
- [ ] Voice panel handoff test.

## Acceptance Criteria

- Closing the browser after transcript readiness does not prevent capture completion.
- Re-enqueueing the same Veritie job does not create duplicate captures.
- A stuck `running` job can be reclaimed after lease expiry.
- Failed jobs expose enough state to retry and debug.
- Existing immediate transcript UX remains unchanged.

## Open Questions

- Should this branch include a generic queue interface or keep capture-specific code first?
- What max attempt count and backoff schedule should be used in production?
- Which authenticated reads should opportunistically nudge the runner?
- Should failed completion jobs be surfaced to users only on capture detail, or also in a diagnostics route?

