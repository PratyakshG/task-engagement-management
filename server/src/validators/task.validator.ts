import { z } from "zod";

export const taskIdSchema = z.uuid();

export const listTasksQuerySchema = z.object({
  status: z
    .enum([
      "NOT_STARTED",
      "IN_PROGRESS",
      "WAITING_FOR_CLIENT",
      "READY_FOR_REVIEW",
      "CHANGES_REQUESTED",
      "COMPLETED",
    ])
    .optional(),

  assignedToId: z.uuid().optional(),

  engagementId: z.uuid().optional(),

  overdue: z.enum(["true", "false"]).optional(),
});

export const assignTaskSchema = z.object({
  assignedToId: z.uuid().nullable(),
});

export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;

export type AssignTaskInput = z.infer<typeof assignTaskSchema>;
