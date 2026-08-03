# Veritie proxy integration

## Checklist

- [x] `lib/veritie/proxy-request.ts` — forward helper with server-injected auth
- [x] `app/api/veritie/v1/[...path]/route.ts` — GET/POST proxy; PUT/PATCH/DELETE rejected
- [x] `VoiceCaptureLauncherPanel` — `useVeritie({ baseUrl: "/api/veritie" })`
- [x] Proxy unit tests
- [x] `.env.example` updated

## Architecture

Browser SDK calls that need Veritie credentials go through the Next proxy:

1. `POST /api/veritie/v1/jobs` → create job
2. `PUT` to signed `upload.url` → **direct to storage** (no proxy, no API key)
3. `POST /api/veritie/v1/jobs/{id}/upload-finalize` → finalize
4. `GET /api/veritie/v1/jobs/{id}` → poll enrichment

Persist (after transcript ready):

- Browser → `persistCaptureAction` server action → `getServerVeritieClient().getJob()` → stub stores

Scripts / admin:

- `POST /api/captures` with `Authorization: Bearer $CAPTURES_PERSIST_SECRET` (skipped in dev/test)

## Local dev runbook

1. Copy `.env.example` to `.env`
2. Set server Veritie vars:

   ```env
   VERITIE_API_URL=http://localhost:3001
   VERITIE_PIPELINE_ALIAS=veritie-personal
   VERITIE_API_KEY=your-dev-key
   ALLOW_STUB_CAPTURE_MUTATIONS=true
   ```

3. Start Veritie runtime (port must match `VERITIE_API_URL`)
4. `npm run dev` — **restart after SDK changes** (`npm run build:sdk` if `dist` is stale)
5. Open app → capture FAB → Voice log → record → stop
6. Confirm transcript appears and capture shows on `/timeline`

No `NEXT_PUBLIC_VERITIE_*` vars are required when using the proxy.

### WSL / Windows host

If Veritie runs on the **Windows host** and Next.js runs in **WSL**, `localhost:3001` inside WSL may not reach it. Use your Windows host IP or `host.docker.internal`:

```env
VERITIE_API_URL=http://host.docker.internal:3001
```

Verify from the same shell as `npm run dev`:

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/
```

## Manual E2E verification

- [ ] Microphone permission granted; recording starts and stops cleanly
- [ ] Upload completes (network tab: `POST /api/veritie/v1/jobs`, direct PUT to signed URL, finalize, `GET` polls)
- [ ] Transcript renders in capture panel
- [ ] Capture appears in `/timeline` stub index after save
- [ ] Retry save works from `save_failed` state if persist is temporarily unavailable

## Interim security note

Without session auth, any same-origin caller can hit `/api/veritie/*` and consume Veritie quota. This is acceptable for this branch; session gating is deferred to the next branch.

The proxy **always** overwrites `Authorization` and `X-Veritie-Pipeline` from server env, so client-supplied credentials are ignored.

## Deferred

- Session auth on `/api/veritie/*`
- Database-backed persist (replace stub stores)
- Live WebSocket capture in UI
- Rate limiting on proxy
