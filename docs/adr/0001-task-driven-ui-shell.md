# ADR 0001 — Task-Driven UI with Stable Shell (OpenPages-inspired)

> **Historical note:** Written during previous product framing. Current implementation uses domain-agnostic Work vocabulary (tasks, attachments, scopes, checks). Retired route names below describe original intent, not current surfaces.

## Status

Accepted

## Date

01-02-2026

## Context

This frontend was originally scoped for a previous product framing where users primarily perform work through
tasks (e.g. attachment requests, assessments, remediation, approvals).

Early design decisions must prioritize:

-   predictable execution flows
-   role-aware task handling
-   auditability and traceability

**NOTE**: need to confirm this direction with Matt.

## Decision

The platform adopts a **task-driven UI model** inspired by IBM OpenPages.

We will implement a **stable shell** composed of:

-   AppShell: global sidebar + global header
-   TaskShell: task header + main work area + TaskContext (right rail)

The shell is static and predictable.
Dynamic rendering is limited to task execution modules inside the main work area (this would be where server-driven UI may come in).

TaskContext is first-class and always available, containing:

-   Associations (controls, obligations, risks, entities)
-   Evidence / artifacts
-   Activity / audit trail

## Rationale

-   Users in that framing optimized for task execution, not navigation
-   Auditability requires consistent placement of history and evidence
-   Stable shells required for ease of use
-   Permissions and task state transitions must be server-authoritative

SDUI acceptable **within tasks** (module selection), but not for
global layout or navigation.

## Consequences

-   Layout flexibility is intentionally constrained
-   A canonical Task View Model is required server-side
-   Activity and state transitions become core domain concepts
-   UI iteration happens at the module level, not the shell level

## Follow-ups

-   Define Task View Model (TaskViewDTO)
-   Implement task worklists as primary entry points
