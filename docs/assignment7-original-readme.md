# Assignment 7.2: Authorization and Ownership

REST API implementation with appointment CRUD, a maximum of three appointments per user, ownership checks, role authorization, and cascading appointment deletion when a hospital is deleted.

## Run locally

1. Copy `config/config.env.example` to `config/config.env` and set the values.
2. Run `npm install`.
3. Run `npm start`.

The server seeds the two accounts required by the assignment when they do not already exist:

- `admin@gmail.com` / `12345678` (`admin`)
- `user8@gmail.com` / `12345678` (`user`)

## Endpoints

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `GET /api/v1/hospitals`
- `POST /api/v1/hospitals` (admin only)
- `GET /api/v1/appointments` (authenticated)
- `GET /api/v1/hospitals/:hospitalId/appointments` (authenticated)
