DEPRECATED: Logic moved to context-rail-contract.md

# Contract: TaskContext State Management

## Purpose

Defines the state management contract for TaskContext, including valid states, transitions, and persistence rules.

## Scope

This contract covers:

- TaskContextState type definition
- State transition methods
- SessionStorage persistence contract
- State initialization and hydration

Out of scope:

- TaskContext UI rendering (component implementation)
- Responsive behavior details (covered in ADR 0003)

## Versioning

- **Current version:** v1
- **Compatibility:** Backward compatible
- **Change policy:** Breaking changes require ADR

## Definitions

- **TaskContextState**: Union type `"CLOSED" | "OPEN_OVERLAY" | "PINNED_DOCKED"`
- **SessionStorage key**: `"taskContextState"` (string literal)
- **Persistence**: Storing PINNED_DOCKED preference in browser sessionStorage

## Contract Shape (Conceptual)

### State Type

```typescript
type TaskContextState = "CLOSED" | "OPEN_OVERLAY" | "PINNED_DOCKED";
```

### Context Interface

```typescript
interface TaskContextContextType {
    state: TaskContextState;
    setState: (state: TaskContextState) => void;
    open: () => void;
    close: () => void;
    toggle: () => void;
    pin: () => void;
    unpin: () => void;
}
```

### State Transitions

- **CLOSED → OPEN_OVERLAY**: Via `open()` when no persisted pinned state
- **CLOSED → PINNED_DOCKED**: Via `open()` when persisted state exists, or via `pin()`
- **OPEN_OVERLAY → CLOSED**: Via `close()` or `toggle()`
- **OPEN_OVERLAY → PINNED_DOCKED**: Via `pin()`
- **PINNED_DOCKED → OPEN_OVERLAY**: Via `unpin()`
- **PINNED_DOCKED → CLOSED**: Via `close()` or `toggle()` (preserves persistence)

## Invariants (Must Always Hold)

1. **Persistence Rules**:
    - `PINNED_DOCKED` state is persisted to sessionStorage with key `"taskContextState"`
    - Persisted state is checked on component mount (initialization)
    - Closing `PINNED_DOCKED` does NOT remove sessionStorage entry (preserves preference)
    - Only `unpin()` removes sessionStorage entry

2. **State Initialization**:
    - On mount, check sessionStorage for `"taskContextState"`
    - If value is `"PINNED_DOCKED"`, initialize state as `PINNED_DOCKED`
    - Otherwise, initialize as `CLOSED`
    - Server-side rendering (SSR) always initializes as `CLOSED`

3. **Transition Behavior**:
    - `open()` checks sessionStorage and opens as `PINNED_DOCKED` if persisted, else `OPEN_OVERLAY`
    - `close()` always sets state to `CLOSED` (does not modify sessionStorage)
    - `toggle()` calls `open()` if closed, `close()` if open
    - `pin()` sets state to `PINNED_DOCKED` and persists to sessionStorage
    - `unpin()` sets state to `OPEN_OVERLAY` and removes sessionStorage entry

4. **Hook Usage**:
    - `useTaskContext()` must be called within `TaskContextProvider`
    - Hook throws error if used outside provider

## Error Handling

- Invalid state values in sessionStorage are ignored (defaults to `CLOSED`)
- `useTaskContext()` throws descriptive error if used outside provider
- SessionStorage failures (quota, disabled) are handled gracefully (no persistence, no crash)

## Examples

### Valid State Flow

```typescript
// Initial state (no persistence)
state = "CLOSED"

// User opens context
open() → state = "OPEN_OVERLAY"

// User pins context
pin() → state = "PINNED_DOCKED", sessionStorage.setItem("taskContextState", "PINNED_DOCKED")

// User closes pinned context
close() → state = "CLOSED", sessionStorage still contains "PINNED_DOCKED"

// User navigates to new task, opens context
open() → state = "PINNED_DOCKED" (restored from sessionStorage)

// User unpins
unpin() → state = "OPEN_OVERLAY", sessionStorage.removeItem("taskContextState")
```

### Invalid Usage

```typescript
// Using hook outside provider
function SomeComponent() {
    const { state } = useTaskContext(); // Error: must be within TaskContextProvider
}

// Invalid state value in sessionStorage
sessionStorage.setItem("taskContextState", "INVALID");
// Result: Initializes as "CLOSED" (invalid value ignored)
```

## Operational Notes

- SessionStorage is session-scoped (cleared on browser tab close)
- Persistence survives page navigation within same session
- State is client-side only (no SSR state hydration)
- State changes trigger re-renders of consuming components

## References

- Related ADR: `docs/adr/0002-task-context-state-management.md`
- Related Decision: `docs/decisions/sessionstorage-persistence-strategy.md`
- Implementation: `components/task/TaskContextProvider.tsx`
