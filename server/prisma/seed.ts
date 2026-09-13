import bcrypt from "bcrypt";

import {
  AuditAction,
  EngagementStatus,
  RecurrenceInterval,
  Role,
  TaskStatus,
} from "../src/generated/prisma/client.js";
import { prisma } from "../src/lib/prisma.ts";

const PASSWORD = "Password123!";

async function main() {
  console.log("Starting database seed...");

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  await prisma.$transaction(
    async (tx) => {
      // --------------------------------------------------
      // DEVELOPMENT RESET
      // --------------------------------------------------
      // Seed data is disposable. Clear dependent records first.
      await tx.auditLog.deleteMany();
      await tx.task.deleteMany();
      await tx.engagement.deleteMany();
      await tx.taskTemplate.deleteMany();
      await tx.serviceType.deleteMany();
      await tx.client.deleteMany();
      await tx.user.deleteMany();

      // --------------------------------------------------
      // USERS
      // --------------------------------------------------

      const [admin, manager1, manager2, member1, member2, member3, member4] =
        await Promise.all([
          tx.user.create({
            data: {
              name: "Admin User",
              email: "admin@example.com",
              passwordHash,
              role: Role.ADMIN,
            },
          }),

          tx.user.create({
            data: {
              name: "Rahul Sharma",
              email: "rahul.manager@example.com",
              passwordHash,
              role: Role.MANAGER,
            },
          }),

          tx.user.create({
            data: {
              name: "Priya Mehta",
              email: "priya.manager@example.com",
              passwordHash,
              role: Role.MANAGER,
            },
          }),

          tx.user.create({
            data: {
              name: "Amit Kumar",
              email: "amit@example.com",
              passwordHash,
              role: Role.TEAM_MEMBER,
            },
          }),

          tx.user.create({
            data: {
              name: "Neha Singh",
              email: "neha@example.com",
              passwordHash,
              role: Role.TEAM_MEMBER,
            },
          }),

          tx.user.create({
            data: {
              name: "Arjun Verma",
              email: "arjun@example.com",
              passwordHash,
              role: Role.TEAM_MEMBER,
            },
          }),

          tx.user.create({
            data: {
              name: "Kavya Patel",
              email: "kavya@example.com",
              passwordHash,
              role: Role.TEAM_MEMBER,
            },
          }),
        ]);

      // --------------------------------------------------
      // CLIENTS
      // --------------------------------------------------

      const clients = await Promise.all([
        tx.client.create({
          data: {
            name: "Acme Private Limited",
            contactEmail: "accounts@acme.example",
            contactPhone: "+91 9876543210",
          },
        }),

        tx.client.create({
          data: {
            name: "BlueSky Technologies",
            contactEmail: "finance@bluesky.example",
            contactPhone: "+91 9876543211",
          },
        }),

        tx.client.create({
          data: {
            name: "GreenLeaf Foods",
            contactEmail: "accounts@greenleaf.example",
            contactPhone: "+91 9876543212",
          },
        }),

        tx.client.create({
          data: {
            name: "Nova Retail",
            contactEmail: "finance@novaretail.example",
            contactPhone: "+91 9876543213",
          },
        }),

        tx.client.create({
          data: {
            name: "Vertex Consulting",
            contactEmail: "accounts@vertex.example",
            contactPhone: "+91 9876543214",
          },
        }),
      ]);

      // --------------------------------------------------
      // SERVICE TYPES
      // --------------------------------------------------

      const [monthlyGST, quarterlyTDS, gstRegistration] = await Promise.all([
        tx.serviceType.create({
          data: {
            name: "Monthly GST Compliance",
            description: "Monthly GST reconciliation and return filing.",
            isRecurring: true,
            recurrenceInterval: RecurrenceInterval.MONTHLY,
          },
        }),

        tx.serviceType.create({
          data: {
            name: "Quarterly TDS Compliance",
            description: "Quarterly TDS reconciliation and return filing.",
            isRecurring: true,
            recurrenceInterval: RecurrenceInterval.QUARTERLY,
          },
        }),

        tx.serviceType.create({
          data: {
            name: "GST Registration",
            description: "One-time GST registration service.",
            isRecurring: false,
            recurrenceInterval: null,
          },
        }),
      ]);

      // --------------------------------------------------
      // TASK TEMPLATES
      // --------------------------------------------------

      await tx.taskTemplate.createMany({
        data: [
          {
            serviceTypeId: monthlyGST.id,
            title: "Collect sales and purchase data",
            description:
              "Collect required sales and purchase records from the client.",
            sequence: 1,
          },
          {
            serviceTypeId: monthlyGST.id,
            title: "Reconcile GST records",
            description:
              "Reconcile books with GST records and identify discrepancies.",
            sequence: 2,
          },
          {
            serviceTypeId: monthlyGST.id,
            title: "Prepare GST return",
            description: "Prepare the monthly GST return for review.",
            sequence: 3,
          },
          {
            serviceTypeId: monthlyGST.id,
            title: "Review and file GST return",
            description: "Review the prepared return and complete filing.",
            sequence: 4,
          },

          {
            serviceTypeId: quarterlyTDS.id,
            title: "Collect TDS data",
            description: "Collect quarterly TDS deduction records.",
            sequence: 1,
          },
          {
            serviceTypeId: quarterlyTDS.id,
            title: "Reconcile TDS deductions",
            description:
              "Reconcile TDS records with books and supporting documents.",
            sequence: 2,
          },
          {
            serviceTypeId: quarterlyTDS.id,
            title: "Prepare TDS return",
            description: "Prepare the quarterly TDS return.",
            sequence: 3,
          },
          {
            serviceTypeId: quarterlyTDS.id,
            title: "Review and file TDS return",
            description: "Review and complete TDS filing.",
            sequence: 4,
          },

          {
            serviceTypeId: gstRegistration.id,
            title: "Collect client documents",
            description: "Collect documents required for GST registration.",
            sequence: 1,
          },
          {
            serviceTypeId: gstRegistration.id,
            title: "Verify documents",
            description:
              "Verify completeness and correctness of submitted documents.",
            sequence: 2,
          },
          {
            serviceTypeId: gstRegistration.id,
            title: "Prepare registration application",
            description: "Prepare the GST registration application.",
            sequence: 3,
          },
          {
            serviceTypeId: gstRegistration.id,
            title: "Submit registration application",
            description: "Submit the completed registration application.",
            sequence: 4,
          },
        ],
      });

      // --------------------------------------------------
      // LOAD TEMPLATES
      // --------------------------------------------------

      const templates = await tx.taskTemplate.findMany({
        orderBy: {
          sequence: "asc",
        },
      });

      const templatesByService = new Map<string, typeof templates>();

      for (const template of templates) {
        const existing = templatesByService.get(template.serviceTypeId) ?? [];
        existing.push(template);
        templatesByService.set(template.serviceTypeId, existing);
      }

      // --------------------------------------------------
      // HELPER: CREATE ENGAGEMENT + GENERATE TASKS
      // --------------------------------------------------

      async function createEngagementWithTasks(input: {
        clientId: string;
        serviceTypeId: string;
        period: string | null;
        startDate: Date;
        dueDate: Date;
        createdById: string;
        taskStatuses: TaskStatus[];
        assignments: string[];
      }) {
        const engagement = await tx.engagement.create({
          data: {
            clientId: input.clientId,
            serviceTypeId: input.serviceTypeId,
            period: input.period,
            status: EngagementStatus.ACTIVE,
            startDate: input.startDate,
            dueDate: input.dueDate,
            createdById: input.createdById,
          },
        });

        const serviceTemplates =
          templatesByService.get(input.serviceTypeId) ?? [];

        if (serviceTemplates.length === 0) {
          throw new Error(
            `No task templates found for service ${input.serviceTypeId}`,
          );
        }

        if (input.taskStatuses.length !== serviceTemplates.length) {
          throw new Error(
            `Task status count does not match template count for engagement ${engagement.id}`,
          );
        }

        if (input.assignments.length !== serviceTemplates.length) {
          throw new Error(
            `Assignment count does not match template count for engagement ${engagement.id}`,
          );
        }

        await tx.task.createMany({
          data: serviceTemplates.map((template, index) => ({
            engagementId: engagement.id,
            templateId: template.id,
            title: template.title,
            description: template.description,
            status: input.taskStatuses[index],
            assignedToId: input.assignments[index],
            dueDate: input.dueDate,
          })),
        });

        await tx.auditLog.create({
          data: {
            engagementId: engagement.id,
            userId: input.createdById,
            action: AuditAction.ENGAGEMENT_CREATED,
            notes: `Engagement created for ${input.period ?? "one-time service"}.`,
          },
        });

        return engagement;
      }

      // --------------------------------------------------
      // ENGAGEMENTS + GENERATED TASKS
      // --------------------------------------------------

      await createEngagementWithTasks({
        clientId: clients[0].id,
        serviceTypeId: monthlyGST.id,
        period: "2026-09",
        startDate: new Date("2026-09-01"),
        dueDate: new Date("2026-09-20"),
        createdById: manager1.id,
        taskStatuses: [
          TaskStatus.COMPLETED,
          TaskStatus.IN_PROGRESS,
          TaskStatus.READY_FOR_REVIEW,
          TaskStatus.NOT_STARTED,
        ],
        assignments: [member1.id, member2.id, member3.id, member4.id],
      });

      await createEngagementWithTasks({
        clientId: clients[1].id,
        serviceTypeId: monthlyGST.id,
        period: "2026-09",
        startDate: new Date("2026-09-01"),
        dueDate: new Date("2026-09-20"),
        createdById: manager1.id,
        taskStatuses: [
          TaskStatus.WAITING_FOR_CLIENT,
          TaskStatus.IN_PROGRESS,
          TaskStatus.NOT_STARTED,
          TaskStatus.NOT_STARTED,
        ],
        assignments: [member1.id, member2.id, member3.id, member4.id],
      });

      await createEngagementWithTasks({
        clientId: clients[2].id,
        serviceTypeId: quarterlyTDS.id,
        period: "2026-Q3",
        startDate: new Date("2026-07-01"),
        dueDate: new Date("2026-10-15"),
        createdById: manager2.id,
        taskStatuses: [
          TaskStatus.COMPLETED,
          TaskStatus.COMPLETED,
          TaskStatus.CHANGES_REQUESTED,
          TaskStatus.READY_FOR_REVIEW,
        ],
        assignments: [member1.id, member2.id, member3.id, member4.id],
      });

      await createEngagementWithTasks({
        clientId: clients[3].id,
        serviceTypeId: gstRegistration.id,
        period: null,
        startDate: new Date("2026-09-05"),
        dueDate: new Date("2026-09-25"),
        createdById: manager2.id,
        taskStatuses: [
          TaskStatus.COMPLETED,
          TaskStatus.IN_PROGRESS,
          TaskStatus.NOT_STARTED,
          TaskStatus.NOT_STARTED,
        ],
        assignments: [member1.id, member2.id, member3.id, member4.id],
      });

      await createEngagementWithTasks({
        clientId: clients[4].id,
        serviceTypeId: monthlyGST.id,
        period: "2026-09",
        startDate: new Date("2026-09-01"),
        dueDate: new Date("2026-09-18"),
        createdById: manager2.id,
        taskStatuses: [
          TaskStatus.COMPLETED,
          TaskStatus.IN_PROGRESS,
          TaskStatus.READY_FOR_REVIEW,
          TaskStatus.NOT_STARTED,
        ],
        assignments: [member1.id, member2.id, member3.id, member4.id],
      });

      // --------------------------------------------------
      // ADDITIONAL AUDIT HISTORY
      // --------------------------------------------------

      const tasks = await tx.task.findMany({
        orderBy: {
          createdAt: "asc",
        },
      });

      const inProgressTask = tasks.find(
        (task) => task.status === TaskStatus.IN_PROGRESS,
      );

      const reviewTask = tasks.find(
        (task) => task.status === TaskStatus.READY_FOR_REVIEW,
      );

      const changesRequestedTask = tasks.find(
        (task) => task.status === TaskStatus.CHANGES_REQUESTED,
      );

      if (inProgressTask) {
        await tx.auditLog.create({
          data: {
            taskId: inProgressTask.id,
            userId: inProgressTask.assignedToId ?? manager1.id,
            action: AuditAction.STATUS_CHANGE,
            fromStatus: TaskStatus.NOT_STARTED,
            toStatus: TaskStatus.IN_PROGRESS,
            notes: "Team member started the task.",
          },
        });
      }

      if (reviewTask) {
        await tx.auditLog.create({
          data: {
            taskId: reviewTask.id,
            userId: reviewTask.assignedToId ?? manager1.id,
            action: AuditAction.STATUS_CHANGE,
            fromStatus: TaskStatus.IN_PROGRESS,
            toStatus: TaskStatus.READY_FOR_REVIEW,
            notes: "Task submitted for manager review.",
          },
        });
      }

      if (changesRequestedTask) {
        await tx.auditLog.create({
          data: {
            taskId: changesRequestedTask.id,
            userId: manager2.id,
            action: AuditAction.CHANGES_REQUESTED,
            fromStatus: TaskStatus.READY_FOR_REVIEW,
            toStatus: TaskStatus.CHANGES_REQUESTED,
            notes: "Manager requested corrections.",
          },
        });
      }

      // Keep admin referenced so the seeded role is explicit.
      void admin;
    },
    {
      timeout: 30000,
    },
  );

  console.log("Database seed completed successfully.");
  console.log("");
  console.log("Demo credentials:");
  console.log("  Admin:       admin@example.com");
  console.log("  Manager:     rahul.manager@example.com");
  console.log("  Manager:     priya.manager@example.com");
  console.log("  Team Member: amit@example.com");
  console.log("  Password:    Password123!");
}

main()
  .catch((error) => {
    console.error("Database seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
