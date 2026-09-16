import request from "supertest";

import { describe, expect, it } from "vitest";

import { prisma } from "../src/lib/prisma.js";
import { app } from "../src/app.js";

const managerCredentials = {
  email: "rahul.manager@example.com",
  password: "Password123!",
};

const teamMemberCredentials = {
  email: "amit@example.com",
  password: "Password123!",
};

const testRunId = Date.now();

async function login(credentials: typeof managerCredentials): Promise<string> {
  const response = await request(app).post("/api/auth/login").send(credentials);

  expect(response.status).toBe(200);
  expect(response.body.token).toBeDefined();

  return response.body.token;
}

describe("Engagement recurring workflow", () => {
  it("prevents duplicate recurring engagements for the same client, service, and period", async () => {
    const managerToken = await login(managerCredentials);

    const recurringService = await prisma.serviceType.findFirst({
      where: {
        isRecurring: true,
      },
    });

    expect(recurringService).toBeDefined();

    const client = await prisma.client.findFirst();

    expect(client).toBeDefined();

    const existingPeriods = await prisma.engagement.findMany({
      where: {
        clientId: client!.id,
        serviceTypeId: recurringService!.id,
        period: {
          not: null,
        },
      },
      select: {
        period: true,
      },
    });

    const usedPeriods = new Set(
      existingPeriods.map((engagement) => engagement.period),
    );

    let period = "2099-01";

    while (usedPeriods.has(period)) {
      const [year, month] = period.split("-").map(Number);

      period =
        month === 12
          ? `${year + 1}-01`
          : `${year}-${String(month + 1).padStart(2, "0")}`;
    }

    const firstResponse = await request(app)
      .post("/api/engagements")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({
        clientId: client!.id,
        serviceTypeId: recurringService!.id,
        period,
      });

    expect(firstResponse.status).toBe(201);

    const secondResponse = await request(app)
      .post("/api/engagements")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({
        clientId: client!.id,
        serviceTypeId: recurringService!.id,
        period,
      });

    expect(secondResponse.status).toBe(409);
  });

  it("allows a manager to generate the next recurring engagement", async () => {
    const managerToken = await login(managerCredentials);

    const recurringService = await prisma.serviceType.findFirst({
      where: {
        isRecurring: true,
        recurrenceInterval: "MONTHLY",
      },
    });

    expect(recurringService).toBeDefined();

    const client = await prisma.client.findFirst();

    expect(client).toBeDefined();

    const year = 1000 + (testRunId % 9000);
    const period = `${year}-01`;

    const createResponse = await request(app)
      .post("/api/engagements")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({
        clientId: client!.id,
        serviceTypeId: recurringService!.id,
        period,
      });

    expect(createResponse.status).toBe(201);

    const engagementId = createResponse.body.engagement.id;

    const generateResponse = await request(app)
      .post(`/api/engagements/${engagementId}/generate-next`)
      .set("Authorization", `Bearer ${managerToken}`);

    expect(generateResponse.status).toBe(201);

    const expectedNextPeriod = `${year}-02`;

    expect(generateResponse.body.period).toBe(expectedNextPeriod);
  }, 10000);

  it("denies a team member from generating the next engagement", async () => {
    const managerToken = await login(managerCredentials);
    const teamMemberToken = await login(teamMemberCredentials);

    const recurringService = await prisma.serviceType.findFirst({
      where: {
        isRecurring: true,
      },
    });

    expect(recurringService).toBeDefined();

    const client = await prisma.client.findFirst();

    expect(client).toBeDefined();

    const year = 1000 + (testRunId % 9000);
    const period = `${year}-03`;

    const createResponse = await request(app)
      .post("/api/engagements")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({
        clientId: client!.id,
        serviceTypeId: recurringService!.id,
        period,
      });

    expect(createResponse.status).toBe(201);

    const engagementId = createResponse.body.engagement.id;

    const response = await request(app)
      .post(`/api/engagements/${engagementId}/generate-next`)
      .set("Authorization", `Bearer ${teamMemberToken}`);

    expect(response.status).toBe(403);
  });
});
