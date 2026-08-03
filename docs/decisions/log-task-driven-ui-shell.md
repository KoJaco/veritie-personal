# Decisions Log

This log records decisions made during scaffolding.
Deferred items are explicitly marked.

---

## Decided

-   UI model is task-driven, not object-driven
-   Stable shell inspired by IBM OpenPages
-   TaskShell includes TaskHeader, Main, TaskContext
-   Sidebar belongs to AppShell, not TaskShell
-   TaskContext is first-class and always rendered
-   SDUI allowed only inside task execution modules
-   Activity history is mandatory for all tasks

---

## Deferred

-   Exact task state machine
-   Task capability/permission schema
-   Attachment storage backend
-   Realtime updates (WebSocket vs polling)
-   Mobile behavior for TaskContext
-   Bulk task actions

Deferred items must be resolved before MVP feature freeze.
