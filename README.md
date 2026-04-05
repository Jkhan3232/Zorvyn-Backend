# Finance Data Processing and Access Control Dashboard Backend

Production-structured backend system using Node.js, Express.js, MongoDB (Mongoose), JWT authentication, RBAC, aggregation-driven dashboard APIs, optional GraphQL, Swagger docs, and Jest tests.

## Tech Stack

- Node.js
- Express.js
- MongoDB + Mongoose
- JWT Authentication
- Apollo Server (GraphQL)
- Jest + Supertest + mongodb-memory-server

## Project Structure

```text
src/
  config/
  controllers/
  graphql/
  middleware/
  models/
  routes/
  services/
  utils/
  validations/
tests/
```

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure environment:
   ```bash
   cp .env.example .env
   ```
3. Start in development:
   ```bash
   npm run dev
   ```
4. Run tests:
   ```bash
   npm test
   ```

## API Base URLs

- REST API base: `http://localhost:2000/api`
- Health: `http://localhost:2000/health`
- Swagger docs: `http://localhost:2000/api-docs`
- GraphQL (optional): `http://localhost:2000/graphql`

## Authentication

JWT token must be sent in header:

```text
Authorization: Bearer <token>
```

## Role Permissions

- `viewer`: dashboard summary read only
- `analyst`: read records + dashboard summary
- `admin`: full access (records CRUD + user role/status management)

## REST Endpoints

### Auth

- `POST /auth/register` - Register user (default role: viewer)
- `POST /auth/login` - Login and get JWT

`POST /auth/register` special behavior:

- Public call (no admin token): normal self-register, no credentials email.
- Admin token call: treated as managed user creation (`viewer|analyst`) and credentials email is sent.

### User Management (admin only)

- `POST /users` - Create `viewer`/`analyst` user and send temporary password over email
- `GET /users` - List all users
- `PATCH /users/:id/role` - Update role (`viewer | analyst | admin`)
- `PATCH /users/:id/status` - Activate/deactivate user (`isActive: boolean`)

`POST /users` accepts:

- `name` (required)
- `email` (required)
- `role` (optional, `viewer|analyst`, default `viewer`)
- `isActive` (optional, boolean, default `true`)

### Financial Records

- `POST /records` - Create record (admin only)
- `PATCH /records/:id` - Update record (admin only)
- `DELETE /records/:id` - Soft delete record (admin only)
- `GET /records` - Read records (analyst, admin)

`GET /records` supports:

- `startDate` (ISO date)
- `endDate` (ISO date)
- `category`
- `type` (`income|expense`)
- `search` (category/note)
- `page` (default 1)
- `limit` (default 10)
- `sortBy` (`date|amount|category|createdAt`)
- `sortOrder` (`asc|desc`)

### Dashboard Summary

- `GET /dashboard/total-income`
- `GET /dashboard/total-expense`
- `GET /dashboard/net-balance`
- `GET /dashboard/category-totals`
- `GET /dashboard/monthly-trends`
- `GET /dashboard/recent-transactions`
- `GET /dashboard/summary`

All dashboard endpoints are accessible by `viewer`, `analyst`, and `admin`.

## GraphQL

GraphQL is enabled when `ENABLE_GRAPHQL=true`.

### Types included

- `User`
- `Record`
- `Summary`

### Queries

- `getRecords(filter)`
- `getSummary`

### Mutations

- `createRecord(input)`
- `updateRecord(id, input)`
- `deleteRecord(id)`

Role checks are enforced inside resolvers:

- `getRecords`: analyst, admin
- `getSummary`: viewer, analyst, admin
- Mutations: admin only

## Validation and Error Handling

- Request validation via `express-validator`
- Centralized error middleware
- Standard status code usage:
  - `400` Bad Request
  - `401` Unauthorized
  - `403` Forbidden
  - `404` Not Found
  - `500` Server Error

## Data Persistence

- Mongoose schemas with validation
- Timestamps on all core models
- Record soft-delete using `isDeleted`

## Optional Enhancements Included

- Pagination (`GET /records`)
- Search (`GET /records?search=...`)
- Soft delete (`isDeleted` on records)
- Rate limiting (`express-rate-limit`)
- API docs (`/api-docs`)
- Unit/integration tests (`npm test`)
- GraphQL support

curl --location 'http://localhost:2000/graphql' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OWNlN2RlZDBmZDFlN2JlNGE0Y2Q2MTgiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NzUzODI1MzEsImV4cCI6MTc3NTQ2ODkzMX0.hMTVbTsi5io7Tx82CyElK7GU7pp_zHTPVm1DEICnfwE' \
--header 'Content-Type: application/json' \
--data '{"query":"query GetFullSummary { getSummary { totalIncome totalExpense netBalance monthlyTrends { month totalIncome totalExpense netBalance } } }","variables":{}}'

## SMTP Setup (for admin-created users)

When admin creates `viewer`/`analyst` users via `POST /api/users`, the backend generates a temporary password and sends it by email.

Set these env variables:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM_EMAIL`
- `SMTP_FROM_NAME`
- `APP_LOGIN_URL`

If SMTP is not configured, managed user creation returns an error.

MJML template file for credentials email:

- `src/templates/emailTemplates.mjml.js`

## Assumptions

1. New users are registered as `viewer` by default for security.
2. At least one admin must exist to manage roles and activation status.
3. Financial records are never hard-deleted from database (soft delete applied).
4. This template targets production code organization, while deployment setup is intentionally simplified.
5. Admin-managed users receive temporary credentials via SMTP email.
