import { prisma } from "../lib/prisma.js";
import type {
  AssignTaskInput,
  ListTasksQuery,
} from "../validators/task.validator.js";

const taskListSelect = {
  id: true,
  title: true,
  description: true,
  status: true,
  assignedToId: true,
  reviewerId: true,
  dueDate: true,
  createdAt: true,
  updatedAt: true,

  engagement: {
    select: {
      id: true,
      period: true,

      client: {
        select: {
          id: true,
          name: true,
        },
      },

      serviceType: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },

  assignedTo: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} as const;

export async function listTasks(
  userId: string,
  role: "ADMIN" | "MANAGER" | "TEAM_MEMBER",
  query: ListTasksQuery,
) {
  const where = {
    ...(role === "TEAM_MEMBER" && {
      assignedToId: userId,
    }),

    ...(role !== "TEAM_MEMBER" &&
      query.assignedToId && {
        assignedToId: query.assignedToId,
      }),

    ...(query.status && {
      status: query.status,
    }),

    ...(query.engagementId && {
      engagementId: query.engagementId,
    }),

    ...(query.overdue !== undefined && {
      dueDate:
        query.overdue === "true"
          ? {
              lt: new Date(),
            }
          : {
              gte: new Date(),
            },
    }),
  };

  const { page, pageSize } = query;

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      select: taskListSelect,
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),

    prisma.task.count({
      where,
    }),
  ]);

  return {
    tasks,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

export async function getTaskById(
  id: string,
  userId: string,
  role: "ADMIN" | "MANAGER" | "TEAM_MEMBER",
) {
  const task = await prisma.task.findUnique({
    where: {
      id,
    },
    include: {
      engagement: {
        include: {
          client: {
            select: {
              id: true,
              name: true,
              contactEmail: true,
            },
          },
          serviceType: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },

      assignedTo: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },

      reviewer: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },

      auditLogs: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!task) {
    throw new Error("Task not found.");
  }

  if (role === "TEAM_MEMBER" && task.assignedToId !== userId) {
    throw new Error("You do not have access to this task.");
  }

  return task;
}

export async function assignTask(
  taskId: string,
  input: AssignTaskInput,
  actorId: string,
) {
  const task = await prisma.task.findUnique({
    where: {
      id: taskId,
    },
    select: {
      id: true,
      assignedToId: true,
    },
  });

  if (!task) {
    throw new Error("Task not found.");
  }

  if (input.assignedToId) {
    const assignee = await prisma.user.findUnique({
      where: {
        id: input.assignedToId,
      },
      select: {
        id: true,
        role: true,
        isActive: true,
      },
    });

    if (!assignee) {
      throw new Error("Assignee not found.");
    }

    if (!assignee.isActive) {
      throw new Error("Assignee is inactive.");
    }

    if (assignee.role !== "TEAM_MEMBER") {
      throw new Error("Tasks can only be assigned to team members.");
    }
  }

  const updatedTask = await prisma.task.update({
    where: {
      id: taskId,
    },
    data: {
      assignedToId: input.assignedToId,
    },
    include: {
      assignedTo: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      taskId,
      userId: actorId,
      action: task.assignedToId ? "TASK_REASSIGNED" : "TASK_ASSIGNED",
      notes: input.assignedToId
        ? `Task assigned to ${input.assignedToId}.`
        : "Task unassigned.",
    },
  });

  return updatedTask;
}
