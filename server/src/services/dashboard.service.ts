import { Role, TaskStatus } from "../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";

export async function getDashboard(userId: string, role: Role) {
  const taskScope = role === Role.TEAM_MEMBER ? { assignedToId: userId } : {};

  const now = new Date();

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  const openTaskFilter = {
    ...taskScope,
    status: {
      not: TaskStatus.COMPLETED,
    },
  };

  const [
    openTasks,
    overdueTasks,
    dueToday,
    waitingForClient,
    waitingForReview,
  ] = await Promise.all([
    prisma.task.count({
      where: openTaskFilter,
    }),

    prisma.task.count({
      where: {
        ...taskScope,
        status: {
          not: TaskStatus.COMPLETED,
        },
        dueDate: {
          lt: now,
        },
      },
    }),

    prisma.task.count({
      where: {
        ...taskScope,
        status: {
          not: TaskStatus.COMPLETED,
        },
        dueDate: {
          gte: startOfToday,
          lt: startOfTomorrow,
        },
      },
    }),

    prisma.task.count({
      where: {
        ...taskScope,
        status: TaskStatus.WAITING_FOR_CLIENT,
      },
    }),

    prisma.task.count({
      where: {
        ...taskScope,
        status: TaskStatus.READY_FOR_REVIEW,
      },
    }),
  ]);

  return {
    openTasks,
    overdueTasks,
    dueToday,
    waitingForClient,
    waitingForReview,
  };
}
