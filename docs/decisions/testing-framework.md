# Decision Note: Testing Framework Setup

## Date

2026-01-02

## Summary

Establishes Jest as the default test runner with Next.js integration, defines testing conventions and style guide for unit and component tests. Focuses on utility testing initially, with clear separation between unit tests (utils) and component tests.

## Decision

Use Jest with Next.js built-in integration (`next/jest`) as the testing framework. Tests are organized in `__tests__` directories co-located with source files. Testing Library is used for component testing when needed. No E2E testing in this baseline setup.

## Rationale

-   **Next.js integration**: `next/jest` automatically configures Jest for Next.js, handling TypeScript, path aliases, and environment setup
-   **Familiar ecosystem**: Jest is widely adopted with extensive documentation and community support
-   **Testing Library**: Provides accessible, user-focused component testing patterns
-   **Incremental adoption**: Allows adding tests incrementally without blocking feature development
-   **CI/CD ready**: Jest works well in CI environments with coverage reporting

## Testing Framework Configuration

### Jest Setup

-   **Config file**: `jest.config.ts`
-   **Setup file**: `jest.setup.ts` (runs before each test file)
-   **Integration**: Uses `next/jest` for automatic Next.js configuration
-   **Environment**: jsdom for component testing support
-   **Path aliases**: Supports `@/*` imports matching TypeScript config

### Test Scripts

-   `npm test` - Run tests once
-   `npm test:watch` - Run tests in watch mode (development)
-   `npm test:ci` - CI mode with coverage and limited workers

## Testing Style Guide

### File Organization

-   **Unit tests**: Co-located in `__tests__` directories next to source files
    -   Example: `lib/errors/normalize.ts` → `lib/errors/__tests__/normalize.test.ts`
-   **Component tests**: Co-located in `__tests__` directories next to components
    -   Example: `components/system/error-state.tsx` → `components/system/__tests__/error-state.test.tsx`
-   **Test file naming**: `*.test.ts` or `*.test.tsx` (also accepts `*.spec.ts`)

### Test Structure

-   Use `describe` blocks to group related tests
-   Use descriptive test names that explain what is being tested
-   Follow Arrange-Act-Assert pattern
-   One assertion per test when possible (but pragmatic - multiple related assertions are acceptable)

**Example structure:**

```typescript
describe("functionName", () => {
    describe("specific behavior", () => {
        it("should handle case X", () => {
            // Arrange
            const input = ...;
            
            // Act
            const result = functionName(input);
            
            // Assert
            expect(result).toBe(expected);
        });
    });
});
```

### Test Conventions

-   **Descriptive names**: Test names should clearly describe what is being tested
    -   Good: `"should normalize Error instances with stack traces"`
    -   Bad: `"test1"` or `"works"`
-   **Group related tests**: Use nested `describe` blocks for logical grouping
-   **Edge cases**: Test null/undefined, empty values, invalid inputs
-   **Error cases**: Test error handling and edge cases, not just happy paths

### Assertions

-   Use Jest matchers (`toBe`, `toEqual`, `toContain`, etc.)
-   Use Testing Library queries for component tests (`getByRole`, `getByText`, etc.)
-   Prefer specific matchers over generic ones (`toBe` over `toEqual` when comparing primitives)

### Mocks and Stubs

-   Mock Next.js router hooks in `jest.setup.ts` (already configured)
-   Mock external dependencies when needed
-   Use `jest.fn()` for function mocks
-   Keep mocks simple and focused

### Coverage

-   Coverage collection configured for `lib/**` and `components/**`
-   Coverage reports generated in CI (`npm test:ci`)
-   Focus on testing critical paths and utilities first
-   Do not use global 100% coverage as the target; use risk-based and contract-based priorities
-   Contract-critical boundaries should target very high coverage (ideally 100% where feasible)
-   Coverage policy and required invariant test areas are defined in `docs/decisions/testing-coverage-strategy.md`

## Test Types

### Unit Tests (Primary Focus)

-   Test pure functions and utilities
-   Test error handling utilities
-   Test logging utilities
-   Test data transformation functions
-   Fast, isolated, no side effects

### Component Tests (Minimal, When Needed)

-   Use Testing Library for component rendering
-   Test component behavior, not implementation details
-   Focus on user-visible behavior
-   Test error states, loading states, user interactions

### What's NOT Included

-   **E2E tests**: Out of scope for this baseline (Playwright/Cypress)
-   **Integration tests**: Focus on unit tests initially
-   **Snapshot tests**: Not included in baseline (can be added later if needed)

## Example Test Patterns

### Utility Function Test

```typescript
import { normalizeError } from "../normalize";

describe("normalizeError", () => {
    describe("null/undefined handling", () => {
        it("should handle null errors", () => {
            const result = normalizeError(null);
            expect(result.name).toBe("UnknownError");
            expect(result.message).toBe("An unknown error occurred");
        });
    });
});
```

### Component Test (Future Pattern)

```typescript
import { render, screen } from "@testing-library/react";
import { ErrorState } from "../error-state";

describe("ErrorState", () => {
    it("should render error message", () => {
        render(<ErrorState message="Test error" />);
        expect(screen.getByText("Test error")).toBeInTheDocument();
    });
});
```

## Impact

-   **Developer Experience**: Clear testing patterns reduce cognitive load
-   **Code Quality**: Tests catch regressions early
-   **Confidence**: Tests enable safe refactoring
-   **Documentation**: Tests serve as executable documentation
-   **CI/CD**: Automated testing in CI pipeline

## Configuration Details

### Jest Config (`jest.config.ts`)

-   Uses `next/jest` for Next.js integration
-   Test environment: `jsdom` (for component testing)
-   Module name mapper: `@/*` → `./*` (matches TypeScript paths)
-   Test discovery: `__tests__/**/*.[jt]s?(x)` and `**/?(*.)+(spec|test).[jt]s?(x)`
-   Coverage: Collects from `lib/**` and `components/**`

### Setup File (`jest.setup.ts`)

-   Imports `@testing-library/jest-dom` for DOM matchers
-   Mocks Next.js navigation hooks (`useRouter`, `usePathname`, `useSearchParams`)
-   Console suppression commented out (can be enabled for debugging)

## Follow-ups

-   [ ] Add component tests for system components as needed
-   [ ] Consider adding snapshot tests if component regression testing becomes important
-   [ ] Add E2E testing framework (Playwright/Cypress) in future branch if needed

## References

-   Branch: `chore/devx-foundation`
-   Active plan: `docs/branch-plan.md`
-   Jest Config: `jest.config.ts`
-   Jest Setup: `jest.setup.ts`
-   Example Tests: `lib/errors/__tests__/normalize.test.ts`, `lib/logging/__tests__/safe-serialize.test.ts`
-   Coverage Strategy: `docs/decisions/testing-coverage-strategy.md`
