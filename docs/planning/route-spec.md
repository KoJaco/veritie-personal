# /work (or /work) — Task-driven home

> Status: historical route sketch.
>
> This file predates the current domain-agnostic route contract. It is useful for
> understanding early route thinking, but it is not the active implementation
> spec. Use `docs/planning/2026-07-16-domain-agnostic-current-status.md`,
> `docs/contracts/context-rail-contract.md`, and route-local contracts under
> `app/(app)/work/**/_page-model/` for current behavior.

## Purpose

“What should I do next?” + show progress toward compliance outcomes.

## UI to display

- “Next actions” (assigned to me / due soon / blocked)
- “In progress” workstreams (by framework/project if we're supporting that?, otherwise by tag)
- Recent activity feed (evidence uploaded, artifacts generated, tasks completed)

## Data needed

### Next actions (task list)

- `task.id`
- `title`
- `status` (todo/in-progress/blocked/done)
- `priority` (optional but useful)
- `dueAt` (optional)
- `assignee` (me / teammate)
- `objectRef` (if task belongs to a policy/control)
- `evidenceMissingCount` (derived if possible)
- `updatedAt`

### Activity feed

- `type` (evidence_uploaded / artifact_version_created / task_status_changed)
- `actor`
- `timestamp`
- `target` (task/evidence/object)
- `summary`

## Sorting / filtering

- Tabs: **Mine**, **Team** (if we're supporting teams initially), **Overdue**
- Sort: due date asc, priority desc, updated desc
- Filters: status, assignee, tag (optional)

## Subroutes

- Probs none; links out to `/tasks/:id`, `/evidence/:id`, `/objects/:id`.

## Rail payload (scope: dashboard)

- `scope: { type: "dashboard" }`
- `primaryObject: { type: "dashboard" }`
- `context: { topTasks: [...ids], overdueCount, openEvidenceRequests }` (minimal)
- `assistantRailTabs: ["assistant"]`

---

# /tasks and /tasks/:taskId — Work execution layer

## /tasks index UI layout

- Header: “Tasks”
- Controls row: search + filters + sort
- Main: task table or cards

### Task row fields (MVP)

- `title`
- `status`
- `priority` (optional but maybe worth it for MVP)
- `dueAt` (or “No due date”)
- `assignee`
- `relatedObject` (policy/control name or ID)
- `evidenceStatus` (one of: none/required/missing/complete) OR `missingEvidenceCount`
- `updatedAt`

### Optional but potentially high val

- `framework` / `controlId` (if we're supporting frameworks and controls for MVP)
- `tags` (risk, access-control, logging, vendor)

## Sorting / filtering

- Search: title + control/policy name
- Filters:
    - status
    - assignee (me / anyone)
    - due: overdue / due this week
    - evidence: missing only
    - related object (policy/control) (can be a dropdown later)

- Sort:
    - dueAt asc
    - updatedAt desc
    - priority desc

## Subroutes

- `/tasks/:taskId` (detail)
- (Optional later) `/tasks?view=board` (kanban).. not in MVP unless required

## Rail payload

### /tasks index

- `scope: { type: "task_index" }`
- include `filters` state? (not necessary)

### /tasks/:taskId

- `scope: { type: "task_detail", id }`
- `primaryObject: { type: "task", id }`
- `data`:
    - `title`, `status`, `priority`, `assignee`
    - `relatedObjectId` (if present)
    - `evidenceRequiredCount`, `evidenceAttachedCount`

---

# /evidence and /evidence/:evidenceId — Evidence management

This is the biggest “list UX” route.

## /evidence index UI layout (MVP)

acting like both an inbox and a library:

- Top: **summary chips/cards**: Missing evidence, Needs review, Recently uploaded
- Controls: search + filters + sort
- Main list: evidence rows (table) OR cards (table is better for scanning but cards often look cleaner if we have descriptive text)

### Evidence list row fields (must-have)

- **Name / filename** (or “Evidence: <type>” if generated)
- **Type** (file type + semantic type if you have it)
    - `fileMime` (pdf/png/docx/xlsx/etc)
    - `evidenceType` (optional enum like “policy”, “screenshot”, “export”, “ticket”, “report”)

- **Status**
    - `state`: `requested | uploaded | needs_review | accepted | rejected | expired`

- **Linked to**
    - `taskId` (or task title)
    - `objectId` (policy/control)

- **Uploaded by**
- **Uploaded at**
- **Freshness / period**
    - either `validFrom/validTo` or simple `evidenceDate`

- **Notes/summary** (1-line excerpt; optional but helpful)
- **Last activity** (updatedAt)

### Probably include in MVP

- `source` (manual upload vs integration: Jira/GitHub/Azure)
- `tags` (SOC2, ISO, Access Control, Logging)
- `confidence` / “AI matched to control”

## Sorting / filtering

### Filters

- Status: missing/requested, needs_review, accepted, rejected
- Linked route:
    - “Linked to task” (has taskId)
    - “Unlinked” (no task/object)

- Date:
    - uploaded last 7/30/90 days

- Type:
    - PDF / Image / Spreadsheet / Doc

- Source:
    - manual / Jira / GitHub / Azure AD (later)

### Sort options

- newest upload first
- needs review first
- oldest missing first (requestedAt asc)
- expiry soonest first (validTo asc) if we're tracking it

## Evidence index empty states (important)

- “No evidence yet” -> CTA: upload evidence
- “No results for filters” -> clear filters

## /evidence/:id detail UI layout

Two-column is nice, but MVP can be:

- Header: evidence title + status + linked items + actions
- Main:
    - Preview pane (inline preview where possible)
    - Metadata panel (what/why/linked control/task)
    - History panel (version/audit -- decide whether this is in the context rail or a separate view / route)

### Evidence detail data

- everything from list row +
- `storageUrl` (signed)
- `sizeBytes`
- `checksum` (optional but we should support from the get go)
- `extractedText` (later, for easy search + ref)
- `aiSummary` (optional; thinking we're aiming for this to be generated as a default?)
- `reviewDecision` (accepted/rejected + reason)
- `linkedControls[]` / `linkedTasks[]` (many-to-many eventually)

## Rail payload

### Evidence index

- `scope: { type: "evidence_index" }`
- `data: { missingCount, needsReviewCount }` // how much context are we giving our AI per route? In index routes (list), we have to be careful not to overwhelm our assistant

### Evidence detail

- `scope: { type: "evidence_detail", id }`
- `primaryObject: { type: "evidence", id }`
- `data: { filename, status, linkedTaskId?, linkedObjectId?, uploadedAt }`

---

# /objects and /objects/:objectId — Artifact library

“Policy/control/risk output” catalog.

## /objects index UI layout

- Header: “Documents”
- Filter chips by type: Policies / Controls / Risks / Assessments
- List/table

### Object list row fields (MVP)

- `title`
- `objectType` (policy/control/risk/assessment/roadmap)
- `status` (draft/in_review/approved) .. even if we fake this for now
- `owner` (user/team)
- `updatedAt`
- `version` (latest version number)
- `linkedTasksCount`
- `linkedEvidenceCount` (optional but useful)

### Sorting / filtering

- Filter by type
- Filter by status
- Search by title/content keywords (content search later; title now)
- Sort: updated desc, title asc, status

## /objects/:id detail UI layout

- Header: title + status + actions (generate new version, edit, export)
- Main: markdown render (already have this)
- Side panel (or tabs): metadata, linked tasks, linked evidence, version history

### Required detail data

- `object.id`, `title`, `type`, `status`
- `currentVersion { number, createdAt, createdBy, markdown }`
- `summary` (optional)
- `links: tasks[], evidence[]`

## Rail payload

### Documents index

- `scope: { type: "documents_index" }`
- `data: { countsByType }`

### Object detail

- `scope: { type: "object_detail", id }`
- `primaryObject: { type: "object", id }`
- `data: { title, type, status, version }`

---

# /connections — (parked)

Got got Azure AD, GitHub, Jira planned..

UI build is something like this:

## static metadata per service:

- `key` (e.g. "azure_ad", "github", "jira")
- `label, icon`
- `authType: "oauth" | "api_key" | "manual" | "cloud_role"`
- `scopes`: // read only
- `capabilities`: // what we can sync (repos, users, evidence, etc)
- `setupSteps`: UI copy + requirements
- `minPlan / gating`: // later maybe

`connection` stored per tenant/acc:

- `id`
- `integrationKey`
- `status: "disconnected" | "connected" | "error" | "pending" | "revoked"`
- `connectedAt, lastSyncedAt`
- `connectedByUserId`
- `externalAccountLabel`
- `health` // last err, failing resource counts, etc
- `config` // non-secret display stuff
- `secretsRef` // backend-only ref, never reveil in client

`connectionRun / syncJob`

- `jobId`, `status`, `startedAt`, `completedAt`, `summary`

## The flow:

- connections index displays cards for each integration (status pill, 'connect' button, 'manage' button if connected)
- connect dialog flow (explain what we need / why, permissions/scopes shown clearly, CTA -> continue to 'service')
- Auth handshake (varies by authType)... oAuth - redirect out, come back to /connections/cakkback/<key>, api_key = user pastes key + clicks 'verify', cloud_role - user performs steps in their dashboad (create role/app registration) then 'verify'.
- verify + create conn ... backend validates creds and creates `Connection` record. Sets stauts to connected, stores secrets securly, returns display info ('connected as org X').
- Initial sync... immediately start 'initial sync' - show progress UI, when done show 'lastSyncAt' and 'View imported items".

Backend endpoints (need clarifications):

- POST `/v1/connections/:key/oauth/start` - returns authUrl
- GET `/v1/connections/:key/oauth/callback?code=...&state=...` - exchanges code for tokens, creates conn, redirects back to UI.
- POST `/v1/connections/:key/verify` - hit with {apiKey}. Backend calls 'whoami' to validate. on success create `connection` + store secret.

Note: state should encode tenantId + userId + nonce (signed). Tokens stored in secure store. Store `externalAccountLabel` for UI.

---

# /settings — Account & Access Control only (MVP)

## /settings layout

Left nav:

- Profile
- Team (users)
- Roles & permissions (if you expose)
- Security (2FA later, session management later)
- Billing (trial gating later)

For MVP, keep it minimal.

## Settings data needed

### Profile

- `name`
- `email`
- `role`
- `lastLoginAt`

### Team

To be split between a few distinct roles... we have the `user` who want to get, say SOC2 compliance. We have maybe an `admin` type who comes in and manages the team + gets stuff done. And we have the `auditer`, who comes in and audits the team's compliance.

- `users[]`: name, email, role, status (invited/active)
- Invite flow:
    - email
    - role selection
    - resend invite / revoke invite (optional)

### Access control

Even if RBAC isn’t fully built in UI, show:

- current role
- role capabilities summary (read-only list)

## Sorting / filtering

- Team: search by name/email, filter invited vs active

## Rail

Disable rail here (per earlier decision)

---

# Cross-cutting: what should be “task-driven” here?

In IA terms, “task-driven” means:

- the user lands on **Work** and sees **actions**, not documents
- tasks are the primary navigation primitive
- objects/evidence are reachable from tasks as dependencies

So in MVP:

- Work → Tasks list is main path
- Evidence + Documents are “libraries” that support tasks
- Evidence index should emphasize “missing / needs review” first (inbox behavior)

---

# Quick naming: “objects” vs “artifacts”

Given current route is `/objects`, keep it for now and standardize language:

- **Route name:** Documents (stable URL)
- **UI label:** “Library” or “Documents” (more human)
- **Internal term:** Artifact (fine in code/docs)
