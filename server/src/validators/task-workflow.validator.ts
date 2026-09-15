import { z } from "zod";

export const taskStatusSchema = z.enum([
  "NOT_STARTED",
  "IN_PROGRESS",
  "WAITING_FOR_CLIENT",
  "READY_FOR_REVIEW",
  "CHANGES_REQUESTED",
  "COMPLETED",
]);

export const changeTaskStatusSchema = z.object({
  status: taskStatusSchema,
  notes: z.string().trim().max(2000).optional(),
});

export const reviewTaskSchema = z.object({
  decision: z.enum(["APPROVE", "REQUEST_CHANGES"]),
  notes: z.string().trim().max(2000).optional(),
});

export type ChangeTaskStatusInput = z.infer<typeof changeTaskStatusSchema>;

export type ReviewTaskInput = z.infer<typeof reviewTaskSchema>;
