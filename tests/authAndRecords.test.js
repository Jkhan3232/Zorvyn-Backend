process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test_jwt_secret";
process.env.ENABLE_GRAPHQL = "false";
process.env.SMTP_FROM_EMAIL = "no-reply@test.local";

const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const createApp = require("../src/app");
const User = require("../src/models/User");

describe("Finance API: auth and record access", () => {
  let mongod;
  let app;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri(), {
      maxPoolSize: 10,
      minPoolSize: 0,
      serverSelectionTimeoutMS: 5000,
    });
    app = await createApp();
  });

  afterEach(async () => {
    const collections = mongoose.connection.collections;
    await Promise.all(
      Object.values(collections).map((collection) => collection.deleteMany({})),
    );
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongod) {
      await mongod.stop();
    }
  });

  it("registers and logs in a user", async () => {
    const registerRes = await request(app).post("/api/auth/register").send({
      name: "Test User",
      email: "test@example.com",
      password: "password123",
    });

    expect(registerRes.status).toBe(201);
    expect(registerRes.body.success).toBe(true);
    expect(registerRes.body.data.email).toBe("test@example.com");

    const loginRes = await request(app).post("/api/auth/login").send({
      email: "test@example.com",
      password: "password123",
    });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body.data.token).toBeDefined();
    expect(loginRes.body.data.accessToken).toBeDefined();
    expect(loginRes.body.data.refreshToken).toBeDefined();
  });

  it("refreshes access token and revokes refresh token on logout", async () => {
    await request(app).post("/api/auth/register").send({
      name: "Refresh User",
      email: "refresh@example.com",
      password: "password123",
    });

    const loginRes = await request(app).post("/api/auth/login").send({
      email: "refresh@example.com",
      password: "password123",
    });

    const refreshToken = loginRes.body.data.refreshToken;

    const refreshRes = await request(app)
      .post("/api/auth/refresh-token")
      .send({ refreshToken });

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.success).toBe(true);
    expect(refreshRes.body.data.accessToken).toBeDefined();

    const logoutRes = await request(app)
      .post("/api/auth/logout")
      .set("x-refresh-token", refreshToken);

    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.success).toBe(true);

    const refreshAfterLogout = await request(app)
      .post("/api/auth/refresh-token")
      .set("x-refresh-token", refreshToken);

    expect(refreshAfterLogout.status).toBe(401);
  });

  it("enforces admin write, analyst read, and viewer dashboard-only access", async () => {
    await request(app).post("/api/auth/register").send({
      name: "Admin User",
      email: "admin@example.com",
      password: "password123",
    });

    await User.findOneAndUpdate(
      { email: "admin@example.com" },
      { role: "admin" },
      { returnDocument: "after" },
    );

    const adminLogin = await request(app).post("/api/auth/login").send({
      email: "admin@example.com",
      password: "password123",
    });

    const adminToken = adminLogin.body.data.token;

    const createRes = await request(app)
      .post("/api/records")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        amount: 1200,
        type: "income",
        category: "Salary",
        note: "Monthly payroll",
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.category).toBe("Salary");

    await request(app).post("/api/auth/register").send({
      name: "Viewer User",
      email: "viewer@example.com",
      password: "password123",
    });

    const viewerLogin = await request(app).post("/api/auth/login").send({
      email: "viewer@example.com",
      password: "password123",
    });

    const viewerToken = viewerLogin.body.data.token;

    const blockedCreate = await request(app)
      .post("/api/records")
      .set("Authorization", `Bearer ${viewerToken}`)
      .send({
        amount: 50,
        type: "expense",
        category: "Food",
      });

    expect(blockedCreate.status).toBe(403);

    const readRes = await request(app)
      .get("/api/records")
      .set("Authorization", `Bearer ${viewerToken}`);

    expect(readRes.status).toBe(403);

    const viewerSummaryRes = await request(app)
      .get("/api/dashboard/summary")
      .set("Authorization", `Bearer ${viewerToken}`);

    expect(viewerSummaryRes.status).toBe(200);

    await request(app).post("/api/auth/register").send({
      name: "Analyst User",
      email: "analyst@example.com",
      password: "password123",
    });

    await User.findOneAndUpdate(
      { email: "analyst@example.com" },
      { role: "analyst" },
      { returnDocument: "after" },
    );

    const analystLogin = await request(app).post("/api/auth/login").send({
      email: "analyst@example.com",
      password: "password123",
    });

    const analystToken = analystLogin.body.data.token;

    const analystReadRes = await request(app)
      .get("/api/records")
      .set("Authorization", `Bearer ${analystToken}`);

    expect(analystReadRes.status).toBe(200);
    expect(Array.isArray(analystReadRes.body.data)).toBe(true);
  });

  it("allows admin to create managed analyst user", async () => {
    await request(app).post("/api/auth/register").send({
      name: "Admin User",
      email: "admin2@example.com",
      password: "password123",
    });

    await User.findOneAndUpdate(
      { email: "admin2@example.com" },
      { role: "admin" },
      { returnDocument: "after" },
    );

    const adminLogin = await request(app).post("/api/auth/login").send({
      email: "admin2@example.com",
      password: "password123",
    });

    const adminToken = adminLogin.body.data.token;

    const createUserRes = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Managed Analyst",
        email: "managed.analyst@example.com",
        role: "analyst",
      });

    expect(createUserRes.status).toBe(201);
    expect(createUserRes.body.success).toBe(true);
    expect(createUserRes.body.data.email).toBe("managed.analyst@example.com");
    expect(createUserRes.body.data.role).toBe("analyst");

    const createdUser = await User.findOne({
      email: "managed.analyst@example.com",
    }).select("+password");

    expect(createdUser).toBeTruthy();
    expect(createdUser.password).toBeDefined();
  });

  it("treats admin-authenticated register as managed user creation", async () => {
    await request(app).post("/api/auth/register").send({
      name: "Primary Admin",
      email: "primary.admin@example.com",
      password: "password123",
    });

    await User.findOneAndUpdate(
      { email: "primary.admin@example.com" },
      { role: "admin" },
      { returnDocument: "after" },
    );

    const adminLogin = await request(app).post("/api/auth/login").send({
      email: "primary.admin@example.com",
      password: "password123",
    });

    const adminToken = adminLogin.body.data.token;

    const managedRegisterRes = await request(app)
      .post("/api/auth/register")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Frontend Added Analyst",
        email: "frontend.analyst@example.com",
        password: "analystPassword123",
        role: "analyst",
      });

    expect(managedRegisterRes.status).toBe(201);
    expect(managedRegisterRes.body.success).toBe(true);
    expect(managedRegisterRes.body.message).toBe(
      "User created and credentials email sent successfully",
    );
    expect(managedRegisterRes.body.data.role).toBe("analyst");

    const analystLogin = await request(app).post("/api/auth/login").send({
      email: "frontend.analyst@example.com",
      password: "analystPassword123",
    });

    expect(analystLogin.status).toBe(200);
    expect(analystLogin.body.success).toBe(true);
  });

  it("allows admin to update own profile", async () => {
    await request(app).post("/api/auth/register").send({
      name: "Profile Admin",
      email: "profile.admin@example.com",
      password: "password123",
    });

    await User.findOneAndUpdate(
      { email: "profile.admin@example.com" },
      { role: "admin" },
      { returnDocument: "after" },
    );

    const adminLogin = await request(app).post("/api/auth/login").send({
      email: "profile.admin@example.com",
      password: "password123",
    });

    const adminToken = adminLogin.body.data.accessToken;

    const updateProfileRes = await request(app)
      .put("/api/admin/profile")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Profile Admin Updated",
        email: "profile.admin.updated@example.com",
        password: "newpassword123",
      });

    expect(updateProfileRes.status).toBe(200);
    expect(updateProfileRes.body.success).toBe(true);
    expect(updateProfileRes.body.data.email).toBe(
      "profile.admin.updated@example.com",
    );

    const oldCredentialsLogin = await request(app)
      .post("/api/auth/login")
      .send({
        email: "profile.admin@example.com",
        password: "password123",
      });

    expect(oldCredentialsLogin.status).toBe(401);

    const updatedCredentialsLogin = await request(app)
      .post("/api/auth/login")
      .send({
        email: "profile.admin.updated@example.com",
        password: "newpassword123",
      });

    expect(updatedCredentialsLogin.status).toBe(200);
    expect(updatedCredentialsLogin.body.success).toBe(true);
  });

  it("allows admin to update any user role and status", async () => {
    await request(app).post("/api/auth/register").send({
      name: "Admin Updater",
      email: "admin.updater@example.com",
      password: "password123",
    });

    await User.findOneAndUpdate(
      { email: "admin.updater@example.com" },
      { role: "admin" },
      { returnDocument: "after" },
    );

    await request(app).post("/api/auth/register").send({
      name: "Target User",
      email: "target.user@example.com",
      password: "password123",
    });

    const adminLogin = await request(app).post("/api/auth/login").send({
      email: "admin.updater@example.com",
      password: "password123",
    });

    const adminToken = adminLogin.body.data.accessToken;
    const targetUser = await User.findOne({ email: "target.user@example.com" });

    const updateUserRes = await request(app)
      .put(`/api/admin/user/${targetUser._id.toString()}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Target User Updated",
        role: "staff",
        status: "inactive",
      });

    expect(updateUserRes.status).toBe(200);
    expect(updateUserRes.body.success).toBe(true);
    expect(updateUserRes.body.data.name).toBe("Target User Updated");
    expect(updateUserRes.body.data.role).toBe("analyst");
    expect(updateUserRes.body.data.isActive).toBe(false);

    const targetLoginRes = await request(app).post("/api/auth/login").send({
      email: "target.user@example.com",
      password: "password123",
    });

    expect(targetLoginRes.status).toBe(403);
  });
});
