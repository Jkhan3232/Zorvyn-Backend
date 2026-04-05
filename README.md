# Zorvyn - Finance Management Backend

Production-ready Express + MongoDB backend for role-based finance management, financial records, dashboard analytics, and dual API support (REST + GraphQL).

## Live Links

- Frontend: https://zorvyn-frontend-jeeshan.vercel.app
- Backend REST base: https://zorvyn-backend-coral.vercel.app/api
- GraphQL endpoint: https://zorvyn-backend-coral.vercel.app/graphql
- OpenAPI JSON: https://zorvyn-backend-coral.vercel.app/swagger.json

---

## What Changed Recently (April 2026)

1. Swagger is now serverless-safe for Vercel.
   - Production uses /swagger.json
   - Swagger UI is available only in non-production
2. Full refresh token system added.
   - Login returns accessToken + refreshToken
   - New endpoints: /api/auth/refresh-token and /api/auth/logout
   - Refresh tokens are stored in MongoDB
3. New admin management APIs added.
   - PUT /api/admin/profile
   - PUT /api/admin/user/:id
4. Auth rate limiting and stronger input validation added.
5. Tests updated for refresh flow and new admin endpoints.

---

## System Flow (Simple View)

1. User logs in via /api/auth/login and gets accessToken + refreshToken.
2. Protected routes use Authorization: Bearer <accessToken>.
3. When access token expires, client calls /api/auth/refresh-token using refresh token.
4. Admin-only routes are protected by role middleware.
5. Records are soft-deleted (isDeleted: true), not hard deleted.
6. Dashboard analytics are available through both REST and GraphQL.

---

## Quick Start (Local)

1. Install dependencies

```bash
npm install
```

2. Setup environment file

```bash
cp .env.example .env
```

3. Start development server

```bash
npm run dev
```

4. Run test suite

```bash
npm test
```

Default local URLs (if PORT=5000):

- REST base: http://localhost:5000/api
- GraphQL: http://localhost:5000/graphql
- Swagger UI (non-production only): http://localhost:5000/api-docs
- Swagger JSON: http://localhost:5000/swagger.json

---

## Environment Variables

Use .env.example as source of truth.

| Variable                     | Required    | Example                                     | Purpose                                         |
| ---------------------------- | ----------- | ------------------------------------------- | ----------------------------------------------- |
| NODE_ENV                     | Yes         | development                                 | Environment mode                                |
| PORT                         | Yes         | 5000                                        | API port                                        |
| MONGO_URI                    | Yes         | mongodb://127.0.0.1:27017/finance_dashboard | MongoDB connection                              |
| JWT_ACCESS_SECRET            | Yes         | replace_with_strong_access_secret           | Access token signing secret                     |
| JWT_ACCESS_EXPIRES_IN        | Yes         | 15m                                         | Access token expiry                             |
| JWT_REFRESH_SECRET           | Yes         | replace_with_strong_refresh_secret          | Refresh token signing secret                    |
| JWT_REFRESH_EXPIRES_IN       | Yes         | 7d                                          | Refresh token expiry                            |
| AUTH_RATE_LIMIT_WINDOW_MS    | No          | 900000                                      | Auth limiter window                             |
| AUTH_RATE_LIMIT_MAX_REQUESTS | No          | 20                                          | Max auth requests per window                    |
| ENABLE_GRAPHQL               | No          | true                                        | Enable GraphQL route                            |
| APP_BASE_URL                 | No          | https://zorvyn-backend-coral.vercel.app     | Adds deployment server in swagger spec          |
| SMTP_HOST                    | Conditional | smtp.gmail.com                              | Required for managed-user credential email flow |
| SMTP_PORT                    | Conditional | 587                                         | SMTP port                                       |
| SMTP_USER                    | Conditional | your_smtp_username                          | SMTP username                                   |
| SMTP_PASS                    | Conditional | your_smtp_password                          | SMTP password                                   |
| SMTP_FROM_EMAIL              | Conditional | no-reply@example.com                        | Sender email                                    |
| SMTP_FROM_NAME               | No          | Finance Dashboard                           | Sender display name                             |
| APP_LOGIN_URL                | No          | http://localhost:5173/login                 | Login URL used in credential emails             |

---

## Role & Permissions

| Feature                               | Admin | Analyst | Viewer |
| ------------------------------------- | :---: | :-----: | :----: |
| Authentication                        |  Yes  |   Yes   |  Yes   |
| Manage users                          |  Yes  |   No    |   No   |
| Manage records (create/update/delete) |  Yes  |   No    |   No   |
| View records list                     |  Yes  |   Yes   |   No   |
| View dashboard summaries              |  Yes  |   Yes   |  Yes   |

