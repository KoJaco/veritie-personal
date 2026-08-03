# Domain-Agnostic Migration Current Status

Date: 2026-08-03 (documentation neutralization audit complete)

## Executive Summary

The domain-agnostic migration is complete. The public `/work` shell, runtime read
models, stub seeds, markdown fixture registry, and active documentation now use
neutral vocabulary (tasks, resources, documents, attachments, checks, scopes).

Latest verified baseline after slice 16:

- TypeScript passes.
- Terminology check passes (code, fixtures, and active documentation guards).
- Full Jest passes.
- Lint passes with existing warnings.
- Production build passes.

## Completed Slice History

| Slice | Status | Result |
| --- | --- | --- |
| Foundation through fixture normalization (1–11) | Complete | See `2026-08-02-slice-log-11-fixture-normalization.md` |
| Documentation cleanup | Complete | Canonical contracts/architecture docs; legacy material archived |
| Entity tagging neutralization | Complete | See `2026-08-02-slice-log-15-entity-tagging-neutralization.md` |
| Documentation neutralization audit | Complete | See `2026-08-03-slice-log-16-documentation-neutralization-audit.md` |

## Active Documentation Index

See [`docs/README.md`](../README.md) for the canonical contract and architecture map.

Superseded full copies live under [`docs/archive/superseded/`](../archive/superseded/). Short redirect stubs remain at legacy paths under `docs/contracts/` and `docs/architecture/`.

## Current Guardrails

- Do not reintroduce retired public route families.
- New stub/fixture code must use attachment/resource/check seed vocabulary.
- Active documentation under `docs/contracts/`, `docs/architecture/`, and `docs/decisions/` must not describe retired surfaces or legacy domain vocabulary as current (enforced by `scripts/check-terminology.mjs`).

## Optional Follow-ups

- Neutralize markdown artifact **body copy** inside fixture `.md` files.
- Add superseded banners to historical ADRs that still mention retired routes in body text (ADRs remain historical records; ADR-0010 and active references updated in slice 16).
