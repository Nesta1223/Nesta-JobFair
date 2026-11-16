# nesta — Online Job Fair Registration

Project #3 · 2110503 Software Development · 2026/1

| Member | Student ID | GitHub |
|---|---|---|
| Nontakorn Krairaveeroj | 6732019121 | [YYYongFu](https://github.com/YYYongFu) |
| Passatorn Jindawong | 6732026521 | [Nesta1223](https://github.com/Nesta1223) |

Developed from Assignment 7.2, baseline `e957b3964f7157b27997c084c8ecf2bb3e90e8ed`.
Project repository: [Nesta1223/Nesta-JobFair](https://github.com/Nesta1223/Nesta-JobFair), branch **main**.

[GitHub Contributors](https://github.com/Nesta1223/Nesta-JobFair/graphs/contributors) · [Contribution evidence](docs/teamwork.md)

## Run for rehearsal

Requires Node.js 22 (>=18 supported) and npm.

```powershell
npm ci
npm run demo
```

API: `http://127.0.0.1:5000/api/v1`. Health check: `GET /health`.
Demo uses a real temporary MongoDB process. First run downloads MongoDB; prepare before presenting.
Ctrl+C stops it; restarting resets demo data. **Temporary local MongoDB is not MongoDB Atlas.**

| Account | Email | Demo-only password |
|---|---|---|
| Admin | admin@nesta.example | NestaAdmin!2026 |
| User A | alice@nesta.example | NestaUser!2026 |
| User B | bob@nesta.example | NestaUser!2026 |

These are intentionally public, disposable demo credentials. Never reuse them in a deployed service.

## MongoDB Atlas

1. Copy `config/config.env.example` to `config/config.env`.
2. Set `MONGO_URI` to an authorized Atlas URI with a dedicated database, e.g. `nesta_job_fair`.
3. Set random `JWT_SECRET` (>=32 characters): `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.
4. Set your own `DEMO_ADMIN_PASSWORD` and `DEMO_USER_PASSWORD` to seed a new empty demo database.
5. Run `npm run seed` once, then `npm start`.
6. Update Postman passwords to match; never export live passwords or tokens.

Seed refuses a database with existing users, companies or bookings. Normal startup never seeds/deletes data.
Use HTTPS beyond localhost; production cookies use Secure and HttpOnly.

## Postman and tests

Import the two collections and `postman/Nesta-local.postman_environment.json`, then select the environment.

- Demo collection: numbered presentation order; start at 01; each run generates a fresh email.
- Regression collection: adds cross-user access and invalid-input checks.
- Request18: use **Send and Download** for the CSV extra.
- Cookie reuse is disabled per request so explicit Bearer tokens control each role/logout test.

```powershell
npm test
npm run test:postman
```

Tests use separate temporary MongoDB databases, never the data in `MONGO_URI`.
Evidence: `artifacts/integration.tap`, `artifacts/http-measurements.json`, `artifacts/newman-summary.json`.
Newman report excludes credentials and full request bodies.

## Routes

Prefix `/api/v1`. Company and booking routes require authentication.

| Method | Path | Access / purpose |
|---|---|---|
| POST | `/auth/register` | name/tel/email/password; always user |
| POST | `/auth/login` | email/password |
| GET | `/auth/me` | Current authenticated account |
| GET | `/auth/logout` | Replace cookie; client discards Bearer token |
| GET | `/companies` | Company metadata, no bookings |
| GET | `/companies/:id` | Company detail |
| POST | `/companies/:companyId/bookings` | Create own interview |
| GET | `/companies/:companyId/bookings` | Scoped list at company |
| GET | `/bookings` | User: own; admin: all |
| GET | `/bookings/:id` | Owner or admin |
| PUT | `/bookings/:id` | Owner/admin; only interviewDate/company |
| DELETE | `/bookings/:id` | Owner or admin |
| GET | `/bookings/export` | Extra: personal CSV, including for admin |

Create: `{"interviewDate":"2022-05-10"}`.
Update: `{"interviewDate":"2022-05-13","company":"<company ObjectId>"}`.
Register: `{"name":"Student","tel":"0812345678","email":"student@example.com","password":"Student!2026"}`.

Dates follow the supplied PDF: **10–13 May 2022**, inclusive. Accept only YYYY-MM-DD, store UTC midnight, export date-only. No invented time slots, capacity, duplicate-company or past-date restrictions.

Quota: three existing personal bookings per account, including admin personal bookings. Admin can manage all other users' records. Deletion frees quota. Unique `(user, slot)` prevents simultaneous requests exceeding three; internal slot is not accepted/exposed by the API.

Statuses: 200 success, 201 created, 400 validation/quota, 401 unauthenticated, 403 forbidden, 404 missing, 409 repeated concurrent conflict.
Update rejects unknown fields; registration ignores role; creation derives owner from JWT.

Logout follows Chapter12: cookie/token removal at the client, **not JWT revocation**. Previously copied JWTs remain valid until expiry.

## Code and teaching basis

`server.js` mounts routes; `models` define schemas; `controllers` enforce rules; `middleware` verifies JWT/errors; `scripts` seeds/runs demo and Newman; `tests` exercises HTTP; `postman` holds portable collections; `docs` contains diagrams/rehearsal; `delivery` contains submission artifacts.

Ch08: bcrypt/JWT/protect. Ch09: Mongoose references/populate, ownership, quota and nested routing. Ch12: logout. Ch15: Postman/Newman. Express5 async errors reach the centralized error handler.

Unused Hospital/Appointment files remain for comparison but are not mounted. Original `autograde.js`/`__tests__` belong to A7, not project verification. Old Classroom CI runs on main; project CI has read-only permissions and never pushes grades.

See [requirements](docs/requirements.md), [A7 changes](docs/assignment7-changes.md), [Thai rehearsal](docs/demo-script-th.md), [Q&A](docs/qa-th.md), [submission checklist](docs/submission-checklist.md).

Sources: [project PDF](https://mycourseville-default.s3.ap-southeast-1.amazonaws.com/useruploaded_course_files/2024_2/60990/materials/SW_Dev_Projects(2)-336264-17392597504461.pdf), [Courseville](https://www.mycourseville.com/?q=courseville/course/85009), [timeslots](https://docs.google.com/spreadsheets/d/1AhBxUwH7YAW8SKbN9fEdf04ZnShxtd-1oaMXopwH42o/edit?gid=1176685479#gid=1176685479).
