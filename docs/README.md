# Documentation Guide

This directory is the durable record for platform decisions, contracts, and migration intent.

## What belongs here

- architecture decisions
- stable contracts
- routing and assistant-context invariants
- migration plans and slice logs
- durable tradeoff records

## What does not belong here

- obvious implementation detail
- temporary brainstorming that has no execution value
- duplicated code comments or schema dumps

## Primary documentation areas

- `docs/adr/` for durable architectural decisions (historical ADRs may retain legacy names)
- `docs/architecture/` for system shape and responsibility boundaries
- `docs/contracts/` for stable public or cross-layer contracts
- `docs/decisions/` for tactical implementation choices
- `docs/planning/` for active migration planning and slice history
- `docs/archive/` for superseded or intentionally retained historical material

## Current canonical plan

- `docs/planning/2026-06-08-domain-agnostic-migration-plan.md`
- `docs/planning/2026-08-02-domain-agnostic-current-status.md`

## Active route contracts (canonical)

| Surface | Contract |
| --- | --- |
| `/work` overview | `docs/contracts/work-route-contract.md`, `docs/contracts/work-model-contract.md` |
| `/work/tasks` | route-local packages under `app/(app)/work/tasks/_page-model/` |
| `/work/documents` | route-local packages under `app/(app)/work/documents/_page-model/` |
| `/work/resources` | `docs/contracts/resources-route-contract.md` |
| `/work/scopes` | `docs/contracts/scopes-route-contract.md` |
| scope check detail | `docs/contracts/scope-check-inspection-contract.md` |
| attachments (embedded) | `docs/contracts/attachments-route-contract.md`, `docs/contracts/attachments-model-contract.md`, `docs/contracts/attachments-embedded-display-contract.md` |
| scope lens | `docs/contracts/scope-lens-contract.md`, `docs/contracts/scope-matching-contract.md` |
| context rail | `docs/contracts/context-rail-contract.md` |
| page model | `docs/contracts/page-model-contract.md` |

## Active architecture notes

- `docs/architecture/work-model-pipeline.md`
- `docs/architecture/scope-lens-flow.md`
- `docs/architecture/route-state-boundary-flow.md`
- `docs/architecture/context-rail-resolver.md`
- `docs/architecture/task-driven-ui-overview.md`

## Superseded material

Retired domain-specific contracts remain as short redirect stubs under `docs/contracts/` and full archived copies under `docs/archive/superseded/`. Do not treat those archived documents as current implementation guidance.

Historical branch planning lives at `docs/archive/superseded/branch-plan.md`.

Historical ADRs may retain original product framing with a banner; see slice log 16 for the documentation neutralization audit.
