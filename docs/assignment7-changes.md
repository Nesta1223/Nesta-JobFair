# Changes from Assignment7.2

Baseline e957b3964f7157b27997c084c8ecf2bb3e90e8ed; branch nesta-final-project.

| Area | Before | After |
|---|---|---|
| Domain | Hospital/Appointment | Company/Booking |
| Registration | No telephone | Required tel and type validation |
| Authentication | No logout | Chapter12 cookie logout |
| List | Admin-only route | User own/admin all |
| Single GET | No owner check | Owner/admin check |
| Update | Entire body accepted | Date/company allowlist; immutable owner |
| Date | Any date | Strict May10–13 2022 |
| Quota | Count-only | Unique user+slot index handles concurrency |
| Seed | Automatic hospital seed | Explicit empty DB / temporary demo |
| Errors | Validation could become500 | 400/401/403/404; generic internal error |
| Verification | A7 hospital grader | Project HTTP suite and Postman/Newman |
| Extra | None | CSV with owner filtering/escaping |

Retained: CommonJS, Express route/controller/model structure, Mongoose references/populate, bcrypt pre-save, JWT, nested mergeParams, JSON responses.
Beyond introductory examples: unique quota index, strict date parsing, field allowlisting and CSV. These extend the taught architecture.
