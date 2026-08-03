# Phase 1 — Routes, navigation, aspect lens, onboarding

## Scope

Physical route restructure, aspect lens, sidebar, personal onboarding, assistant entry pilot.

## Implementation checklist

- [x] `app/(app)/layout.tsx` with AppShell
- [x] Routes at `/timeline`, `/tasks`, `/records`, `/resources`, `/settings`, placeholders
- [x] `next.config.ts` redirects from `/work/*`
- [x] Aspect lens `?aspect=` via `lib/aspect-lens` + `lib/lens` bridge
- [x] PageModel `meta.aspect`
- [x] Sidebar Review/Plan/Library/System
- [x] Context rail `showTrigger: false` globally
- [x] `PageAssistantAction` on tasks route
- [x] Personal onboarding wizard
- [x] Removed `work/layout.tsx` double shell

## Verification

- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] `npm run build`

## Phase review

- [ ] Performance — redirect map, single AppShell
- [ ] Security — fixed redirect destinations
- [ ] Maintainability — `withAspectLens` / `withLens` bridge
