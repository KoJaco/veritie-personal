# Phase 4 — Capture launcher + Veritie SDK

## Checklist

- [x] `framer-motion` dependency
- [x] `@veritie/sdk` local package
- [x] `GlobalCaptureLauncher` in AppShell
- [x] Removed global assistant Sparkles FAB
- [x] `POST /api/captures` persist stub pipeline
- [x] Voice-only capture panel

## Verification

- [x] Manual capture with Veritie API configured (polling via `hasPendingJobEnrichment`)
- [x] `npm run build`

## Phase review

- [x] Performance: audio blob cleanup on recorder stop; job polling capped at 40 polls
- [x] Security: capture persist via server API route
- [x] Maintainability: capture UI in `components/capture/`
