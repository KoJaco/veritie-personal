# Contract: PageModel Public API

## Purpose

Define the stable server-to-client boundary for route pages. `PageModel` is a public API consumed by client UI surfaces (including assistant rail context injection), not a convenience dump of page data.

## Scope

Covers PageModel shape, allowlisted keys, serialization constraints, payload budget, and fail-closed handling for invalid models. Excludes backend persistence schemas and page-specific rendering details.

## Versioning

- **Current version:** v1
- **Compatibility:** Backward compatible within v1 for additive optional fields only
- **Change policy:** Any top-level key change, invariant change, or payload budget policy change requires a contract version bump and explicit migration notes

## Definitions

- **PageModel**: Server-constructed object passed across the server/client boundary for page composition.
- **EntityRef**: Summary pointer object for domain entities (`kind`, `id`, and minimal descriptive fields).
- **Allowlist**: Explicitly permitted keys and value classes; all unknown keys are rejected at boundary validation.
- **Payload budget**: Maximum serialized size allowed for one PageModel payload.

## Contract Shape (Conceptual)

### Required fields

- `meta` — page-level metadata and scope summary.
- `view` — stable view identity and optional feature switches.
- `sections` — ordered presentation sections with ID/summarized references only.
- `capabilities` — boolean capability map for permitted actions.
- `actions` — explicit action keys available for this page.

### Optional fields

- `refs` — optional primary/visible summary references used by UI consumers.

### Top-level allowlist (v1)

- `meta`
- `view`
- `refs`
- `sections`
- `capabilities`
- `actions`

### Canonical shape (v1)

```ts
type PageModel = {
    meta: {
        title: string;
        description?: string;
        breadcrumbs: Array<{ label: string; href?: string }>;
        scope: { scopeId: string | "all" };
    };
    view: {
        key: string;
        featureFlags?: Record<string, boolean>;
    };
    refs?: {
        primary?: EntityRef;
        visible?: EntityRef[];
    };
    sections: Array<{
        key: string;
        title?: string;
        kind: string;
        dataRef?: EntityRef | { kind: string; id: string };
        items?: Array<
            EntityRef | { kind: string; id: string; summary?: string }
        >;
    }>;
    capabilities: Record<string, boolean>;
    actions: {
        available: string[];
    };
};
```

## Invariants (Must Always Hold)

- Pages are Server Components only; PageModel is constructed on the server.
- PageModel values are JSON-safe primitives, arrays, and plain objects only.
- No class instances, Dates, Maps, Sets, functions, Symbols, or BigInt values.
- `sections` and `refs` include IDs and summaries only.
- No raw markdown blobs, full documents, or unbounded raw records in PageModel.
- Unknown top-level keys are rejected by allowlist validation.
- `actions.available` contains action keys only, not executable functions.
- Scope metadata in `meta.scope` must align with canonical URL scope semantics.

## Payload Budget (v1)

- **Hard max serialized size:** 32 KB (`JSON.stringify(pageModel).length <= 32768`)
- **Soft warning threshold:** 24 KB
- Breaching hard max is a contract violation and must fail closed.

### Why a payload budget?

- PageModel is: a public server -> client contract, injected into RSC, and also partially injected into our context rail. This makes it a performance, security, and cognitive boundary. Budget is imposed to stop accidentally bloating assistant context, mitigate slow route transitions, stop shipping large arrays into client components, and prevent passing full records due to convenience.
- 32kb is suggested but could change in the future. I think it's small enough to be a good hard limit (not allowed to push lots of db rows but also large enough to comfortably )
- RSC serialization overhead protection.. server components serialize props across a boundary, so large JSON blobs would increase server render time, serialization time, transfer time, hydration cost (etc).

## Error Handling

If PageModel validation fails (shape, type, allowlist, or size):

- Do not hydrate invalid payload into client state.
- Render safe fallback UI for the affected page section.
- Emit structured server logs with validation failure reason (without leaking raw documents).
- Surface an internal error code suitable for review/reconciliation.

## Examples

### Minimal valid example

```json
{
    "meta": {
        "title": "Work",
        "breadcrumbs": [{ "label": "Work", "href": "/work" }],
        "scope": { "scopeId": "all" }
    },
    "view": { "key": "work_overview" },
    "sections": [
        {
            "key": "blocking_tasks",
            "kind": "task_list",
            "items": [
                {
                    "kind": "task",
                    "id": "task_123",
                    "summary": "2 checks blocked"
                }
            ]
        }
    ],
    "capabilities": { "canEdit": false, "canUploadAttachment": true },
    "actions": { "available": ["tasks/createTask", "attachments/createAttachment"] }
}
```

### Invalid example

```json
{
    "meta": {
        "title": "Attachments",
        "breadcrumbs": [],
        "scope": { "scopeId": "operations-readiness" }
    },
    "view": { "key": "attachment_detail" },
    "sections": [
        {
            "key": "document",
            "kind": "markdown_blob",
            "items": [
                {
                    "kind": "document",
                    "id": "doc_1",
                    "rawMarkdown": "# Full raw doc ..."
                }
            ]
        }
    ],
    "capabilities": { "canEdit": true },
    "actions": { "available": ["attachments/updateDocument"] },
    "debugDump": { "everything": true }
}
```

Expected handling: reject due to unallowlisted top-level key (`debugDump`) and raw document payload violation.

### Operational notes

- Validate at the server boundary before passing PageModel into client-consumed components.
- Keep PageModel deterministic to support auditing, caching, and test snapshots.
- Treat PageModel as an API surface; changes require contract review.

### References

- Related ADRs: `docs/adr/0012-server-page-client-route-boundary-and-suspense.md`
- Related ADRs: `docs/adr/0011-dashboard-model-builder-refactor-boundary.md`
- Related contracts: `docs/contracts/route-state-boundary-contract.md`
- Related contracts: `docs/contracts/context-rail-contract.md`
