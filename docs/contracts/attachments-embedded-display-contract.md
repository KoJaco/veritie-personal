# Contract: Attachments Embedded Display Contract

## Purpose

Lock the frontend contract for attachment summaries and upload flows embedded in task, document, resource, scope/check, and connection surfaces.

## Active Route Taxonomy

Primary routes:

```txt
/work
/work/tasks
/work/tasks/[taskId]

/work/documents
/work/documents/[id]

/work/resources
/work/resources/[id]

/work/scopes
/work/scopes/[scopeSlug]/checks/[checkId]

/work/connections
/work/connections/[connectionId]
```

There is no canonical `/work/attachments` or `/work/evidence` route family.

## Relationship Model

```txt
Task -> Attachments
Task -> Documents

Attachments -> Tasks
Attachments -> Documents
Attachments -> Checks (derived summaries)

Resources -> Attachments (linked summaries)
```

Attachments are always accessed in context through the owning Work route.

## Embedded Surfaces

- Task detail: attachment list + upload flow
- Document detail: supporting attachments section
- Resource detail: linked attachment summaries
- Check detail: related attachment summaries
- Connection detail: generated attachment summaries where applicable

## Invariants

- Attachment sections render summary metadata only in rail-facing payloads.
- Upload flows call `POST /api/attachments/versions` through the generic client.
- Navigation links preserve the active scope lens via `withLens(...)`.
- Retired public route families must not appear in active UI copy or hrefs.

## References

- Related contracts: `docs/contracts/attachments-route-contract.md`, `docs/contracts/attachments-model-contract.md`, `docs/contracts/context-rail-contract.md`
