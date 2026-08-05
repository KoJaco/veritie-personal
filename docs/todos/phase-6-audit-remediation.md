# Phase 6 — Audit remediation

Tracks closure of the independent security audit on `feat/db-auth-persistence`. See [phase-6-verification.md](./phase-6-verification.md) for the merge gate.

## Findings

| # | Severity | Topic | Status |
| --- | --- | --- | --- |
| 1 | High | Veritie job lease on all job-scoped proxy paths | [x] `assertVeritieJobOwnedByAccount` for GET/POST job paths |
| 2 | High | Route-level auth on `/api/chat` and `/api/attachments/versions` | [x] `requireSessionApiAccess`, Zod schemas |
| 3 | High | Session refresh wiring | [x] Documented `proxy.ts` (Next 16 middleware); comment in `lib/supabase/server.ts` |
| 4 | Medium | Bounded body reading | [x] `lib/api/read-bounded-body.ts` on all POST APIs |
| 5 | Medium | Server env in client bundle | [x] `server-only` on env/logger; client logger in Markdown |
| 6 | Medium | Backend mode crashes on deferred adapters | [x] Empty backend adapters + records page cleanup |
| 7 | Medium | RLS privilege scoping | [x] `db/rls/04_policies_privilege.sql` (manual apply) |
| 8 | Low | Secret-aware log serialization | [x] Key-name redaction in `safe-serialize.ts` |
| 9 | High | `users_update` / `users_insert` JWT escalation | [x] Dropped in `04_policies_privilege.sql` |
| 10 | Medium | Proxy JSON 401 for `/api/*` | [x] `proxy.ts` returns 401 JSON; pages still redirect |

## Manual follow-ups

- [ ] Apply or re-apply `db/rls/04_policies_privilege.sql` on target Supabase project (includes `users_update` / `users_insert` drops) — **deploy step**; verify with [`05_verify_privilege.sql`](../../db/rls/05_verify_privilege.sql)
- [ ] RLS spot-check: JWT `INSERT` on `audit_logs` / `roles` fails; tenant `SELECT` works — **merge approver**
- [ ] Per-user rate limiting on chat/veritie proxy (deferred)

## Key files

| Area | Files |
| --- | --- |
| Veritie leases | `lib/veritie/job-path.ts`, `app/api/veritie/v1/[...path]/route.ts` |
| API auth | `lib/api/require-session-api-access.ts` |
| Body limits | `lib/api/read-bounded-body.ts`, `lib/api/body-limits.ts` |
| Deferred adapters | `lib/data-source/backend/deferred-adapters.ts` |
| RLS | `db/rls/04_policies_privilege.sql` |
