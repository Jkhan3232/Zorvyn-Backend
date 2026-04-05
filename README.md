# 📊 Zorvyn - Finance Management Backend

Welcome to the **Zorvyn Backend API**! This project is a robust, production-ready Node.js backend tailored for managing financial data, user roles, and real-time dashboard analytics.

🔗 **Live Frontend Application:** [zorvyn-frontend-jeeshan.vercel.app](https://zorvyn-frontend-jeeshan.vercel.app)

---

## 🚀 Overview & System Flow

This system is an **Access-Controlled Finance Dashboard**. It allows an organization to securely record incomes and expenses, and view aggregated analytics based on strict user roles.

### How The System Flows:

1. **User Onboarding (Auth)**:
   - **Self-Registration**: Public users can register themselves. They are automatically assigned the `viewer` role for security.
   - **Admin Creation**: Admins can securely create `analyst` or `viewer` accounts. The backend generates a temporary password and sends a beautiful welcome email (HTML, compiled via MJML) through SMTP.
2. **Access Control (RBAC)**:
   - Every request passes through `authMiddleware` (to verify the JWT token) and `authorize` middleware (to check if the user's role has permission for that specific route).
3. **Financial Records Management**:
   - Admins can create, update, or delete financial records.
   - **Safety First**: The system implements **Soft Deletes**. Calling DELETE on a record merely flags it as `isDeleted: true`, preserving financial history.
4. **Dashboard Analytics (REST & GraphQL)**:
   - Powered by **MongoDB Aggregation Pipelines**. Raw records are dynamically grouped into useful metrics: _Total Income, Total Expense, Net Balance, Monthly Trends,_ and _Category Totals_.
   - These analytics are served via standard **REST APIs** or dynamically queried via **GraphQL**.

---

## 👥 Role & Permissions Matrix

| Feature                                   | Admin 👑 | Analyst 🔎 | Viewer 👁️ |
| ----------------------------------------- | :------: | :--------: | :-------: |
| **Authentication**                        |    ✅    |     ✅     |    ✅     |
| **Manage Users** _(Roles/Status)_         |    ✅    |     ❌     |    ❌     |
| **Manage Records** _(Create/Edit/Delete)_ |    ✅    |     ❌     |    ❌     |
| **View Records List** _(Search/Filter)_   |    ✅    |     ✅     |    ❌     |
| **View Dashboard Summaries**              |    ✅    |     ✅     |    ✅     |

---

## 🛠 Tech Stack & Security

- **Core**: Node.js, Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Security**:
  - JWT (JSON Web Tokens)
  - `bcryptjs` (Password Hashing)
  - `helmet` (HTTP Headers protection)
  - `express-rate-limit` (DDoS prevention)
- **API Interfaces**: RESTful APIs & GraphQL (Apollo Server v4)
- **Documentation**: Swagger UI (OpenAPI 3.0.3)
- **Testing Environment**: Jest, Supertest, `mongodb-memory-server`
- **Mail Integration**: Nodemailer with MJML (Responsive Email Templates)

---

## 📁 Codebase Architecture (Layered Design)

The codebase strictly follows the **Controller-Service-Model** pattern, ensuring cleanly decoupled code.

```text
src/
 ├── app.js / server.js   # Express entry points, routing, middleware injections
 ├── config/              # DB connection, Environment variables, Roles & Swagger setup
 ├── controllers/         # Handles HTTP Requests/Responses (Extracts payload, sends JSON)
 ├── services/            # Core Business Logic (DB Queries, Aggregations, Emails)
 ├── graphql/             # Apollo Setup, typeDefs, resolvers (reuses the services layer!)
 ├── middleware/          # Security walls (authMiddleware, authorize, rateLimiter)
 ├── models/              # Mongoose Schemas (User, Record)
 ├── routes/              # Express API Routes definitions
 ├── templates/           # MJML Email templates
 ├── utils/               # JWT helper, custom ApiError, asyncHandler
 └── validations/         # express-validator schemas for strict payload checking
tests/                    # Automated testing suites (.test.js files)
```

---

## ⚡ Setup & Installation

**1. Install Dependencies**

```bash
npm install
```

**2. Configure Environment**
Copy `.env.example` to `.env` and fill in your MongoDB URI, JWT Secret, and SMTP credentials.

```bash
cp .env.example .env
```

**3. Run the Development Server**

```bash
npm run dev
```

**4. Run Automated Tests**

```bash
npm test
```

---

## 🔌 API Testing & Interfaces

We provide three robust ways to interact with the backend:

### 1. Swagger UI (REST Documentation)

Visit **`http://localhost:2000/api-docs`**.
Here you'll find beautifully mapped documentation for every REST endpoint, separated by role tags (`admin`, `viewer`, `analyst`). You can generate tokens and test APIs directly from the browser using the "Try it out" button.

### 2. GraphQL Playground

Visit **`http://localhost:2000/graphql`**.
We use the Local Default Playground. You can inject your JWT in the `HTTP HEADERS` tab (`{"Authorization": "Bearer <token>"}`) and write queries or mutations to fetch financial summaries exactly the way your frontend needs them.

### 3. Postman / cURL

Standard REST base URL: `http://localhost:2000/api/`
All secured endpoints require the header:
`Authorization: Bearer <your_jwt_token>`

---

## 💡 Key Design Decisions

1. **Service Reusability**: The logic to fetch dashboard summaries is written once in `dashboardService.js`. Both the REST Controller (`dashboardController`) and the GraphQL Resolver (`graphql/resolvers.js`) call this same service. No duplicate code!
2. **Centralized Error Handling**: Errors thrown anywhere in the `services` are automatically caught by the `asyncHandler` wrapper and formatted cleanly by the `errorHandler` middleware.
3. **Pagination & Filtering**: The `GET /records` API is highly optimized. It accepts multiple query params (`category`, `type`, `startDate`, `search`) and returns paginated data (`page`, `limit`), crucial for frontend performance.
