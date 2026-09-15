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

describe("Dashboard", () => {
  it("requires authentication", async () => {
    const response = await request(app).get("/api/dashboard");

    expect(response.status).toBe(401);
  });

  it("returns all dashboard metrics for a manager", async () => {
    const managerToken = await login(managerCredentials);

    const response = await request(app)
      .get("/api/dashboard")
      .set("Authorization", `Bearer ${managerToken}`);

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      openTasks: expect.any(Number),
      overdueTasks: expect.any(Number),
      dueToday: expect.any(Number),
      waitingForClient: expect.any(Number),
      waitingForReview: expect.any(Number),
    });
  });

  it("returns all dashboard metrics for a team member", async () => {
    const teamMemberToken = await login(teamMemberCredentials);

    const response = await request(app)
      .get("/api/dashboard")
      .set("Authorization", `Bearer ${teamMemberToken}`);

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      openTasks: expect.any(Number),
      overdueTasks: expect.any(Number),
      dueToday: expect.any(Number),
      waitingForClient: expect.any(Number),
      waitingForReview: expect.any(Number),
    });
  });
});
