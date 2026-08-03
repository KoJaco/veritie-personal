# Veritie integration — env reference

## Server-only (required for capture)

| Variable | Required | Used by | Notes |
| --- | --- | --- | --- |
| `VERITIE_API_URL` | Yes | Proxy + `getServerVeritieClient()` | Veritie runtime base URL (no trailing slash). Example: `http://localhost:3001` |
| `VERITIE_PIPELINE_ALIAS` | Yes | Proxy + server client | Pipeline alias sent as `X-Veritie-Pipeline`. Example: `veritie-personal` |
| `VERITIE_API_KEY` | Recommended | Proxy + server client | Bearer token; never exposed to browser |
| `CAPTURES_PERSIST_SECRET` | Prod (scripts) | `POST /api/captures` | Bearer gate for programmatic persist; skipped in dev/test |
| `ALLOW_STUB_CAPTURE_MUTATIONS` | Optional | Persist pipeline | Default `true` in dev/test, `false` in production |

## Public (optional)

| Variable | Required | Used by | Notes |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_CAPTURE_LAUNCHER_ENABLED` | No | `AppShell` | Default `true`; set `false` to hide capture FAB |
| `NEXT_PUBLIC_VERITIE_API_URL` | No | — | **Not used** when capture goes via `/api/veritie` proxy |
| `NEXT_PUBLIC_VERITIE_PIPELINE_ALIAS` | No | — | **Not used** when capture goes via `/api/veritie` proxy |

## Not used

| Variable | Notes |
| --- | --- |
| `VERITIE_RUNTIME_BASE_URL` | Not referenced in this codebase; use `VERITIE_API_URL` instead |

## Example `.env` (local dev)

```env
NODE_ENV=development

VERITIE_API_URL=http://localhost:3001
VERITIE_PIPELINE_ALIAS=veritie-personal
VERITIE_API_KEY=vt_dev_local_key
ALLOW_STUB_CAPTURE_MUTATIONS=true

# Optional: hide capture launcher
# NEXT_PUBLIC_CAPTURE_LAUNCHER_ENABLED=false
```

## Example `.env` (staging / production scripts)

```env
NODE_ENV=production

VERITIE_API_URL=https://veritie.example.com
VERITIE_PIPELINE_ALIAS=veritie-personal
VERITIE_API_KEY=vt_prod_key
CAPTURES_PERSIST_SECRET=long-random-secret
ALLOW_STUB_CAPTURE_MUTATIONS=true
```

`ALLOW_STUB_CAPTURE_MUTATIONS` remains `true` until the database persistence branch lands.
