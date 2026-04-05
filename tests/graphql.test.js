const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");
const createApp = require("../src/app");
const User = require("../src/models/User");

let mongoServer;
let app;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  process.env.JWT_SECRET = "test_secret";
  process.env.ENABLE_GRAPHQL = "true";
  app = await createApp();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("GraphQL API Test", () => {
  let adminToken;

  beforeAll(async () => {
    // 1. Register & Login as Admin
    await request(app).post("/api/auth/register").send({
      name: "GraphQL Admin",
      email: "gqladmin@example.com",
      password: "Password@123",
    });

    await User.updateOne({ email: "gqladmin@example.com" }, { role: "admin" });

    const loginRes = await request(app).post("/api/auth/login").send({
      email: "gqladmin@example.com",
      password: "Password@123",
    });
    adminToken = loginRes.body.data.token;
  });

  it("should fetch dashboard summary via GraphQL query", async () => {
    const query = `
      query GetSummary {
        getSummary {
          totalIncome
          totalExpense
          netBalance
        }
      }
    `;

    const res = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ query });

    expect(res.status).toBe(200);
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.getSummary).toHaveProperty("totalIncome");
    expect(res.body.data.getSummary).toHaveProperty("totalExpense");
    expect(res.body.data.getSummary).toHaveProperty("netBalance");
  });

  it("should create a record via GraphQL mutation", async () => {
    const mutation = `
      mutation CreateRecord($input: CreateRecordInput!) {
        createRecord(input: $input) {
          id
          amount
          type
          category
        }
      }
    `;

    const variables = {
      input: {
        amount: 5000,
        type: "income",
        category: "GraphQL Freelance",
      },
    };

    const res = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ query: mutation, variables });

    expect(res.status).toBe(200);
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.createRecord.amount).toBe(5000);
    expect(res.body.data.createRecord.category).toBe("GraphQL Freelance");
    expect(res.body.data.createRecord.type).toBe("income");
  });
});
