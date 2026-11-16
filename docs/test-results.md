# Verification evidence — 16 November 2026

Environment: Windows, Node.js, real temporary local MongoDB. No mocks of database CRUD or HTTP responses.

| Suite | Result | Evidence |
|---|---|---|
| HTTP integration | 56 passed, 0 failed | artifacts/integration.tap |
| Postman/Newman | 31 requests, 111 assertions, 0 failures | artifacts/newman-summary.json |
| HTTP timing | 71 requests; maximum207.62ms | artifacts/http-measurements.json |
| Newman timing | maximum141ms | artifacts/newman-summary.json |
| Production dependency audit | 0 known vulnerabilities reported | artifacts/dependency-audit-production.json |

The timing result is local functional-test evidence, not a load test or an Atlas/internet SLA. Development-only Newman dependencies may have separate audit advisories; they are not installed by `npm ci --omit=dev` for the service.

Important behavioral checks: password hashing, forced user role at registration, missing/expired/invalid tokens, date boundaries, fourth-booking rejection, eight concurrent creates resulting in only three bookings, own versus other-user access for all three operations, administrator modification of another user's booking, immutable ownership, CSV privacy and formula escaping, cookie logout semantics.

Reproduce using `npm test` and `npm run test:postman`. Tests use disposable databases and do not overwrite persistent application data.
