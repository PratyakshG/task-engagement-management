import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../src/app.js";

const managerCredentials = {
  email: "rahul.manager@example.com",
  password: "Password123!",
};

const teamMemberCredentials = {
  email: "amit@example.com",
  password: "Password123!",
};

async function login(credentials: typeof managerCredentials): Promise<string> {
  const response = await request(app).post("/api/auth/login").send(credentials);

  expect(response.status).toBe(200);
  expect(response.body.token).toBeDefined();

  return response.body.token;
}

describe("Authentication and RBAC", () => {
  it("returns 401 when accessing a protected route without a token", async () => {
    const response = await request(app).get("/api/users");

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Authentication required.");
  });

  it("returns 400 for invalid login input", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "not-an-email", password: "" });
    expect(response.status).toBe(400);
  });

  it("allows a manager to access the users endpoint", async () => {
    const token = await login(managerCredentials);

    const response = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${token}`);
    expect(response.status).toBe(200);
  });

  it("denies a team member access to the users endpoint", async () => {
    const token = await login(teamMemberCredentials);

    const response = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${token}`);
    expect(response.status).toBe(403);
  });

  it("denies a team member access to user creation", async () => {
    const token = await login(teamMemberCredentials);

    const response = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Unauthorized User",
        email: "unauthorized@example.com",
        password: "Password123!",
        role: "TEAM_MEMBER",
      });

    expect(response.status).toBe(403);
  });
});
