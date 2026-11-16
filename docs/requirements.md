# Requirement-to-evidence mapping

Source: Project3 PDF p7; non-functional requirements p2–3.

| ID | Requirement | Implementation | Test evidence | Demo |
|---|---|---|---|---|
| FR1 | Register name/tel/email/password | User, auth.register | FR1 integration | 01–02 |
| FR2 | Login and logout | auth, protect | FR2, AUTH | 03,11–13 |
| FR3 | Company info, max3, May10–13 2022 | Company/Booking, validation, addBooking | FR3 including concurrent8 | 04–07 |
| FR4 | View own bookings | scope, ownedBooking | FR4, ownership GET | 08 |
| FR5 | Edit own | updateBooking allowlist | FR5, ownership PUT | 09 |
| FR6 | Delete own | deleteBooking | FR6, ownership DELETE | 10 |
| FR7 | Admin view all | admin scope | FR7 | 14 |
| FR8 | Admin edit anyone | ownedBooking admin branch | FR8 | 15 |
| FR9 | Admin delete anyone | ownedBooking admin branch | FR9 | 16 |
| NFR1 | Authenticated/confidential access | JWT, bcrypt, no password output | AUTH, role escalation, cross-user | Explain protection |
| NFR2 | Response within3s | HTTP timing/assertions | Local measurements; not cloud SLA | Report measured results |
| NFR3 | REST/Postman | Express resources, collections | Newman | Live Postman |
| NFR4 | Atlas or PostgreSQL | Atlas-ready Mongoose URI | Local MongoDB tests; Atlas needs separate verification | Configured Atlas |
| EXTRA1 | Export personal CSV | exportBookings/csvCell | EXTRA tests, Postman18/24 | Download CSV + tutorial |

Decisions: dates stay2022 per PDF; one date/company per booking; user-defined interview times; no company capacity limit; max3 existing personal bookings; owner immutable; Company seeded (CRUD not required); CSV personal even for admin. Temporary local MongoDB is a rehearsal option, not claimed as Atlas. Extra credit is requested consideration, not guaranteed points.

## Additional requirement: prevent overlapping interviews

The system shall not allow the registered user to book an interview session that overlaps with the date and time of an existing booking made by the same user.

Create and update requests accept `startTime` and `endTime` in 24-hour `HH:mm` format (minute precision, Asia/Bangkok local time), alongside `interviewDate` (`YYYY-MM-DD`, 10–13 May 2022). End must be later than start on the same date; `24:00` is valid only as an end time. Example:

```json
{"interviewDate":"2022-05-10","startTime":"09:00","endTime":"09:30"}
```

Overlaps return HTTP 409, even across different companies. Adjacent sessions (09:00–09:30 and 09:30–10:00) are allowed. Different users can book the same interval. Admin edits check the booking owner's schedule. Updates exclude the booking itself. Database minute reservations prevent concurrent creates/updates from bypassing the rule. The existing maximum of three bookings remains.

For compatibility, omitted times mean 00:00–24:00 on create; omitted fields retain the stored times on update. Old date-only bookings therefore occupy the whole day. CSV exports include start and end times.

Before upgrading an existing database, stop API writers and run `node scripts/migrate-booking-times.js` using its configured MONGO_URI, then start the API. The migration fills legacy time fields and minute reservations and creates the unique index. It stops before modifying bookings if existing schedules overlap; resolve those schedules explicitly and retry. No bookings are automatically deleted.

Validation: `npm test` includes overlap shapes, adjacency, different users/dates, invalid ranges, owner/admin edits, deletion, legacy bookings, concurrent creates and concurrent updates.
