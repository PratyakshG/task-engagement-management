import { prisma } from "../lib/prisma.js";
import type {
  CreateEngagementInput,
  UpdateEngagementInput,
} from "../validators/engagement.validator.js";

function validatePeriod(
  isRecurring: boolean,
  recurrenceInterval: "MONTHLY" | "QUARTERLY" | "YEARLY" | null,
  period: string | null | undefined,
) {
  if (!isRecurring) {
    if (period !== null && period !== undefined) {
      throw new Error("Period must be omitted for non-recurring services.");
    }

    return null;
  }

  if (!period) {
    throw new Error("Period is required for recurring services.");
  }

  if (recurrenceInterval === "MONTHLY") {
    if (!/^\d{4}-\d{2}$/.test(period)) {
      throw new Error("Monthly engagement period must use YYYY-MM format.");
    }

    return period;
  }

  if (recurrenceInterval === "QUARTERLY") {
    if (!/^\d{4}-Q[1-4]$/.test(period)) {
      throw new Error("Quarterly engagement period must use YYYY-QN format.");
    }

    return period;
  }

  if (recurrenceInterval === "YEARLY") {
    if (!/^\d{4}$/.test(period)) {
      throw new Error("Yearly engagement period must use YYYY format.");
    }

    return period;
  }

  throw new Error("Recurring service must have a recurrence interval.");
}

export async function createEngagement(
  input: CreateEngagementInput,
  createdById: string,
) {
  const startDate = input.startDate ? new Date(input.startDate) : new Date();

  const dueDate = input.dueDate ? new Date(input.dueDate) : null;

  if (dueDate && dueDate < startDate) {
    throw new Error("Due date cannot be earlier than the start date.");
  }

  return prisma.$transaction(
    async (tx) => {
      const [client, serviceType] = await Promise.all([
        tx.client.findUnique({
          where: {
            id: input.clientId,
          },
          select: {
            id: true,
            isActive: true,
          },
        }),
        tx.serviceType.findUnique({
          where: {
            id: input.serviceTypeId,
          },
          select: {
            id: true,
            isRecurring: true,
            recurrenceInterval: true,
            taskTemplates: {
              select: {
                id: true,
                title: true,
                description: true,
                sequence: true,
              },
              orderBy: {
                sequence: "asc",
              },
            },
          },
        }),
      ]);

      if (!client) {
        throw new Error("Client not found.");
      }

      if (!client.isActive) {
        throw new Error("Client is inactive.");
      }

      if (!serviceType) {
        throw new Error("Service type not found.");
      }

      const period = validatePeriod(
        serviceType.isRecurring,
        serviceType.recurrenceInterval,
        input.period,
      );

      const existingEngagement = await tx.engagement.findFirst({
        where: {
          clientId: input.clientId,
          serviceTypeId: input.serviceTypeId,
          ...(period === null
            ? {
                period: null,
              }
            : {
                period,
              }),
        },
        select: {
          id: true,
        },
      });

      if (existingEngagement) {
        throw new Error(
          "An engagement already exists for this client, service type, and period.",
        );
      }

      const engagement = await tx.engagement.create({
        data: {
          clientId: input.clientId,
          serviceTypeId: input.serviceTypeId,
          period,
          startDate,
          dueDate,
          createdById,
        },
      });

      if (serviceType.taskTemplates.length > 0) {
        await tx.task.createMany({
          data: serviceType.taskTemplates.map((template) => ({
            engagementId: engagement.id,
            templateId: template.id,
            title: template.title,
            description: template.description,
            dueDate,
          })),
        });
      }

      await tx.auditLog.create({
        data: {
          engagementId: engagement.id,
          userId: createdById,
          action: "ENGAGEMENT_CREATED",
          notes: `Created engagement with ${serviceType.taskTemplates.length} task(s).`,
        },
      });

      return tx.engagement.findUniqueOrThrow({
        where: {
          id: engagement.id,
        },
        include: {
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
              isRecurring: true,
              recurrenceInterval: true,
            },
          },
          tasks: {
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      });
    },
    {
      timeout: 10000,
    },
  );
}

export async function listEngagements() {
  return prisma.engagement.findMany({
    include: {
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
          isRecurring: true,
          recurrenceInterval: true,
        },
      },
      _count: {
        select: {
          tasks: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getEngagementById(id: string) {
  const engagement = await prisma.engagement.findUnique({
    where: {
      id,
    },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          contactEmail: true,
          contactPhone: true,
        },
      },
      serviceType: {
        select: {
          id: true,
          name: true,
          description: true,
          isRecurring: true,
          recurrenceInterval: true,
        },
      },
      tasks: {
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
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

  if (!engagement) {
    throw new Error("Engagement not found.");
  }

  return engagement;
}

export async function updateEngagement(
  id: string,
  input: UpdateEngagementInput,
) {
  const existingEngagement = await prisma.engagement.findUnique({
    where: {
      id,
    },
  });

  if (!existingEngagement) {
    throw new Error("Engagement not found.");
  }

  const startDate = input.startDate
    ? new Date(input.startDate)
    : existingEngagement.startDate;

  const dueDate =
    input.dueDate !== undefined
      ? input.dueDate
        ? new Date(input.dueDate)
        : null
      : existingEngagement.dueDate;

  if (dueDate && dueDate < startDate) {
    throw new Error("Due date cannot be earlier than the start date.");
  }

  return prisma.engagement.update({
    where: {
      id,
    },
    data: {
      ...(input.status !== undefined && {
        status: input.status,
      }),
      ...(input.startDate !== undefined && {
        startDate,
      }),
      ...(input.dueDate !== undefined && {
        dueDate,
      }),
    },
    include: {
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
  });
}
