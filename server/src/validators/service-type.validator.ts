import { z } from "zod";

export const createServiceTypeSchema = z
  .object({
    name: z.string().trim().min(1).max(150),
    description: z.string().trim().max(1000).optional(),
    isRecurring: z.boolean(),
    recurrenceInterval: z
      .enum(["MONTHLY", "QUARTERLY", "YEARLY"])
      .nullable()
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.isRecurring && !data.recurrenceInterval) {
      ctx.addIssue({
        code: "custom",
        path: ["recurrenceInterval"],
        message: "Recurrence interval is required for recurring services.",
      });
    }

    if (!data.isRecurring && data.recurrenceInterval) {
      ctx.addIssue({
        code: "custom",
        path: ["recurrenceInterval"],
        message:
          "Recurrence interval must be omitted for non-recurring services.",
      });
    }
  });

export const updateServiceTypeSchema = z
  .object({
    name: z.string().trim().min(1).max(150).optional(),
    description: z.string().trim().max(1000).nullable().optional(),
    isRecurring: z.boolean().optional(),
    recurrenceInterval: z
      .enum(["MONTHLY", "QUARTERLY", "YEARLY"])
      .nullable()
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided.",
  });

export const serviceTypeIdSchema = z.uuid();

export type CreateServiceTypeInput = z.infer<typeof createServiceTypeSchema>;

export type UpdateServiceTypeInput = z.infer<typeof updateServiceTypeSchema>;
