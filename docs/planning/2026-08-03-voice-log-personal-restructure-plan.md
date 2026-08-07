# Voice-Log Personal App Restructure Plan

Date: 2026-08-03

## Summary

Restructure the domain-agnostic platform shell into a voice-log-first personal organisation and life admin app. Preserve AppShell, PageModel, data-source adapters, ContextRail, and MarkdownRenderer. Replace global assistant FAB with capture launcher; assistant opens via page-level `assistant/open` action.

## Phased execution

| Phase | Focus |
| --- | --- |
| 0 | Domain types, Drizzle schema (no runtime), aspect taxonomy |
| 1 | Route tree (`/timeline`, `/tasks`, …), aspect lens `?aspect=`, nav, onboarding |
| 2 | Stub rewrite + timeline/capture read models |
| 3 | Timeline MVP |
| 4 | Global capture launcher + Veritie SDK (voice) |
| 5 | Captures routes + indexed drilldown |
| 6 | Review state, records hardening, import |
| Post-MVP | Today, Goals/Money UI, persistence, extra capture modes |

Post-MVP domain projection, list context, habits, timebox, usable reminder push notifications, and capture profiles: see [`2026-08-07-domain-projection-and-capture-surfaces-plan.md`](2026-08-07-domain-projection-and-capture-surfaces-plan.md).

Checklists: `docs/todos/phase-N-*.md`

## Key decisions

- Drop `/work` prefix; default landing `/timeline` until Today post-MVP
- Aspect IDs: all, finance, fitness, work, personal, admin
- Documents → Records early (`/records`)
- Scopes/checks redirect to `/timeline`; connections redirect to `/settings`
- Capture launcher: voice only initially; real Veritie SDK
- Global FAB: capture only; no global assistant trigger

## Supersedes

- `2026-06-08-domain-agnostic-migration-plan.md` (migration complete; this plan is the new canonical initiative)