---

## Authentication Details

Login response (important for frontend):

- token: backward-compatible alias of accessToken
- accessToken: short-lived JWT (default 15m)
- refreshToken: long-lived JWT (default 7d)
- user: profile object

Refresh token can be sent in either form:

- Header: x-refresh-token: <refreshToken>
- Body: { "refreshToken": "<refreshToken>" }

Recommended frontend behavior:

1. Store accessToken and refreshToken after login.
2. Attach accessToken in Authorization header for protected routes.
3. On 401, call /api/auth/refresh-token and retry original request.
4. On refresh failure, clear session and redirect to login.

---

## REST API Quick Reference

### Auth

| Method | Path                    | Access | Notes                                   |
| ------ | ----------------------- | ------ | --------------------------------------- |
| POST   | /api/auth/register      | Public | Self-register; defaults role to viewer  |
| POST   | /api/auth/login         | Public | Returns accessToken + refreshToken      |
| POST   | /api/auth/refresh-token | Public | Requires refresh token (header or body) |
| POST   | /api/auth/logout        | Public | Revokes refresh token in DB             |

### Admin

| Method | Path                | Access | Notes                              |
| ------ | ------------------- | ------ | ---------------------------------- |
| PUT    | /api/admin/profile  | Admin  | Update own name/email/password     |
| PUT    | /api/admin/user/:id | Admin  | Update user name/email/role/status |

Admin user update payload rules:

- role accepts: admin, staff, user
- role mapping: staff -> analyst, user -> viewer
- status accepts: active, inactive
- isActive boolean is also supported

### User Management (Existing)

| Method | Path                  | Access |
| ------ | --------------------- | ------ |
| POST   | /api/users            | Admin  |
| GET    | /api/users            | Admin  |
| PATCH  | /api/users/:id/role   | Admin  |
| PATCH  | /api/users/:id/status | Admin  |

### Records

| Method | Path             | Access         |
| ------ | ---------------- | -------------- |
| GET    | /api/records     | Admin, Analyst |
| POST   | /api/records     | Admin          |
| PATCH  | /api/records/:id | Admin          |
| DELETE | /api/records/:id | Admin          |

### Dashboard

| Method | Path                               | Access                 |
| ------ | ---------------------------------- | ---------------------- |
| GET    | /api/dashboard/summary             | Admin, Analyst, Viewer |
| GET    | /api/dashboard/total-income        | Admin, Analyst, Viewer |
| GET    | /api/dashboard/total-expense       | Admin, Analyst, Viewer |
| GET    | /api/dashboard/net-balance         | Admin, Analyst, Viewer |
| GET    | /api/dashboard/category-totals     | Admin, Analyst, Viewer |
| GET    | /api/dashboard/monthly-trends      | Admin, Analyst, Viewer |
| GET    | /api/dashboard/recent-transactions | Admin, Analyst, Viewer |

---

## GraphQL

- Endpoint: /graphql
- Uses same auth rules as REST (Authorization bearer token)
- Reuses same service layer (no duplicated business logic)

---

## Swagger and API Testing

Production usage:

- Use OpenAPI JSON directly: https://zorvyn-backend-coral.vercel.app/swagger.json
- Swagger UI: https://zorvyn-backend-coral.vercel.app/api-docs/

Local usage:

- Swagger UI: http://localhost:2000/api-docs/
- Swagger JSON: http://localhost:2000/swagger.json

Swagger Editor steps:

1. Open https://editor.swagger.io/
2. File -> Import URL
3. Paste https://zorvyn-backend-coral.vercel.app/swagger.json

Postman/cURL base URL:

- https://zorvyn-backend-coral.vercel.app/api

---

## Architecture

The project follows a layered Controller-Service-Model structure.

```text
src/
 ├── app.js / server.js   # App bootstrap and HTTP server
 ├── config/              # Env, DB, roles, swagger config
 ├── controllers/         # Request-response handlers
 ├── services/            # Business logic
 ├── graphql/             # Apollo setup, typeDefs, resolvers
 ├── middleware/          # Auth, authorization, limiter, errors
 ├── models/              # Mongoose models
 ├── routes/              # API route groups
 ├── templates/           # MJML templates
 ├── utils/               # Helpers and shared utilities
 └── validations/         # express-validator rules
tests/                    # Jest + Supertest suites
```

---

## Key Design Decisions

1. Service reusability: REST and GraphQL both call shared services.
2. Centralized error handling: asyncHandler + global error middleware.
3. Scalable records API: pagination and filtering built-in.
4. Safer auth lifecycle: short-lived access tokens + DB-backed refresh tokens.
5. Serverless-friendly docs: swagger.json in production, UI only for non-production.
