import request from "supertest";
import { app } from "../app";
import { connectDatabase, disconnectDatabase } from "../config/database";
import { User } from "../models/User";

describe("Authentication & RBAC Security Suite", () => {
  beforeAll(async () => {
    await connectDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  it("Should allow registering a student account", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Alice Johnson",
      email: "alice@student.edu",
      password: "StrongPassword123!",
      role: "student",
      studentId: "ENR-9901",
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe("alice@student.edu");
    expect(res.body.user.role).toBe("student");
  });

  it("CRITICAL: Should strictly reject public self-registration with 'admin' role", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Hacker Admin",
      email: "hacker@test.com",
      password: "AttackPassword123!",
      role: "admin",
    });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Administrative or Issuer accounts cannot be registered publicly/i);

    const userInDb = await User.findOne({ email: "hacker@test.com" });
    expect(userInDb).toBeNull();
  });

  it("CRITICAL: Should strictly reject public self-registration with 'issuer' role", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Fake Issuer",
      email: "fakeissuer@test.com",
      password: "AttackPassword123!",
      role: "issuer",
    });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it("Should successfully authenticate a registered user and return JWT", async () => {
    await request(app).post("/api/auth/register").send({
      name: "Bob Student",
      email: "bob@student.edu",
      password: "PasswordBob123!",
      role: "student",
    });

    const loginRes = await request(app).post("/api/auth/login").send({
      email: "bob@student.edu",
      password: "PasswordBob123!",
    });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.token).toBeDefined();
    expect(loginRes.body.user.name).toBe("Bob Student");
  });

  it("Should reject login with invalid password", async () => {
    await request(app).post("/api/auth/register").send({
      name: "Bob Student",
      email: "bob@student.edu",
      password: "PasswordBob123!",
      role: "student",
    });

    const loginRes = await request(app).post("/api/auth/login").send({
      email: "bob@student.edu",
      password: "WrongPassword!",
    });

    expect(loginRes.status).toBe(401);
    expect(loginRes.body.success).toBe(false);
  });
});
