# Capture flow

End-to-end voice capture from launcher to stub persist.

## Sequence

```mermaid
sequenceDiagram
    participant User
    participant Launcher as GlobalCaptureLauncher
    participant Panel as VoiceCapturePanel
    participant Proxy as api_veritie
    participant Veritie as Veritie_Runtime
    participant BG as BackgroundPipeline
    participant Action as persistCaptureAction
    participant Stubs as Stub_Stores

    User->>Launcher: Open FAB, Voice log
    Launcher->>Panel: Render VoiceCapturePanel
    User->>Panel: Record audio
    Panel->>Veritie: Live stream chunks + STREAM_END
    loop Poll until transcript_ready
        Panel->>Proxy: GET /api/veritie/v1/jobs/{id}
        Proxy->>Veritie: getJob
    end
    Panel->>User: Show transcript + Done
    Panel->>BG: enqueue(jobId)
    User->>Panel: Done (exit anytime)
    BG->>Action: persistCaptureAction(jobId)
    Action->>Veritie: getJob (server client)
    Action->>Stubs: append transcript shell
    loop Poll until enrichment complete
        BG->>Veritie: getJob
    end
    BG->>Action: enrichCaptureAction(jobId)
    Action->>Stubs: merge extraction + timeline
```

## Key files

| Layer | File |
| --- | --- |
| Launcher shell | `components/capture/GlobalCaptureLauncher.tsx` |
| SDK wiring | `components/capture/VoiceCaptureLauncherPanel.tsx` |
| Recording + upload UI | `components/capture/VoiceCapturePanel.tsx` |
| Transcript readiness | `lib/capture/transcript-readiness.ts` |
| Background persist/enrich | `lib/capture/capture-background-pipeline.ts` |
| Veritie proxy | `app/api/veritie/v1/[...path]/route.ts` |
| Server Veritie client | `lib/veritie/server-client.ts` |
| Persist | `lib/capture/persist-capture-from-job.ts` |
| Job → stub mapping | `lib/capture/map-veritie-job.ts` |
| Script persist API | `app/api/captures/route.ts` |

## Out of scope (this branch)

- Database persistence (stub stores only)
- Session auth on proxy or persist paths
- SSE-based background enrichment (polling only)
