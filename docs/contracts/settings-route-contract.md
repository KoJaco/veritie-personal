# Contract: Settings Route

## Purpose

Define the frontend contract for the platform-level `Settings` route at `/work/settings`.

## Scope

Included:

- Profile summary section
- Team management overview section
- Permissions/capabilities preview section
- Scope mapping configuration and remediation section

Out of scope:

- Persisted profile, team, or permissions edits
- Backend mutation flows
- Full policy/config management beyond the current stub-backed admin surface

## Invariants

- The page is platform-global and does not foreground lens controls in the header.
- The route reads through `DataSourceAdapters.settings.getSettings()`.
- The page remains inspection-first: CTAs and links may suggest admin actions, but this branch does not persist changes.
- Scope mapping configuration remains the canonical remediation destination for invalid scope mapping state.

## Core Data Shape

- `profile`: current user summary, role, and last login
- `team[]`: workspace members with role and invite/active state
- `capabilities[]`: permission/capability preview for the current workspace role setup
- `scopeMapping`: mapping validity state plus remediation links and top validation errors

## References

- Related plan: `docs/planning/2026-06-08-domain-agnostic-migration-plan.md`
- Related code: `app/(app)/work/settings/page.tsx`
