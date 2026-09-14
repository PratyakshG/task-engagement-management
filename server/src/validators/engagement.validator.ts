import { z } from "zod";

export const createEngagementSchema = z.object({
  clientId: z.uuid(),
  serviceTypeId: z.uuid(),
  period: z.string().trim().min(1).max(20).nullable().optional(),
  startDate: z.iso.datetime().optional(),
  dueDate: z.iso.datetime().optional(),
});

export const updateEngagementSchema = z
  .object({
    status: z.enum(["ACTIVE", "COMPLETED", "CANCELLED"]).optional(),
    startDate: z.iso.datetime().optional(),
    dueDate: z.iso.datetime().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided.",
  });

export const engagementIdSchema = z.uuid();

export type CreateEngagementInput = z.infer<typeof createEngagementSchema>;

export type UpdateEngagementInput = z.infer<typeof updateEngagementSchema>;
