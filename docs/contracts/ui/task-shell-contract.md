# Contract: TaskShell Component Interface

## Purpose

Defines the stable API and behavioral contract for the TaskShell component, which serves as the core layout structure for all task execution views.

## Scope

This contract covers:

- Component props interface
- Scroll behavior contract
- Layout constraints and invariants
- Slot composition rules

Out of scope:

- Task data fetching or business logic
- TaskContext state management (covered in separate contract)
- Responsive breakpoint details (covered in ADR 0003)

## Versioning

- **Current version:** v1
- **Compatibility:** Backward compatible
- **Change policy:** Breaking changes require ADR

## Definitions

- **TaskShell**: The container component that provides task execution layout
- **TaskHeader**: The header slot containing task metadata and actions
- **Main Work Area**: The primary content slot for task execution modules
- **TaskContext**: The right-side panel containing associations, attachments, and activity

## Contract Shape (Conceptual)

### Required Props

- `header: ReactNode` — TaskHeader component or equivalent
- `children: ReactNode` — Main work area content (task execution modules)
- `context: ReactNode` — TaskContext component or equivalent

### Component Structure

```
TaskShell
├── TaskContextProvider (wraps all content)
└── TaskShellContent
    ├── TaskHeader (slot: header)
    ├── Separator
    └── Main Content Area
        ├── Main Work Area (slot: children)
        └── TaskContext (slot: context, conditional on state)
```

## Invariants (Must Always Hold)

1. **Scroll Contract**:
   - AppShell sidebar and header are fixed (do not scroll)
   - Main content area (`<main>`) scrolls independently
   - TaskHeader scrolls with page content (not sticky)
   - TaskContext has its own internal scroll area (separate from main)

2. **Layout Stability**:
   - TaskShell must fill available height and width of parent container
   - Layout shifts only occur when TaskContext transitions between CLOSED/OPEN_OVERLAY and PINNED_DOCKED
   - Main work area width adjusts when TaskContext is pinned (reduced by 320px / `w-80`)

3. **Composition Rules**:
   - TaskShell wraps content with TaskContextProvider
   - TaskContext is conditionally rendered based on state (PINNED_DOCKED in layout, OPEN_OVERLAY outside layout)
   - Header and children are always rendered

4. **Height Constraints**:
   - TaskShell uses `h-full w-full` to fill parent
   - Main content area uses `flex-1 min-h-0` for proper flex scrolling
   - TaskContext pinned container uses `h-full overflow-hidden`

## Error Handling

- If TaskContextProvider is missing, `useTaskContext` hook throws error
- Invalid state transitions are handled by TaskContextProvider (see TaskContext state contract)

## Examples

### Minimal Valid Usage

```tsx
<TaskShell
  header={<TaskHeader />}
  context={<TaskContext />}
>
  <TaskContractPlaceholder />
</TaskShell>
```

### Invalid Usage

```tsx
// Missing required props
<TaskShell>
  <SomeContent />
</TaskShell>

// Using useTaskContext outside TaskShell
function SomeComponent() {
  const { state } = useTaskContext(); // Error: must be within TaskShell
}
```

## Operational Notes

- TaskShell is a client component (`"use client"`) due to TaskContextProvider
- Padding and spacing are handled internally (`py-12 px-6`)
- Transition animations are applied when TaskContext state changes (`transition-all`)

## References

- Related ADR: `docs/adr/0001-task-driven-ui-shell.md`
- Related ADR: `docs/adr/0002-task-context-state-management.md`
- Related Contract: `docs/contracts/ui/task-context-state-contract.md`
- Implementation: `components/static/TaskShell.tsx`, `components/static/AppShell.tsx`

