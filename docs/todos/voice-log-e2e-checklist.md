# Voice log persistence — manual E2E checklist

1. Record a voice log → transcript appears → tap **Done** immediately → wait ~60s → open `/captures` and confirm the capture appears with extraction count (no manual refresh).
2. Repeat but stay in the capture dialog → confirm indexed extraction tree appears with animation after enrichment completes.
3. Enable **Save voice log audio** in Settings → record → confirm playback works in the indexed panel (audio uploads during transcript wait, not after Done).
4. Disable save audio → record → confirm no upload occurs and no audio player is shown.
5. After enrichment completes, open `/captures/[captureId]` → confirm **IndexedResultSurface** shows extraction tree, clickable highlights on transcript, and signed audio playback when save audio is enabled.
6. Confirm capture detail uses persisted index artifacts (not live Veritie fetch) — works after enrichment even if Veritie job is no longer leased.
