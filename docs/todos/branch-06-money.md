# Branch 06 - Money

Suggested branch: `feature/money`

## Objective

Make `/money` useful for expenses, income, bills, and subscriptions captured from voice logs. Money entries should be projectable, editable, filterable, and auditable through provenance.

## Depends On

- Branch 01 projection foundation.

## In Scope

- Money entry projection on accept and rollback.
- `/money` route implementation.
- Manual create/edit/delete.
- Filters by type, category, merchant/payee, date, aspect, and amount range where practical.
- Basic summaries for current month and recent entries.
- Handling bill-like entries without building full reminder/calendar sync.
- Links to resources for subscriptions/merchants when available.

## Out of Scope

- Bank account connections.
- Receipt OCR unless already produced by capture extraction.
- Budgeting engine.
- Tax reporting.
- External accounting export.

## Implementation Checklist

### Schema and Domain

- [ ] Confirm `money_entries` fields against `lib/domain/money.ts`.
- [ ] Add missing indexes for account/date/type/category.
- [ ] Decide whether planned bills use `dueAt`, `occurredAt`, or both.
- [ ] Add provenance link behavior through projection foundation.

### Projection

- [ ] Map amount, currency, merchant/payee, category, occurredAt, dueAt, aspect, notes/source quote, and type.
- [ ] Normalize currency default if extraction omits it.
- [ ] Treat missing/invalid amount as accept-blocking unless user edits first.
- [ ] Roll back single-source unedited money entries.
- [ ] Keep manually edited money rows when rolling back source provenance.

### Route UI

- [ ] Replace `/money` placeholder.
- [ ] Add summary strip for month spend/income/bills due.
- [ ] Add transaction list with filters.
- [ ] Add edit sheet/dialog for amount, currency, type, category, merchant/payee, dates, aspect, and notes.
- [ ] Add manual create flow.
- [ ] Add empty state that points users to voice capture and manual add.

### Resource Links

- [ ] Suggest link to existing resource when merchant/payee matches exactly.
- [ ] Allow manual resource link/unlink if schema supports it.
- [ ] Defer AI/fuzzy resource merge to Branch 10 unless simple deterministic match is enough.

### Tests

- [ ] Projection tests for expense, income, and bill-like entries.
- [ ] Validation tests for missing amount/currency/date.
- [ ] Rollback tests.
- [ ] Route page model tests for filters and summaries.
- [ ] Component tests for edit/manual create.

## Acceptance Criteria

- Accepted money entries appear on `/money`.
- Users can edit projected money rows without losing provenance.
- Rollback handles unedited and edited rows correctly.
- Summary totals match filtered persisted rows.
- Bill-like entries have a clear representation without pretending full reminders exist unless Branch 04 has landed.

## Open Questions

- Should subscriptions be represented primarily as resources, money entries, or an explicit composition of both?
- Should planned bills create reminders automatically once reminders exist?
- Should money categories be free text initially or constrained to an app-owned list?
- Should currency default from account locale/settings?

