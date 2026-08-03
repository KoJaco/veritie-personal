# Decision Note: DevX Foundation Setup

## Date

01-02-2026

## Summary

This decision establishes the developer experience (DevX) foundation for the frontend application, focusing on error handling, logging, and testing infrastructure. This work is scoped strictly to foundational utilities and conventions—no product features, domain logic, or workflow implementations.

## Decision

Establish baseline DevX infrastructure with standardized error handling, logging, and testing frameworks. This includes:

1. **Error Handling**: App Router error boundaries and shared error utilities
2. **Logging**: Server and client logging primitives with environment-gated verbosity
3. **Testing**: Jest-based test framework with unit and component test support

## Rationale

-   **Predictable error handling**: Standardized error boundaries and utilities prevent inconsistent error UX and reduce debugging time
-   **Observability**: Consistent logging primitives enable better debugging and monitoring without vendor lock-in
-   **Testability**: Jest baseline enables incremental test coverage without blocking feature development
-   **Separation of concerns**: DevX utilities are presentational/system-level and do not assume domain concepts, keeping them reusable and maintainable

## Scope

### In Scope

-   **Error Handling**

    -   App Router error boundary files (`app/error.tsx`, `app/not-found.tsx`, segment-level variants)
    -   Error normalization utilities (`lib/errors/normalize.ts`)
    -   Recoverability helpers (`lib/errors/is-recoverable.ts`)
    -   Generic error UI components (`components/system/error-state.tsx`)

-   **Logging**

    -   Server-side logger (`lib/logging/server-logger.ts`)
    -   Client-side logger (`lib/logging/client-logger.ts`)
    -   Correlation ID utilities (`lib/logging/correlation.ts`)
    -   Safe serialization helpers (`lib/logging/safe-serialize.ts`)

-   **Testing**
    -   Jest configuration and setup
    -   Test utilities and helpers
    -   Example unit tests for error and logging utilities

### Out of Scope

-   Product features or UI workflows
-   Task state machine or permissions model
-   E2E testing (Playwright/Cypress)
-   Monitoring vendor integration (Sentry, Datadog)
-   Log shipping or remote collection
-   Domain-specific error types or business logic

## Conventions

### File Locations

-   **Error utilities**: `lib/errors/*`

    -   `normalize.ts` - Error normalization
    -   `is-recoverable.ts` - Recoverability detection

-   **Logging utilities**: `lib/logging/*`

    -   `server-logger.ts` - Server-side logging
    -   `client-logger.ts` - Client-side logging
    -   `correlation.ts` - Request correlation IDs
    -   `safe-serialize.ts` - Safe JSON serialization

-   **System components**: `components/system/*`

    -   `error-state.tsx` - Generic error UI component

-   **App Router error files**: Standard Next.js App Router conventions
    -   `app/error.tsx` - Global error boundary
    -   `app/not-found.tsx` - Global 404
    -   `app/{segment}/error.tsx` - Segment-level error boundaries
    -   `app/{segment}/not-found.tsx` - Segment-level 404

### Naming Conventions

-   Error utilities use kebab-case filenames (`normalize.ts`, `is-recoverable.ts`)
-   Logging utilities use kebab-case filenames (`server-logger.ts`, `client-logger.ts`)
-   System components use kebab-case filenames (`error-state.tsx`)
-   All utilities are presentational/system-level—no domain assumptions

### Environment Gating

-   Debug logs only enabled in development
-   Error stack traces gated by environment (never exposed in production)
-   Client logging disabled/noisy logs suppressed in production builds

## Impact

-   **Developer Experience**: Faster debugging, consistent error handling patterns, testable utilities
-   **Code Organization**: Clear separation between DevX utilities and domain logic
-   **Maintainability**: Standardized patterns reduce cognitive load when adding new features
-   **Future Extensibility**: Foundation allows incremental addition of monitoring, E2E tests, etc. without refactoring

## Follow-ups

-   [ ] Implement error handling infrastructure (section 2)
-   [ ] Implement logging infrastructure (section 3)
-   [ ] Set up Jest testing framework (section 4)
-   [ ] Verify all implementations meet requirements

## References

-   Branch: `chore/devx-foundation`
-   Active plan: `docs/branch-plan.md`
