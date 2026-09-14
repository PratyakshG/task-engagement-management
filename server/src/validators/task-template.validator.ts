import { z } from "zod";

export const createTaskTemplateSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  sequence: z.number().int().positive(),
});

export const updateTaskTemplateSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    sequence: z.number().int().positive().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided.",
  });

export const taskTemplateIdSchema = z.uuid();

export type CreateTaskTemplateInput = z.infer<typeof createTaskTemplateSchema>;

export type UpdateTaskTemplateInput = z.infer<typeof updateTaskTemplateSchema>;
