const swaggerJsdoc = require("swagger-jsdoc");
const env = require("./env");

const normalizeServerUrl = (value) => {
  if (!value || typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
};

const servers = [
  {
    url: `http://localhost:${env.port}`,
    description: "Local development server",
  },
];

const deploymentServerUrl = normalizeServerUrl(env.appBaseUrl);

if (deploymentServerUrl) {
  servers.unshift({
    url: deploymentServerUrl,
    description: "Configured deployment server",
  });
}

const options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Finance Data Processing and Access Control Dashboard API",
      version: "2.0.0",
      description: [
        "Complete REST API docs for auth, user management, records, and dashboard analytics.",
        "",
        "Role matrix:",
        "- admin: full access (users management + records CRUD + dashboard)",
        "- viewer: dashboard read-only",
        "- analyst: analytics-side user (records read + dashboard read)",
        "",
        "Try it out flow:",
        "1) Call POST /api/auth/login.",
        "2) Click Authorize and set: Bearer <token>.",
        "3) Execute protected endpoints and inspect live response payloads.",
      ].join("\n"),
    },
    servers,
    tags: [
      {
        name: "Health",
        description: "Service availability endpoint",
      },
      {
        name: "Auth (Public)",
        description: "Public authentication and registration endpoints",
      },
      {
        name: "Users",
        description: "User management APIs",
      },
      {
        name: "Records",
        description: "Financial records CRUD and read endpoints",
      },
      {
        name: "Dashboard",
        description: "Aggregated dashboard analytics endpoints",
      },
      {
        name: "Admin",
        description: "Endpoints accessible by admin role",
      },
      {
        name: "Viewer",
        description: "Endpoints accessible by viewer role",
      },
      {
        name: "Analytics User",
        description:
          "Endpoints accessible by analyst role (analytics-side user)",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      parameters: {
        UserIdParam: {
          name: "id",
          in: "path",
          required: true,
          description: "MongoDB user id",
          schema: {
            type: "string",
            example: "67f181d6847e9e10d4c4c111",
          },
        },
        RecordIdParam: {
          name: "id",
          in: "path",
          required: true,
          description: "MongoDB record id",
          schema: {
            type: "string",
            example: "67f2c76d326565f8fbbec222",
          },
        },
      },
      schemas: {
        ApiErrorResponse: {
          type: "object",
          required: ["success", "message"],
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            message: {
              type: "string",
              example: "Invalid or expired token",
            },
            stack: {
              type: "string",
              description:
                "Present only outside production for unhandled errors",
            },
          },
        },
        ValidationErrorItem: {
          type: "object",
          required: ["field", "message"],
          properties: {
            field: {
              type: "string",
              example: "email",
            },
            message: {
              type: "string",
              example: "Invalid email format",
            },
          },
        },
        ValidationErrorResponse: {
          type: "object",
          required: ["success", "message", "errors"],
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            message: {
              type: "string",
              example: "Validation failed",
            },
            errors: {
              type: "array",
              items: {
                $ref: "#/components/schemas/ValidationErrorItem",
              },
            },
          },
        },
        UserRole: {
          type: "string",
          enum: ["viewer", "analyst", "admin"],
          description: "Use analyst as analytics-user role value.",
          example: "analyst",
        },
        UserProfile: {
          type: "object",
          required: [
            "id",
            "name",
            "email",
            "role",
            "isActive",
            "createdAt",
            "updatedAt",
          ],
          properties: {
            id: { type: "string", example: "67f181d6847e9e10d4c4c111" },
            name: { type: "string", example: "Jeeshan Khan" },
            email: {
              type: "string",
              format: "email",
              example: "jeeshan@example.com",
            },
            role: { $ref: "#/components/schemas/UserRole" },
            isActive: { type: "boolean", example: true },
            createdAt: {
              type: "string",
              format: "date-time",
              example: "2026-04-05T08:10:42.000Z",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              example: "2026-04-05T08:10:42.000Z",
            },
          },
        },
        RegisterRequest: {
          type: "object",
          required: ["name", "email", "password"],
          properties: {
            name: { type: "string", example: "John Doe" },
            email: {
              type: "string",
              format: "email",
              example: "john@example.com",
            },
            password: {
              type: "string",
              minLength: 6,
              maxLength: 50,
              example: "Password@123",
            },
            role: {
              type: "string",
              enum: ["viewer", "analyst"],
              example: "analyst",
              description:
                "Optional. Applied only if valid admin token is sent.",
            },
            isActive: {
              type: "boolean",
              example: true,
              description:
                "Optional. Applied only if valid admin token is sent.",
            },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "john@example.com",
            },
            password: { type: "string", example: "Password@123" },
          },
        },
        LoginResponse: {
          type: "object",
          required: ["success", "message", "data"],
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: "Login successful" },
            data: {
              type: "object",
              required: ["accessToken", "refreshToken", "user"],
              properties: {
                token: {
                  type: "string",
                  example: "<JWT_ACCESS_TOKEN>",
                  description:
                    "Backward-compatible alias for accessToken used by existing clients",
                },
                accessToken: {
                  type: "string",
                  example: "<JWT_ACCESS_TOKEN>",
                },
                refreshToken: {
                  type: "string",
                  example: "<JWT_REFRESH_TOKEN>",
                },
                user: { $ref: "#/components/schemas/UserProfile" },
              },
            },
          },
        },
        RefreshTokenRequest: {
          type: "object",
          properties: {
            refreshToken: {
              type: "string",
              example: "<JWT_REFRESH_TOKEN>",
              description:
                "Optional when x-refresh-token header is provided. One of body or header is required.",
            },
          },
        },
        RefreshTokenResponse: {
          type: "object",
          required: ["success", "message", "data"],
          properties: {
            success: { type: "boolean", example: true },
            message: {
              type: "string",
              example: "Access token refreshed successfully",
            },
            data: {
              type: "object",
              required: ["accessToken"],
              properties: {
                token: {
                  type: "string",
                  example: "<JWT_ACCESS_TOKEN>",
                  description:
                    "Backward-compatible alias for accessToken used by existing clients",
                },
                accessToken: {
                  type: "string",
                  example: "<JWT_ACCESS_TOKEN>",
                },
              },
            },
          },
        },
        LogoutResponse: {
          type: "object",
          required: ["success", "message"],
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: "Logout successful" },
          },
        },
        CreateManagedUserRequest: {
          type: "object",
          required: ["name", "email"],
          properties: {
            name: { type: "string", example: "Analytics User" },
            email: {
              type: "string",
              format: "email",
              example: "analytics.user@example.com",
            },
            role: {
              type: "string",
              enum: ["viewer", "analyst"],
              example: "analyst",
            },
            isActive: { type: "boolean", example: true },
            password: {
              type: "string",
              example: "TempPass@123",
              description:
                "Optional. If omitted, backend generates temporary password.",
            },
          },
        },
        UpdateRoleRequest: {
          type: "object",
          required: ["role"],
          properties: {
            role: {
              type: "string",
              enum: ["viewer", "analyst", "admin"],
              example: "analyst",
            },
          },
        },
        UpdateStatusRequest: {
          type: "object",
          required: ["isActive"],
          properties: {
            isActive: { type: "boolean", example: false },
          },
        },
        AdminProfileUpdateRequest: {
          type: "object",
          properties: {
            name: { type: "string", example: "Admin Updated" },
            email: {
              type: "string",
              format: "email",
              example: "admin.updated@example.com",
            },
            password: {
              type: "string",
              minLength: 6,
              maxLength: 50,
              example: "NewSecurePass@123",
            },
          },
        },
        AdminUserUpdateRequest: {
          type: "object",
          properties: {
            name: { type: "string", example: "Managed User Updated" },
            email: {
              type: "string",
              format: "email",
              example: "managed.user@example.com",
            },
            role: {
              type: "string",
              enum: ["admin", "staff", "user"],
              description:
                "Mapped internally as admin->admin, staff->analyst, user->viewer",
              example: "staff",
            },
            status: {
              type: "string",
              enum: ["active", "inactive"],
              example: "active",
            },
          },
        },
        UserActionResponse: {
          type: "object",
          required: ["success", "message", "data"],
          properties: {
            success: { type: "boolean", example: true },
            message: {
              type: "string",
              example: "User created and credentials email sent successfully",
            },
            data: { $ref: "#/components/schemas/UserProfile" },
          },
        },
        UsersListResponse: {
          type: "object",
          required: ["success", "data"],
          properties: {
            success: { type: "boolean", example: true },
            data: {
              type: "array",
              items: { $ref: "#/components/schemas/UserProfile" },
            },
          },
        },
        RecordType: {
          type: "string",
          enum: ["income", "expense"],
          example: "income",
        },
        RecordActor: {
          type: "object",
          properties: {
            _id: { type: "string", example: "67f181d6847e9e10d4c4c111" },
            name: { type: "string", example: "Jeeshan Khan" },
            email: {
              type: "string",
              format: "email",
              example: "jeeshan@example.com",
            },
            role: { $ref: "#/components/schemas/UserRole" },
          },
        },
        Record: {
          type: "object",
          properties: {
            _id: { type: "string", example: "67f2c76d326565f8fbbec222" },
            amount: { type: "number", format: "float", example: 5499.5 },
            type: { $ref: "#/components/schemas/RecordType" },
            category: { type: "string", example: "Freelancing" },
            date: {
              type: "string",
              format: "date-time",
              example: "2026-04-01T00:00:00.000Z",
            },
            note: { type: "string", example: "Website project payout" },
            createdBy: { $ref: "#/components/schemas/RecordActor" },
            isDeleted: { type: "boolean", example: false },
            createdAt: {
              type: "string",
              format: "date-time",
              example: "2026-04-05T08:10:42.000Z",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              example: "2026-04-05T08:10:42.000Z",
            },
          },
        },
        CreateRecordRequest: {
          type: "object",
          required: ["amount", "type", "category"],
          properties: {
            amount: {
              type: "number",
              minimum: 0,
              example: 2200,
            },
            type: { $ref: "#/components/schemas/RecordType" },
            category: {
              type: "string",
              maxLength: 100,
              example: "Salary",
            },
            date: {
              type: "string",
              format: "date-time",
              example: "2026-04-05T00:00:00.000Z",
            },
            note: {
              type: "string",
              maxLength: 500,
              example: "Monthly salary credit",
            },
          },
        },
        UpdateRecordRequest: {
          type: "object",
          properties: {
            amount: {
              type: "number",
              minimum: 0,
              example: 2500,
            },
            type: { $ref: "#/components/schemas/RecordType" },
            category: {
              type: "string",
              maxLength: 100,
              example: "Investment",
            },
            date: {
              type: "string",
              format: "date-time",
              example: "2026-04-04T00:00:00.000Z",
            },
            note: {
              type: "string",
              maxLength: 500,
              example: "Updated note",
            },
          },
        },
        RecordResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: "Record created successfully" },
            data: { $ref: "#/components/schemas/Record" },
          },
        },
        DeleteRecordResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: "Record deleted successfully" },
          },
        },
        PaginationMeta: {
          type: "object",
          properties: {
            page: { type: "integer", example: 1 },
            limit: { type: "integer", example: 10 },
            total: { type: "integer", example: 57 },
            totalPages: { type: "integer", example: 6 },
          },
        },
        RecordsListResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: {
              type: "array",
              items: { $ref: "#/components/schemas/Record" },
            },
            pagination: { $ref: "#/components/schemas/PaginationMeta" },
          },
        },
        CategoryTotalItem: {
          type: "object",
          properties: {
            category: { type: "string", example: "Food" },
            income: { type: "number", format: "float", example: 0 },
            expense: { type: "number", format: "float", example: 3400 },
            net: { type: "number", format: "float", example: -3400 },
          },
        },
        MonthlyTrendItem: {
          type: "object",
          properties: {
            month: { type: "string", example: "2026-04" },
            totalIncome: { type: "number", format: "float", example: 58000 },
            totalExpense: {
              type: "number",
              format: "float",
              example: 42000,
            },
            netBalance: { type: "number", format: "float", example: 16000 },
          },
        },
        TotalIncomeResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: {
              type: "object",
              properties: {
                totalIncome: {
                  type: "number",
                  format: "float",
                  example: 58200,
                },
              },
            },
          },
        },
        TotalExpenseResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: {
              type: "object",
              properties: {
                totalExpense: {
                  type: "number",
                  format: "float",
                  example: 42300,
                },
              },
            },
          },
        },
        NetBalanceResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: {
              type: "object",
              properties: {
                netBalance: {
                  type: "number",
                  format: "float",
                  example: 15900,
                },
              },
            },
          },
        },
        CategoryTotalsResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: {
              type: "array",
              items: { $ref: "#/components/schemas/CategoryTotalItem" },
            },
          },
        },
        MonthlyTrendsResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: {
              type: "array",
              items: { $ref: "#/components/schemas/MonthlyTrendItem" },
            },
          },
        },
        RecentTransactionsResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: {
              type: "array",
              items: { $ref: "#/components/schemas/Record" },
            },
          },
        },
        DashboardSummary: {
          type: "object",
          properties: {
            totalIncome: { type: "number", format: "float", example: 58200 },
            totalExpense: { type: "number", format: "float", example: 42300 },
            netBalance: { type: "number", format: "float", example: 15900 },
            categoryTotals: {
              type: "array",
              items: { $ref: "#/components/schemas/CategoryTotalItem" },
            },
            monthlyTrends: {
              type: "array",
              items: { $ref: "#/components/schemas/MonthlyTrendItem" },
            },
            recentTransactions: {
              type: "array",
              items: { $ref: "#/components/schemas/Record" },
            },
          },
        },
        DashboardSummaryResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: { $ref: "#/components/schemas/DashboardSummary" },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: "Missing, invalid, or expired JWT token",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiErrorResponse" },
              example: {
                success: false,
                message: "Invalid or expired token",
              },
            },
          },
        },
        ForbiddenError: {
          description: "Authenticated but role does not have access",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiErrorResponse" },
              example: {
                success: false,
                message: "You do not have permission to access this resource",
              },
            },
          },
        },
        ValidationFailed: {
          description: "Request validation failed",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ValidationErrorResponse" },
              example: {
                success: false,
                message: "Validation failed",
                errors: [
                  {
                    field: "email",
                    message: "Invalid email format",
                  },
                ],
              },
            },
          },
        },
        NotFoundError: {
          description: "Resource not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiErrorResponse" },
              example: {
                success: false,
                message: "Resource not found",
              },
            },
          },
        },
        BadRequestError: {
          description: "Bad request",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiErrorResponse" },
              example: {
                success: false,
                message: "Email is already registered",
              },
            },
          },
        },
        InternalServerError: {
          description: "Unhandled server error",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiErrorResponse" },
              example: {
                success: false,
                message: "Internal server error",
              },
            },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    paths: {
      "/health": {
        get: {
          tags: ["Health"],
          summary: "Health check",
          description: "Public endpoint to confirm API health status",
          security: [],
          responses: {
            200: {
              description: "Service is healthy",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      message: { type: "string" },
                      timestamp: { type: "string", format: "date-time" },
                    },
                  },
                  example: {
                    success: true,
                    message: "Service is healthy",
                    timestamp: "2026-04-05T09:12:41.220Z",
                  },
                },
              },
            },
          },
        },
      },
      "/api/auth/register": {
        post: {
          tags: ["Auth (Public)", "Admin", "Viewer", "Analytics User"],
          summary: "Register user",
          description:
            "Public self-register works without token. If admin token is provided, this can also create managed viewer/analyst users.",
          security: [{ bearerAuth: [] }, {}],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RegisterRequest" },
                examples: {
                  selfRegister: {
                    summary: "Public self-registration",
                    value: {
                      name: "Public Viewer",
                      email: "public.viewer@example.com",
                      password: "Password@123",
                    },
                  },
                  adminManagedRegister: {
                    summary: "Admin-managed registration",
                    value: {
                      name: "Analytics User",
                      email: "analytics.user@example.com",
                      password: "TempPass@123",
                      role: "analyst",
                      isActive: true,
                    },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: "User created successfully",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/UserActionResponse" },
                },
              },
            },
            400: { $ref: "#/components/responses/BadRequestError" },
            403: { $ref: "#/components/responses/ForbiddenError" },
            500: { $ref: "#/components/responses/InternalServerError" },
          },
        },
      },
      "/api/auth/login": {
        post: {
          tags: ["Auth (Public)", "Admin", "Viewer", "Analytics User"],
          summary: "Login and receive JWT",
          description:
            "Use this endpoint first, then pass token in Authorize to try protected endpoints.",
          security: [],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LoginRequest" },
                example: {
                  email: "jeeshan@example.com",
                  password: "Password@123",
                },
              },
            },
          },
          responses: {
            200: {
              description: "Login successful",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/LoginResponse" },
                },
              },
            },
            400: { $ref: "#/components/responses/ValidationFailed" },
            401: { $ref: "#/components/responses/UnauthorizedError" },
            403: { $ref: "#/components/responses/ForbiddenError" },
            500: { $ref: "#/components/responses/InternalServerError" },
          },
        },
      },
      "/api/auth/refresh-token": {
        post: {
          tags: ["Auth (Public)", "Admin", "Viewer", "Analytics User"],
          summary: "Refresh access token",
          description:
            "Provide refresh token via x-refresh-token header or request body to receive a new access token.",
          security: [],
          parameters: [
            {
              name: "x-refresh-token",
              in: "header",
              required: false,
              schema: { type: "string" },
              description:
                "Refresh token header. Required when refreshToken is not sent in body.",
            },
          ],
          requestBody: {
            required: false,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RefreshTokenRequest" },
              },
            },
          },
          responses: {
            200: {
              description: "Access token refreshed successfully",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/RefreshTokenResponse",
                  },
                },
              },
            },
            400: { $ref: "#/components/responses/ValidationFailed" },
            401: { $ref: "#/components/responses/UnauthorizedError" },
            403: { $ref: "#/components/responses/ForbiddenError" },
            500: { $ref: "#/components/responses/InternalServerError" },
          },
        },
      },
      "/api/auth/logout": {
        post: {
          tags: ["Auth (Public)", "Admin", "Viewer", "Analytics User"],
          summary: "Logout and revoke refresh token",
          description:
            "Provide refresh token via x-refresh-token header or request body to revoke current session.",
          security: [],
          parameters: [
            {
              name: "x-refresh-token",
              in: "header",
              required: false,
              schema: { type: "string" },
              description:
                "Refresh token header. Required when refreshToken is not sent in body.",
            },
          ],
          requestBody: {
            required: false,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RefreshTokenRequest" },
              },
            },
          },
          responses: {
            200: {
              description: "Logout successful",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/LogoutResponse" },
                },
              },
            },
            400: { $ref: "#/components/responses/ValidationFailed" },
            500: { $ref: "#/components/responses/InternalServerError" },
          },
        },
      },
      "/api/users": {
        get: {
          tags: ["Users", "Admin"],
          summary: "List all users",
          description: "Admin-only endpoint.",
          responses: {
            200: {
              description: "Users fetched successfully",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/UsersListResponse" },
                },
              },
            },
            401: { $ref: "#/components/responses/UnauthorizedError" },
            403: { $ref: "#/components/responses/ForbiddenError" },
            500: { $ref: "#/components/responses/InternalServerError" },
          },
        },
        post: {
          tags: ["Users", "Admin"],
          summary: "Create managed user",
          description:
            "Admin-only endpoint to create viewer/analyst users and send credentials email.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/CreateManagedUserRequest",
                },
              },
            },
          },
          responses: {
            201: {
              description: "Managed user created successfully",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/UserActionResponse" },
                },
              },
            },
            400: { $ref: "#/components/responses/ValidationFailed" },
            401: { $ref: "#/components/responses/UnauthorizedError" },
            403: { $ref: "#/components/responses/ForbiddenError" },
            500: { $ref: "#/components/responses/InternalServerError" },
          },
        },
      },
      "/api/admin/profile": {
        put: {
          tags: ["Users", "Admin"],
          summary: "Update own admin profile",
          description:
            "Admin-only endpoint to update own name, email, and optional password.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/AdminProfileUpdateRequest",
                },
              },
            },
          },
          responses: {
            200: {
              description: "Admin profile updated successfully",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/UserActionResponse" },
                },
              },
            },
            400: { $ref: "#/components/responses/ValidationFailed" },
            401: { $ref: "#/components/responses/UnauthorizedError" },
            403: { $ref: "#/components/responses/ForbiddenError" },
            404: { $ref: "#/components/responses/NotFoundError" },
            500: { $ref: "#/components/responses/InternalServerError" },
          },
        },
      },
      "/api/admin/user/{id}": {
        put: {
          tags: ["Users", "Admin"],
          summary: "Update any user by admin",
          description:
            "Admin-only endpoint to update name, email, role (admin/staff/user), and status.",
          parameters: [{ $ref: "#/components/parameters/UserIdParam" }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/AdminUserUpdateRequest",
                },
              },
            },
          },
          responses: {
            200: {
              description: "User updated successfully",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/UserActionResponse" },
                },
              },
            },
            400: { $ref: "#/components/responses/ValidationFailed" },
            401: { $ref: "#/components/responses/UnauthorizedError" },
            403: { $ref: "#/components/responses/ForbiddenError" },
            404: { $ref: "#/components/responses/NotFoundError" },
            500: { $ref: "#/components/responses/InternalServerError" },
          },
        },
      },
      "/api/users/{id}/role": {
        patch: {
          tags: ["Users", "Admin"],
          summary: "Update user role",
          description: "Admin-only endpoint.",
          parameters: [{ $ref: "#/components/parameters/UserIdParam" }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UpdateRoleRequest" },
                example: {
                  role: "analyst",
                },
              },
            },
          },
          responses: {
            200: {
              description: "User role updated successfully",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/UserActionResponse" },
                },
              },
            },
            400: { $ref: "#/components/responses/ValidationFailed" },
            401: { $ref: "#/components/responses/UnauthorizedError" },
            403: { $ref: "#/components/responses/ForbiddenError" },
            404: { $ref: "#/components/responses/NotFoundError" },
            500: { $ref: "#/components/responses/InternalServerError" },
          },
        },
      },
      "/api/users/{id}/status": {
        patch: {
          tags: ["Users", "Admin"],
          summary: "Activate or deactivate user",
          description: "Admin-only endpoint.",
          parameters: [{ $ref: "#/components/parameters/UserIdParam" }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UpdateStatusRequest" },
                example: {
                  isActive: false,
                },
              },
            },
          },
          responses: {
            200: {
              description: "User status updated successfully",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/UserActionResponse" },
                },
              },
            },
            400: { $ref: "#/components/responses/ValidationFailed" },
            401: { $ref: "#/components/responses/UnauthorizedError" },
            403: { $ref: "#/components/responses/ForbiddenError" },
            404: { $ref: "#/components/responses/NotFoundError" },
            500: { $ref: "#/components/responses/InternalServerError" },
          },
        },
      },
      "/api/records": {
        get: {
          tags: ["Records", "Analytics User", "Admin"],
          summary: "Get records with filters and pagination",
          description: "Accessible by analyst and admin roles.",
          parameters: [
            {
              name: "startDate",
              in: "query",
              required: false,
              schema: { type: "string", format: "date-time" },
              description: "Filter records from this date-time (inclusive)",
            },
            {
              name: "endDate",
              in: "query",
              required: false,
              schema: { type: "string", format: "date-time" },
              description: "Filter records up to this date-time (inclusive)",
            },
            {
              name: "category",
              in: "query",
              required: false,
              schema: { type: "string" },
            },
            {
              name: "type",
              in: "query",
              required: false,
              schema: {
                type: "string",
                enum: ["income", "expense"],
              },
            },
            {
              name: "search",
              in: "query",
              required: false,
              schema: { type: "string" },
              description: "Searches across category and note fields",
            },
            {
              name: "page",
              in: "query",
              required: false,
              schema: {
                type: "integer",
                minimum: 1,
                default: 1,
              },
            },
            {
              name: "limit",
              in: "query",
              required: false,
              schema: {
                type: "integer",
                minimum: 1,
                maximum: 100,
                default: 10,
              },
            },
            {
              name: "sortBy",
              in: "query",
              required: false,
              schema: {
                type: "string",
                enum: ["date", "amount", "category", "createdAt"],
                default: "date",
              },
            },
            {
              name: "sortOrder",
              in: "query",
              required: false,
              schema: {
                type: "string",
                enum: ["asc", "desc"],
                default: "desc",
              },
            },
          ],
          responses: {
            200: {
              description: "Records fetched successfully",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/RecordsListResponse" },
                },
              },
            },
            400: { $ref: "#/components/responses/ValidationFailed" },
            401: { $ref: "#/components/responses/UnauthorizedError" },
            403: { $ref: "#/components/responses/ForbiddenError" },
            500: { $ref: "#/components/responses/InternalServerError" },
          },
        },
        post: {
          tags: ["Records", "Admin"],
          summary: "Create financial record",
          description: "Admin-only endpoint.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreateRecordRequest" },
              },
            },
          },
          responses: {
            201: {
              description: "Record created successfully",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/RecordResponse" },
                },
              },
            },
            400: { $ref: "#/components/responses/ValidationFailed" },
            401: { $ref: "#/components/responses/UnauthorizedError" },
            403: { $ref: "#/components/responses/ForbiddenError" },
            500: { $ref: "#/components/responses/InternalServerError" },
          },
        },
      },
      "/api/records/{id}": {
        patch: {
          tags: ["Records", "Admin"],
          summary: "Update financial record",
          description: "Admin-only endpoint.",
          parameters: [{ $ref: "#/components/parameters/RecordIdParam" }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UpdateRecordRequest" },
              },
            },
          },
          responses: {
            200: {
              description: "Record updated successfully",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/RecordResponse" },
                },
              },
            },
            400: { $ref: "#/components/responses/ValidationFailed" },
            401: { $ref: "#/components/responses/UnauthorizedError" },
            403: { $ref: "#/components/responses/ForbiddenError" },
            404: { $ref: "#/components/responses/NotFoundError" },
            500: { $ref: "#/components/responses/InternalServerError" },
          },
        },
        delete: {
          tags: ["Records", "Admin"],
          summary: "Soft delete financial record",
          description: "Admin-only endpoint.",
          parameters: [{ $ref: "#/components/parameters/RecordIdParam" }],
          responses: {
            200: {
              description: "Record deleted successfully",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/DeleteRecordResponse",
                  },
                },
              },
            },
            400: { $ref: "#/components/responses/ValidationFailed" },
            401: { $ref: "#/components/responses/UnauthorizedError" },
            403: { $ref: "#/components/responses/ForbiddenError" },
            404: { $ref: "#/components/responses/NotFoundError" },
            500: { $ref: "#/components/responses/InternalServerError" },
          },
        },
      },
      "/api/dashboard/total-income": {
        get: {
          tags: ["Dashboard", "Viewer", "Analytics User", "Admin"],
          summary: "Get total income",
          description: "Accessible by viewer, analyst, and admin roles.",
          responses: {
            200: {
              description: "Total income fetched",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/TotalIncomeResponse",
                  },
                },
              },
            },
            401: { $ref: "#/components/responses/UnauthorizedError" },
            403: { $ref: "#/components/responses/ForbiddenError" },
            500: { $ref: "#/components/responses/InternalServerError" },
          },
        },
      },
      "/api/dashboard/total-expense": {
        get: {
          tags: ["Dashboard", "Viewer", "Analytics User", "Admin"],
          summary: "Get total expense",
          description: "Accessible by viewer, analyst, and admin roles.",
          responses: {
            200: {
              description: "Total expense fetched",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/TotalExpenseResponse",
                  },
                },
              },
            },
            401: { $ref: "#/components/responses/UnauthorizedError" },
            403: { $ref: "#/components/responses/ForbiddenError" },
            500: { $ref: "#/components/responses/InternalServerError" },
          },
        },
      },
      "/api/dashboard/net-balance": {
        get: {
          tags: ["Dashboard", "Viewer", "Analytics User", "Admin"],
          summary: "Get net balance",
          description: "Accessible by viewer, analyst, and admin roles.",
          responses: {
            200: {
              description: "Net balance fetched",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/NetBalanceResponse" },
                },
              },
            },
            401: { $ref: "#/components/responses/UnauthorizedError" },
            403: { $ref: "#/components/responses/ForbiddenError" },
            500: { $ref: "#/components/responses/InternalServerError" },
          },
        },
      },
      "/api/dashboard/category-totals": {
        get: {
          tags: ["Dashboard", "Viewer", "Analytics User", "Admin"],
          summary: "Get category-wise totals",
          description: "Accessible by viewer, analyst, and admin roles.",
          responses: {
            200: {
              description: "Category totals fetched",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/CategoryTotalsResponse",
                  },
                },
              },
            },
            401: { $ref: "#/components/responses/UnauthorizedError" },
            403: { $ref: "#/components/responses/ForbiddenError" },
            500: { $ref: "#/components/responses/InternalServerError" },
          },
        },
      },
      "/api/dashboard/monthly-trends": {
        get: {
          tags: ["Dashboard", "Viewer", "Analytics User", "Admin"],
          summary: "Get monthly trends",
          description: "Accessible by viewer, analyst, and admin roles.",
          responses: {
            200: {
              description: "Monthly trends fetched",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/MonthlyTrendsResponse",
                  },
                },
              },
            },
            401: { $ref: "#/components/responses/UnauthorizedError" },
            403: { $ref: "#/components/responses/ForbiddenError" },
            500: { $ref: "#/components/responses/InternalServerError" },
          },
        },
      },
      "/api/dashboard/recent-transactions": {
        get: {
          tags: ["Dashboard", "Viewer", "Analytics User", "Admin"],
          summary: "Get recent transactions",
          description: "Accessible by viewer, analyst, and admin roles.",
          responses: {
            200: {
              description: "Recent transactions fetched",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/RecentTransactionsResponse",
                  },
                },
              },
            },
            401: { $ref: "#/components/responses/UnauthorizedError" },
            403: { $ref: "#/components/responses/ForbiddenError" },
            500: { $ref: "#/components/responses/InternalServerError" },
          },
        },
      },
      "/api/dashboard/summary": {
        get: {
          tags: ["Dashboard", "Viewer", "Analytics User", "Admin"],
          summary: "Get full dashboard summary",
          description: "Accessible by viewer, analyst, and admin roles.",
          responses: {
            200: {
              description: "Dashboard summary fetched",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/DashboardSummaryResponse",
                  },
                },
              },
            },
            401: { $ref: "#/components/responses/UnauthorizedError" },
            403: { $ref: "#/components/responses/ForbiddenError" },
            500: { $ref: "#/components/responses/InternalServerError" },
          },
        },
      },
    },
  },
  apis: [],
};

module.exports = swaggerJsdoc(options);
