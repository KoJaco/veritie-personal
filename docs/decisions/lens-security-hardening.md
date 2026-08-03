# Decision Note: Lens Input Security Hardening

## Date

2026-03-13

## Summary

Harden URL-driven lens boundaries by validating lens input strictly, rejecting malformed or oversized lens parameters fail-closed, and enforcing privacy-safe telemetry for rejection events.

## Decision

Adopt strict lens trust-boundary controls:

- Enforce a hard input budget for lens query keys.
- Accept only canonical lens keys and enum values.
- Require strict `YYYY-MM-DD` dates for custom windows.
- Reject custom windows missing bounds or with `start > end`.
- Fail closed to normalized safe lens defaults for invalid input.
- Log only sanitized issue metadata (issue codes/counts/size), never raw query values.

## Rationale

- URL lens is user-controlled input and must be treated as untrusted.
- Strict normalization protects route rendering, lens propagation, and assistant/context payload composition from malformed inputs.
- Size bounds reduce abuse potential from oversized query payloads.
- Sanitized telemetry improves debugging while preventing accidental sensitive value exposure in logs.

## Impact

- Invalid lens input degrades safely without runtime exceptions.
- Lens dialog and server route boundaries can observe rejected input via sanitized parse metadata.
- Valid lens flows remain backward compatible.

## Follow-ups

- [ ] Reuse sanitized lens rejection telemetry in additional route entrypoints beyond Work index surfaces.
- [ ] Add aggregate monitoring for repeated lens rejection patterns in production logging pipelines.

## References

- Branch: `security/lens-hardening`
- Related contracts: `docs/contracts/scope-lens-contract.md`, `docs/contracts/route-state-boundary-contract.md`
- Related ADR: `docs/adr/0010-framework-lens-url-contract.md`
