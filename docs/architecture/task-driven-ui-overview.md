# Task-Driven UI Architecture Overview

## Purpose

Describe the high-level UI architecture and responsibilities of each shell
without prescribing implementation details.

## Shells

### AppShell (Global)

-   Persistent sidebar navigation
-   Global header (account, environment, user. These are all placeholders and subject to change.)
-   Owns navigation only
-   Never depends on task data

**Responsive Behavior:**
- Sidebar: Always visible on desktop (≥xl), Sheet drawer on mobile (<xl)
- Header: Mobile menu toggle (<xl), responsive search and area label

### TaskShell (Workspace)

-   Used for all task execution views
-   Composed of:
    -   TaskHeader (status, priority, primary action)
    -   Main Work Area (task execution modules)
    -   TaskContext (associations, attachments, activity)

**State Management:**
- Wrapped with TaskContextProvider for state coordination
- TaskContext supports three states: CLOSED, OPEN_OVERLAY, PINNED_DOCKED
- State persistence via sessionStorage for pinned preference

**Responsive Behavior:**
- TaskContext: Bottom drawer on mobile (<lg), overlay/pinned on desktop (≥lg)
- Main work area width adjusts when TaskContext is pinned

This is my understanding:

-   TaskShell does not fetch data.
-   It renders server-supplied view models.

## Scroll Contract

The scroll behavior is explicitly defined to ensure predictable UX:

1. **AppShell sidebar and header**: Fixed (do not scroll)
2. **Main content area** (`<main>`): Scrolls independently
3. **TaskHeader**: Scrolls with page content (not sticky)
4. **TaskContext**: Has its own internal scroll area (separate from main)

This contract ensures that context information remains accessible while users scroll through task content.

## State Management Patterns

### TaskContext State

TaskContext uses a three-state system managed by TaskContextProvider:

- **CLOSED**: Panel not visible
- **OPEN_OVERLAY**: Non-modal overlay (desktop only)
- **PINNED_DOCKED**: Fixed right column, layout shift

State transitions are coordinated through context methods (`open`, `close`, `toggle`, `pin`, `unpin`). Pinned preference persists in sessionStorage across navigation.

### AppSidebar State

AppSidebar open/close state is managed by AppSidebarProvider, scoped to mobile breakpoint behavior.

## Design Principles

-   Tasks are the primary abstraction
-   Navigation is secondary to execution
-   Activity history is always visible
-   Layout stability > configurability
-   Permissions are server-evaluated
-   User preferences persist within session

## Boundaries

- **AppShell vs TaskShell**: AppShell provides global navigation, TaskShell provides task-specific layout
- **TaskShell vs Task Modules**: TaskShell provides layout structure, modules provide task-specific content
- **State Management**: TaskContextProvider scoped to TaskShell, AppSidebarProvider scoped to AppShell

## Invariants

- TaskShell must fill available height/width of parent
- Scroll contract must be maintained (see Scroll Contract section)
- TaskContext state transitions must respect responsive breakpoints
- Layout shifts only occur when TaskContext transitions to/from PINNED_DOCKED

## Non-Goals

-   No fully dynamic page layout
-   No client-side task data fetching in shell components
-   No permanent user preference storage (session-scoped only)
