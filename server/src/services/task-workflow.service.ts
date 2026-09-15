import { AuditAction, Role, TaskStatus } from "../generated/prisma/client.js";

import { prisma } from "../lib/prisma.js";

import type {
  ChangeTaskStatusInput,
  ReviewTaskInput,
} from "../validators/task-workflow.validator.js";

const allowedTransitions: Record<TaskStatus, TaskStatus[]> = {
  [TaskStatus.NOT_STARTED]: [TaskStatus.IN_PROGRESS],

  [TaskStatus.IN_PROGRESS]: [
    TaskStatus.WAITING_FOR_CLIENT,
    TaskStatus.READY_FOR_REVIEW,
  ],

  [TaskStatus.WAITING_FOR_CLIENT]: [TaskStatus.IN_PROGRESS],

  [TaskStatus.READY_FOR_REVIEW]: [
    TaskStatus.COMPLETED,
    TaskStatus.CHANGES_REQUESTED,
  ],

  [TaskStatus.CHANGES_REQUESTED]: [TaskStatus.IN_PROGRESS],

  [TaskStatus.COMPLETED]: [],
};

export async function changeTaskStatus(
  taskId: string,
  actorId: string,
  actorRole: Role,
  input: ChangeTaskStatusInput,
) {
  const task = await prisma.task.findUnique({
    where: {
      id: taskId,
    },
    select: {
      id: true,
      status: true,
      assignedToId: true,
      reviewerId: true,
    },
  });

  if (!task) {
    throw new Error("Task not found.");
  }

  // Only Team Members may update assigned tasks.
  if (actorRole !== Role.TEAM_MEMBER) {
    throw new Error(
      "Managers and Admins are not allowed to change task status.",
    );
  }

  // Team Members can update only their assigned tasks.
  if (task.assignedToId !== actorId) {
    throw new Error("You do not have permission to update this task.");
  }

  //  Managers/Admins should not use this operation to approve or request changes. Review decisions have their own endpoint.
  if (
    input.status === TaskStatus.COMPLETED ||
    input.status === TaskStatus.CHANGES_REQUESTED
  ) {
    throw new Error("Use the review endpoint for review decisions.");
  }

  const allowed = allowedTransitions[task.status].includes(input.status);

  if (!allowed) {
    throw new Error(
      `Invalid task status transition from ${task.status} to ${input.status}.`,
    );
  }

  const updatedTask = await prisma.$transaction(async (tx) => {
    const updated = await tx.task.update({
      where: {
        id: taskId,
      },
      data: {
        status: input.status,
      },
    });

    await tx.auditLog.create({
      data: {
        taskId,
        userId: actorId,
        action: AuditAction.STATUS_CHANGE,
        fromStatus: task.status,
        toStatus: input.status,
        notes: input.notes,
      },
    });

    return updated;
  });

  return updatedTask;
}

export async function reviewTask(
  taskId: string,
  actorId: string,
  actorRole: Role,
  input: ReviewTaskInput,
) {
  if (actorRole !== Role.MANAGER) {
    throw new Error("Only managers can review tasks.");
  }

  const task = await prisma.task.findUnique({
    where: {
      id: taskId,
    },
    select: {
      id: true,
      status: true,
      assignedToId: true,
      reviewerId: true,
    },
  });

  if (!task) {
    throw new Error("Task not found.");
  }

  if (task.status !== TaskStatus.READY_FOR_REVIEW) {
    throw new Error("Only tasks ready for review can be reviewed.");
  }

  if (task.assignedToId === actorId) {
    throw new Error("You cannot review your own work.");
  }

  const nextStatus =
    input.decision === "APPROVE"
      ? TaskStatus.COMPLETED
      : TaskStatus.CHANGES_REQUESTED;

  const action =
    input.decision === "APPROVE"
      ? AuditAction.APPROVED
      : AuditAction.CHANGES_REQUESTED;

  return prisma.$transaction(async (tx) => {
    const updatedTask = await tx.task.update({
      where: {
        id: taskId,
      },
      data: {
        status: nextStatus,
        reviewerId: actorId,
      },
    });

    await tx.auditLog.create({
      data: {
        taskId,
        userId: actorId,
        action,
        fromStatus: TaskStatus.READY_FOR_REVIEW,
        toStatus: nextStatus,
        notes: input.notes,
      },
    });

    return updatedTask;
  });
}
