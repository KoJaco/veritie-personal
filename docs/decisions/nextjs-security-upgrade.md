# Decision Note: Upgrade Next.js to 16.1.6

## Date

30-01-2026

## Summary

Upgraded Next.js from version 15.6 to 16.1.6 to address three high-severity security vulnerabilities that could expose the application to denial-of-service (DoS) attacks.

## Decision

Upgrade `next` dependency from version 15.6 to 16.1.6 and update `eslint-config-next` from 15.x to 16.1.1 to patch critical security vulnerabilities.

## Rationale

- **DoS via Image Optimizer (GHSA-9g9p-9gw9-jx7f):** Self-hosted applications were vulnerable to denial-of-service attacks through the Image Optimizer's `remotePatterns` configuration
- **Unbounded Memory Consumption (GHSA-5f7q-jpqc-wp7h):** The PPR (Partial Prerendering) Resume Endpoint had unbounded memory consumption that could lead to server crashes
- **HTTP Request Deserialization (GHSA-h25m-26qc-wcjf):** When using insecure React Server Components, HTTP request deserialization could lead to DoS attacks

These vulnerabilities are particularly critical for a platform handling sensitive operational and workspace data. The severity rating of "high" combined with the nature of the exploits (DoS) warranted immediate action.

## Impact

- **Security:** Patches three high-severity vulnerabilities
- **Breaking Changes:** Next.js 16 includes some breaking changes from 15; review migration guide for any affected features
- **Dependencies:** `eslint-config-next` updated to 16.1.1 to maintain compatibility
- **DX:** Ensure all developers run `npm install` to receive updated lockfile

## Follow-ups

- [ ] Test all image optimization functionality after upgrade
- [ ] Verify React Server Components remain secure (no untrusted deserialization)
- [ ] Review migration guide for any breaking changes affecting existing features
- [ ] Confirm all dev environments have updated dependencies

## References

- Security Advisory: https://github.com/advisories/GHSA-9g9p-9gw9-jx7f
- Security Advisory: https://github.com/advisories/GHSA-5f7q-jpqc-wp7h
- Security Advisory: https://github.com/advisories/GHSA-h25m-26qc-wcjf
- Issue: Security update
- Related: `package.json` (next: ^16.1.6, eslint-config-next: 16.1.1)
