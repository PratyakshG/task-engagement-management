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

async function login(credentials: typeof managerCredentials): Promise<string> {
  const response = await request(app).post("/api/auth/login").send(credentials);

  expect(response.status).toBe(200);
  expect(response.body.token).toBeDefined();

  return response.body.token;
}

async function createTestTask(
  status:
    | "NOT_STARTED"
    | "IN_PROGRESS"
    | "WAITING_FOR_CLIENT"
    | "READY_FOR_REVIEW"
    | "CHANGES_REQUESTED"
    | "COMPLETED",
  assignedToId: string | null = null,
) {
  const engagement = await prisma.engagement.findFirst();

  if (!engagement) {
    throw new Error("No engagement found in test database.");
  }

  return prisma.task.create({
    data: {
      engagementId: engagement.id,
      title: `Test Task ${Date.now()}`,
      status,
      assignedToId,
    },
  });
}

describe("Task assignment authorization", () => {
  it("allows a manager to assign a task to a team member", async () => {
    const managerToken = await login(managerCredentials);

    const tasksResponse = await request(app)
      .get("/api/tasks")
      .set("Authorization", `Bearer ${managerToken}`);

    expect(tasksResponse.status).toBe(200);
    expect(tasksResponse.body.tasks.length).toBeGreaterThan(0);

    const taskId = tasksResponse.body.tasks[0].id;

    const usersResponse = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${managerToken}`);

    // console.log("Users response:", usersResponse.body);

    expect(usersResponse.status).toBe(200);

    const teamMember = usersResponse.body.users.find(
      (user: { email: string; role: string }) =>
        user.email === teamMemberCredentials.email &&
        user.role === "TEAM_MEMBER",
    );

    expect(teamMember).toBeDefined();

    const response = await request(app)
      .patch(`/api/tasks/${taskId}/assignment`)
      .set("Authorization", `Bearer ${managerToken}`)
      .send({
        assignedToId: teamMember.id,
      });

    expect(response.status).toBe(200);
    // console.log("Assignment response:", response.body);
    expect(response.body.task.assignedTo.id).toBe(teamMember.id);
  });

  it("denies a team member from assigning a task", async () => {
    const managerToken = await login(managerCredentials);
    const teamMemberToken = await login(teamMemberCredentials);

    const tasksResponse = await request(app)
      .get("/api/tasks")
      .set("Authorization", `Bearer ${managerToken}`);

    expect(tasksResponse.status).toBe(200);
    // console.log("Tasks response:", tasksResponse.body);
    expect(tasksResponse.body.tasks.length).toBeGreaterThan(0);

    const taskId = tasksResponse.body.tasks[0].id;

    const response = await request(app)
      .patch(`/api/tasks/${taskId}/assignment`)
      .set("Authorization", `Bearer ${teamMemberToken}`)
      .send({
        assignedToId: null,
      });

    expect(response.status).toBe(403);
  });

  it("denies a team member from updating another team member's task", async () => {
    const managerToken = await login(managerCredentials);
    const teamMemberToken = await login(teamMemberCredentials);

    const usersResponse = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${managerToken}`);

    expect(usersResponse.status).toBe(200);

    const teamMember = usersResponse.body.users.find(
      (user: { email: string; role: string }) =>
        user.email === teamMemberCredentials.email &&
        user.role === "TEAM_MEMBER",
    );

    expect(teamMember).toBeDefined();

    const tasksResponse = await request(app)
      .get("/api/tasks")
      .set("Authorization", `Bearer ${managerToken}`);

    expect(tasksResponse.status).toBe(200);

    const task = tasksResponse.body.tasks.find(
      (task: { assignedToId?: string }) =>
        task.assignedToId && task.assignedToId !== teamMember.id,
    );

    expect(task).toBeDefined();

    const response = await request(app)
      .patch(`/api/tasks/${task.id}/status`)
      .set("Authorization", `Bearer ${teamMemberToken}`)
      .send({
        status: "IN_PROGRESS",
      });

    expect(response.status).toBe(403);
  });

  it("allows a team member to move their own task to in progress", async () => {
    const managerToken = await login(managerCredentials);
    const teamMemberToken = await login(teamMemberCredentials);

    const usersResponse = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${managerToken}`);

    expect(usersResponse.status).toBe(200);

    const teamMember = usersResponse.body.users.find(
      (user: { email: string; role: string }) =>
        user.email === teamMemberCredentials.email &&
        user.role === "TEAM_MEMBER",
    );

    expect(teamMember).toBeDefined();

    const task = await createTestTask("NOT_STARTED", teamMember.id);

    expect(task).toBeDefined();

    const assignmentResponse = await request(app)
      .patch(`/api/tasks/${task.id}/assignment`)
      .set("Authorization", `Bearer ${managerToken}`)
      .send({
        assignedToId: teamMember.id,
      });

    expect(assignmentResponse.status).toBe(200);

    const response = await request(app)
      .patch(`/api/tasks/${task.id}/status`)
      .set("Authorization", `Bearer ${teamMemberToken}`)
      .send({
        status: "IN_PROGRESS",
      });

    expect(response.status).toBe(200);
    expect(response.body.task.status).toBe("IN_PROGRESS");
  });

  it("denies a team member from directly completing their own task", async () => {
    const managerToken = await login(managerCredentials);
    const teamMemberToken = await login(teamMemberCredentials);

    const usersResponse = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${managerToken}`);

    expect(usersResponse.status).toBe(200);

    const teamMember = usersResponse.body.users.find(
      (user: { email: string; role: string }) =>
        user.email === teamMemberCredentials.email &&
        user.role === "TEAM_MEMBER",
    );

    expect(teamMember).toBeDefined();

    const tasksResponse = await request(app)
      .get("/api/tasks?page=1&pageSize=100")
      .set("Authorization", `Bearer ${managerToken}`);

    expect(tasksResponse.status).toBe(200);

    const task = tasksResponse.body.tasks.find(
      (task: { assignedToId?: string; status: string }) =>
        task.assignedToId === teamMember.id && task.status !== "COMPLETED",
    );

    expect(task).toBeDefined();

    const response = await request(app)
      .patch(`/api/tasks/${task.id}/status`)
      .set("Authorization", `Bearer ${teamMemberToken}`)
      .send({
        status: "COMPLETED",
      });

    expect(response.status).toBe(400);
  });

  it("rejects an invalid direct transition from in progress to completed", async () => {
    const managerToken = await login(managerCredentials);
    const teamMemberToken = await login(teamMemberCredentials);

    const usersResponse = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${managerToken}`);

    expect(usersResponse.status).toBe(200);

    const teamMember = usersResponse.body.users.find(
      (user: { email: string; role: string }) =>
        user.email === teamMemberCredentials.email &&
        user.role === "TEAM_MEMBER",
    );

    expect(teamMember).toBeDefined();

    const tasksResponse = await request(app)
      .get("/api/tasks?page=1&pageSize=100")
      .set("Authorization", `Bearer ${managerToken}`);

    expect(tasksResponse.status).toBe(200);

    const task = tasksResponse.body.tasks.find(
      (task: { assignedToId?: string; status: string }) =>
        task.assignedToId === teamMember.id && task.status === "IN_PROGRESS",
    );

    expect(task).toBeDefined();

    const response = await request(app)
      .patch(`/api/tasks/${task.id}/status`)
      .set("Authorization", `Bearer ${teamMemberToken}`)
      .send({
        status: "COMPLETED",
      });

    expect(response.status).toBe(400);
  });

  it("allows a team member to mark their own task as waiting for client", async () => {
    const managerToken = await login(managerCredentials);
    const teamMemberToken = await login(teamMemberCredentials);

    const usersResponse = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${managerToken}`);

    expect(usersResponse.status).toBe(200);

    const teamMember = usersResponse.body.users.find(
      (user: { email: string; role: string }) =>
        user.email === teamMemberCredentials.email &&
        user.role === "TEAM_MEMBER",
    );

    expect(teamMember).toBeDefined();

    const tasksResponse = await request(app)
      .get("/api/tasks?page=1&pageSize=100")
      .set("Authorization", `Bearer ${managerToken}`);

    expect(tasksResponse.status).toBe(200);

    const task = tasksResponse.body.tasks.find(
      (task: { assignedToId?: string; status: string }) =>
        task.assignedToId === teamMember.id && task.status === "IN_PROGRESS",
    );

    expect(task).toBeDefined();

    const response = await request(app)
      .patch(`/api/tasks/${task.id}/status`)
      .set("Authorization", `Bearer ${teamMemberToken}`)
      .send({
        status: "WAITING_FOR_CLIENT",
      });

    expect(response.status).toBe(200);
    expect(response.body.task.status).toBe("WAITING_FOR_CLIENT");
  });

  it("allows a team member to resume a task from waiting for client", async () => {
    const managerToken = await login(managerCredentials);
    const teamMemberToken = await login(teamMemberCredentials);

    const usersResponse = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${managerToken}`);

    expect(usersResponse.status).toBe(200);

    const teamMember = usersResponse.body.users.find(
      (user: { email: string; role: string }) =>
        user.email === teamMemberCredentials.email &&
        user.role === "TEAM_MEMBER",
    );

    expect(teamMember).toBeDefined();

    const tasksResponse = await request(app)
      .get("/api/tasks?page=1&pageSize=100")
      .set("Authorization", `Bearer ${managerToken}`);

    expect(tasksResponse.status).toBe(200);

    const task = tasksResponse.body.tasks.find(
      (task: { assignedToId?: string; status: string }) =>
        task.assignedToId === teamMember.id &&
        task.status === "WAITING_FOR_CLIENT",
    );

    expect(task).toBeDefined();

    const response = await request(app)
      .patch(`/api/tasks/${task.id}/status`)
      .set("Authorization", `Bearer ${teamMemberToken}`)
      .send({
        status: "IN_PROGRESS",
      });

    expect(response.status).toBe(200);
    expect(response.body.task.status).toBe("IN_PROGRESS");
  });

  it("allows a team member to submit their own task for review", async () => {
    const managerToken = await login(managerCredentials);
    const teamMemberToken = await login(teamMemberCredentials);

    const usersResponse = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${managerToken}`);

    expect(usersResponse.status).toBe(200);

    const teamMember = usersResponse.body.users.find(
      (user: { email: string; role: string }) =>
        user.email === teamMemberCredentials.email &&
        user.role === "TEAM_MEMBER",
    );

    expect(teamMember).toBeDefined();

    const tasksResponse = await request(app)
      .get("/api/tasks?page=1&pageSize=100")
      .set("Authorization", `Bearer ${managerToken}`);

    expect(tasksResponse.status).toBe(200);

    const task = tasksResponse.body.tasks.find(
      (task: { assignedToId?: string; status: string }) =>
        task.assignedToId === teamMember.id && task.status === "IN_PROGRESS",
    );

    expect(task).toBeDefined();

    const response = await request(app)
      .patch(`/api/tasks/${task.id}/status`)
      .set("Authorization", `Bearer ${teamMemberToken}`)
      .send({
        status: "READY_FOR_REVIEW",
      });

    expect(response.status).toBe(200);
    expect(response.body.task.status).toBe("READY_FOR_REVIEW");
  });

  it("allows a manager to approve a task ready for review", async () => {
    const managerToken = await login(managerCredentials);
    const teamMemberToken = await login(teamMemberCredentials);

    const usersResponse = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${managerToken}`);

    expect(usersResponse.status).toBe(200);

    const teamMember = usersResponse.body.users.find(
      (user: { email: string; role: string }) =>
        user.email === teamMemberCredentials.email &&
        user.role === "TEAM_MEMBER",
    );

    expect(teamMember).toBeDefined();

    const tasksResponse = await request(app)
      .get("/api/tasks?page=1&pageSize=100")
      .set("Authorization", `Bearer ${managerToken}`);

    expect(tasksResponse.status).toBe(200);

    const task = tasksResponse.body.tasks.find(
      (task: { assignedToId?: string; status: string }) =>
        task.assignedToId === teamMember.id &&
        task.status === "READY_FOR_REVIEW",
    );

    expect(task).toBeDefined();

    const response = await request(app)
      .post(`/api/tasks/${task.id}/review`)
      .set("Authorization", `Bearer ${managerToken}`)
      .send({
        decision: "APPROVE",
      });

    expect(response.status).toBe(200);
    expect(response.body.task.status).toBe("COMPLETED");
    expect(response.body.task.reviewerId).toBeDefined();
  });

  it("allows a manager to request changes on a task ready for review", async () => {
    const managerToken = await login(managerCredentials);
    const teamMemberToken = await login(teamMemberCredentials);

    const usersResponse = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${managerToken}`);

    expect(usersResponse.status).toBe(200);

    const teamMember = usersResponse.body.users.find(
      (user: { email: string; role: string }) =>
        user.email === teamMemberCredentials.email &&
        user.role === "TEAM_MEMBER",
    );

    expect(teamMember).toBeDefined();

    const tasksResponse = await request(app)
      .get("/api/tasks")
      .set("Authorization", `Bearer ${managerToken}`);

    expect(tasksResponse.status).toBe(200);

    const task = await createTestTask("READY_FOR_REVIEW", teamMember.id);

    expect(task).toBeDefined();

    const response = await request(app)
      .post(`/api/tasks/${task.id}/review`)
      .set("Authorization", `Bearer ${managerToken}`)
      .send({
        decision: "REQUEST_CHANGES",
      });

    expect(response.status).toBe(200);
    expect(response.body.task.status).toBe("CHANGES_REQUESTED");
    expect(response.body.task.reviewerId).toBeDefined();
  });

  it("allows a team member to resume a task after changes are requested", async () => {
    const managerToken = await login(managerCredentials);
    const teamMemberToken = await login(teamMemberCredentials);

    const usersResponse = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${managerToken}`);

    expect(usersResponse.status).toBe(200);

    const teamMember = usersResponse.body.users.find(
      (user: { email: string; role: string }) =>
        user.email === teamMemberCredentials.email &&
        user.role === "TEAM_MEMBER",
    );

    expect(teamMember).toBeDefined();

    const tasksResponse = await request(app)
      .get("/api/tasks?page=1&pageSize=100")
      .set("Authorization", `Bearer ${managerToken}`);

    expect(tasksResponse.status).toBe(200);

    const task = tasksResponse.body.tasks.find(
      (task: { assignedToId?: string; status: string }) =>
        task.assignedToId === teamMember.id &&
        task.status === "CHANGES_REQUESTED",
    );

    expect(task).toBeDefined();

    const response = await request(app)
      .patch(`/api/tasks/${task.id}/status`)
      .set("Authorization", `Bearer ${teamMemberToken}`)
      .send({
        status: "IN_PROGRESS",
      });

    expect(response.status).toBe(200);
    expect(response.body.task.status).toBe("IN_PROGRESS");
  });

  it("prevents a team member from approving their own task", async () => {
    const managerToken = await login(managerCredentials);
    const teamMemberToken = await login(teamMemberCredentials);

    const usersResponse = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${managerToken}`);

    expect(usersResponse.status).toBe(200);

    const teamMember = usersResponse.body.users.find(
      (user: { email: string; role: string }) =>
        user.email === teamMemberCredentials.email &&
        user.role === "TEAM_MEMBER",
    );

    expect(teamMember).toBeDefined();

    const tasksResponse = await request(app)
      .get("/api/tasks")
      .set("Authorization", `Bearer ${managerToken}`);

    expect(tasksResponse.status).toBe(200);

    const task = await createTestTask("READY_FOR_REVIEW", teamMember.id);

    expect(task).toBeDefined();

    const response = await request(app)
      .post(`/api/tasks/${task.id}/review`)
      .set("Authorization", `Bearer ${teamMemberToken}`)
      .send({
        decision: "APPROVE",
      });

    expect(response.status).toBe(403);
  });
});

describe("Task pagination", () => {
  it("returns paginated tasks with pagination metadata", async () => {
    const managerToken = await login(managerCredentials);

    const response = await request(app)
      .get("/api/tasks?page=1&pageSize=5")
      .set("Authorization", `Bearer ${managerToken}`);

    expect(response.status).toBe(200);

    expect(response.body.tasks).toBeInstanceOf(Array);
    expect(response.body.tasks.length).toBeLessThanOrEqual(5);

    expect(response.body.pagination).toEqual({
      page: 1,
      pageSize: 5,
      total: expect.any(Number),
      totalPages: expect.any(Number),
    });

    expect(response.body.pagination.total).toBeGreaterThan(0);
  });
});
