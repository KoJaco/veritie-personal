# Voice log persistence — manual E2E checklist

1. Record a voice log → transcript appears → tap **Done** immediately → wait ~60s → open `/captures` and confirm the capture appears with extraction count (no manual refresh).
2. Repeat but stay in the capture dialog → confirm indexed extraction tree appears with animation after enrichment completes.
3. Enable **Save voice log audio** in Settings → record → confirm playback works in the indexed panel.
4. Disable save audio → record → confirm no upload occurs and no audio player is shown.
