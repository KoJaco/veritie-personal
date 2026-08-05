# Phase 3 handoff — Drizzle persistence

## Flip to database-backed reads/writes

1. Set `DATABASE_URL` to your Supabase transaction pooler URL.
2. Set `PLATFORM_SHELL_FE_DATA_SOURCE=backend` (optional — `DATABASE_URL` alone auto-selects backend unless `stub` is explicit).
3. Restart the dev server.

CI and Jest remain on stub mode (`PLATFORM_SHELL_FE_DATA_SOURCE=stub`, no `DATABASE_URL`).

## What uses the database

| Surface | Tables |
| --- | --- |
| Voice capture persist | `captures`, `voice_logs`, `transcript_segments`, `extraction_runs`, `extracted_values`, `timeline_events`, `usage_events` |
| Timeline / captures UI | Same capture graph + `timeline_events` |
| Resources | `resources` |
| Tasks | `tasks` |
| Settings (read) | `users`, `user_profiles`, `accounts` |

Still stub: objects/records compliance UI, checks, connections, attachments, goals, money, dashboard.

## Verification checklist

### Voice capture

1. Sign in, record a voice capture.
2. Confirm rows (account-scoped):

```sql
SELECT id, veritie_job_id, status FROM captures WHERE account_id = '<your-account-id>';
SELECT usage_type, quantity FROM usage_events WHERE account_id = '<your-account-id>' AND usage_type = 'voice_log';
SELECT count(*) FROM timeline_events WHERE account_id = '<your-account-id>';
```

3. Refresh timeline and captures — data should match DB, not seed IDs.

### Duplicate persist

Repeat persist for the same `veritie_job_id` within the account — response should include `duplicate: true` and the existing `captureId`.

### Resources

Create a resource in the UI → row in `resources` with your `account_id`.

### Tasks

New backend users see an **empty task list** until tasks exist in `tasks` (or are promoted from captures in a future branch). Stub onboarding tasks only appear when `PLATFORM_SHELL_FE_DATA_SOURCE=stub`.

### Settings

Settings page shows profile email/name from `users` / `user_profiles` (team/RBAC sections empty).

## Auth on writes

| Entry | Auth |
| --- | --- |
| `persistCaptureAction` / enrich | `requireUser()` → `accountId` on persist |
| `POST /api/captures` | Session (`requireUser`) in backend mode; bearer gate in stub mode |
| `POST /api/resources` | `requireUser()` |
| Review state updates | `requireAccountScope()` via repository |

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Still seeing seed data | `getDataSourceKind()` — env `stub` wins over `DATABASE_URL` |
| 401 on capture API | Backend mode requires session; use server action from browser |
| Empty tasks | Expected for new accounts in backend mode |
| Pooler timeouts on large transcripts | Single transaction insert; consider chunking in Phase 4 |

## Programmatic API routes

| Route | Backend mode | Stub mode |
| --- | --- | --- |
| `POST /api/captures` | `requireUser()` | Bearer / dev bypass |
| `POST /api/extracted-values/review` | `requireUser()` + DB repository | Stub read-model |
| `GET /api/timeline/events/[eventId]` | `getDataSourceAdapters()` (DB) | Stub adapters |

All use `requireProgrammaticApiAccess()` from `lib/api/require-programmatic-api-access.ts`.

## Related docs

- [db-access.md](../architecture/db-access.md) — tenancy + repository pattern
- [phase-3-drizzle-persistence.md](./phase-3-drizzle-persistence.md) — implementation checklist
