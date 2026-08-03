# Architecture — Context Rail Resolver

## Purpose

Describe the single-shell context rail system, how route identity is derived, and how server payloads are merged into a client contract.

## Scope

Covers dashboard routes under `/work/*`, the client route resolver, payload store, rail controller, and the contract/tabs mapping. Excludes implementation details of individual tab UIs and backend data loading.

## Components

-   **AppShellClient**: Single client boundary at `/work/layout.tsx` that hosts rail layout and controller.
-   **ContextPayloadSlot**: Hydrated leaf that writes server payloads into client state.
-   **Context payload store (Zustand)**: Stores the latest payload for the current route.
-   **Client route resolver**: Uses `useSelectedLayoutSegments()` to derive `routeId` and merge with payload into `RailContract`.
-   **Route config registry**: Defines tabs, default tab, and enabled/trigger behavior per route.
-   **RailController**: Renders `ContextRail` and trigger based on contract + rail state.
-   **ContextRail**: Renders tabs from the contract and chooses pinned vs overlay based on rail state.
    -   **Tab components**: Client-only components that render tab content from the contract + context payload.
    -   **Server pages**: Remain server-rendered; fetch data, render main UI, and emit a minimal serializable context payload.

## Boundaries

-   Server routes only provide minimal serializable payloads via `ContextPayloadSlot`.
-   Client determines route identity and contract; server payload does not influence routeId.
-   `ContextRail` is rendered once; pinned layout provides only the docking container.
 -   The single client boundary is mounted by the `/work/layout.tsx` server layout via `AppShellClient`.

## Invariants

-   `routeId` is derived from layout segments only.
-   `RailContract` is derived purely from route config and current payload.
-   Unknown routes disable rail and trigger.
-   `ContextRail` renders a single instance; pinned vs overlay is state-driven.
-   `ContextTab` must not assume `primaryObject.type === "attachment"`.
-   `recent_activity` appears only on the dashboard; `activity` appears elsewhere.
 -   Server pages decide “what the page is about” and provide the payload; the client decides “how the rail behaves” (tabs, trigger, default tab).

## Non-Goals

-   Defining UI content for tabs beyond placeholders.
-   Backend data fetching strategies for attachments, activity, or metadata.
 -   Using server payloads to derive route identity.
