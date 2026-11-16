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

Decisions: dates stay2022 per PDF; one date/company per booking; no invented slot times/capacity; max3 existing personal bookings; owner immutable; Company seeded (CRUD not required); CSV personal even for admin. Temporary local MongoDB is a rehearsal option, not claimed as Atlas. Extra credit is requested consideration, not guaranteed points.
