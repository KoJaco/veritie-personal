# Branch 04 - Reminders and Push Delivery

Suggested branch: `feature/reminders-push-delivery`

## Objective

Make reminders usable. A reminder should be projectable from the timeline, visible and editable in `/reminders`, and deliverable through PWA push even when the app is closed. If push is unavailable, the reminder must remain visible as overdue in-app.

## Depends On

- Branch 01 projection foundation.
- Branch 03 capture completion queue or equivalent durable worker pattern.
- Existing PWA service worker registration.

## In Scope

- Reminder projection on accept and rollback.
- `/reminders` route implementation.
- Manual create/edit/delete/snooze/dismiss.
- Web Push subscription storage per user/device.
- Notification permission/readiness UI.
- Due-reminder server worker/queue.
- Push delivery through service worker.
- In-app overdue fallback.
- Delivery diagnostics and retry/backoff.

## Out of Scope

- External calendar sync.
- Native mobile push beyond web/PWA push.
- AI reminder creation beyond existing extraction.
- Complex natural-language recurrence editing beyond stored recurrence strings unless already supported.

## Implementation Checklist

### Schema

- [ ] Add `push_subscriptions` with account id, user id, endpoint, p256dh key, auth key, device label/user agent, status, last failure, timestamps.
- [ ] Add reminder delivery state on `reminders` or a sibling `reminder_delivery_jobs` table.
- [ ] Track at least last attempt, last success, next due run, failure reason, dismissed/snoozed state, and recurrence metadata.
- [ ] Add indexes for due reminder claim queries.
- [ ] Add uniqueness for active push subscription endpoint.

### Push Setup

- [ ] Add server-side VAPID config validation.
- [ ] Add subscription create/update/delete API.
- [ ] Add client helper to request permission only from a user action.
- [ ] Register/update subscription after service worker is ready.
- [ ] Handle revoked permissions and expired subscriptions.
- [ ] Add service worker `push` and `notificationclick` handlers.

### Reminder Projection

- [ ] Add reminder mapper for title, remindAt, recurrence, aspect, target type/id, and provenance.
- [ ] Accept without blocking if no push subscription exists.
- [ ] Surface optional readiness prompt after accepting a reminder if notifications are not enabled.
- [ ] Rollback cancels future delivery when the projected reminder row is deleted.

### Route UI

- [ ] Replace `/reminders` placeholder.
- [ ] Add sections for upcoming, overdue, and delivered/dismissed.
- [ ] Add create/edit/delete controls.
- [ ] Add snooze and dismiss actions.
- [ ] Add notification readiness banner only when attention is needed.
- [ ] Show per-reminder delivery diagnostics when dispatch fails.
- [ ] Ensure `/today` can later consume overdue/upcoming reminder read models.

### Worker

- [ ] Claim due active reminders from durable state.
- [ ] Send Web Push to all active subscriptions for the target user/device policy.
- [ ] Mark success/failure per reminder and subscription.
- [ ] Back off transient push failures.
- [ ] Disable or mark dead subscriptions on permanent push endpoint failures.
- [ ] Calculate next recurrence run after successful delivery.
- [ ] Keep processing idempotent if the same due reminder is claimed twice.

### Privacy and UX

- [ ] Decide default notification body privacy: full title vs generic "Reminder due".
- [ ] Ensure notification click opens the relevant reminder or `/reminders`.
- [ ] Avoid noisy permission prompts during timeline accept.
- [ ] Provide in-app fallback for denied/unavailable push.

### Tests

- [ ] Projection tests for reminder accept/rollback.
- [ ] Push subscription API tests.
- [ ] Worker due-claim tests.
- [ ] Worker success/failure/retry tests with mocked Web Push.
- [ ] Service worker behavior covered by targeted tests if existing tooling supports it.
- [ ] Route tests for upcoming/overdue/dismissed states.
- [ ] Manual PWA push test in production-like HTTPS environment.

## Acceptance Criteria

- Accepting a reminder creates a reminder row and schedules delivery.
- A due reminder sends a push notification when the app is closed.
- Denied push permission does not make reminders disappear; overdue reminders are visible in-app.
- Snooze and dismiss update both route state and delivery state.
- Rollback of a projected reminder cancels future delivery when safe.
- Expired push subscriptions do not break the worker loop.

## Open Questions

- Should notifications include reminder titles by default, or use privacy-preserving generic copy?
- Should a reminder notify every subscribed device or only the most recently active device?
- Which recurrence syntax is authoritative: raw extraction text, normalized RRULE, or a constrained app enum?
- Should VAPID keys be required in all environments or only production-like environments?

