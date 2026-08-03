# Lease v0 pipeline handle contract

Lease v0 defines the current client-side semantics for prepared pipeline handles in `@veritie/sdk`.

## Supported semantics

- A prepared handle is one-shot. `startCapture()`, `startUpload()`, and post-consume `stream()` reuse are rejected once the handle is consumed.
- `close()` is local-only. It shuts down local stream/session resources and prevents further start or stream actions, but it does not revoke the server lease.
- There is no background renewal loop or lease daemon in the SDK.
- Live upload consumption begins on the first successful chunk send, not when the websocket opens.
- Pre-consumption live reprepare is single-use. The SDK may create one replacement prepared lease before consumption when the initial live open is stale or expires.
- SSE snapshot/detail responses remain canonical. Local handle state only reflects client-known interim transitions until stream snapshots or `refresh()` provide canonical runtime state.

## Current boundaries

- No dedicated lease API/resource is required for Lease v0.
- No automatic long-lived renewal behavior is provided.
- Prepared-handle lifecycle semantics are internal stabilization behavior for the current SDK/runtime-validation flow, not a stronger long-term lease guarantee.
