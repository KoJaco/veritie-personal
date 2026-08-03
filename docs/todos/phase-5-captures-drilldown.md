# Phase 5 — Captures routes + drilldown

## Checklist

- [x] `/captures` index
- [x] `/captures/[captureId]` detail with transcript + extraction
- [x] `CaptureIndexedSurface` — segment highlight, audio, click-to-highlight
- [x] Timeline rows and drawer link to `/captures/[id]?anchor=…`

## Verification

- [x] Navigate from timeline capture links
- [x] `npm run build`

## Phase review

- [x] Performance: audio uses native controls; segments in-memory only
- [x] Security: extraction JSON rendered as text/pre, not raw HTML
- [x] Maintainability: indexed UI isolated in `components/indexed-result/`
