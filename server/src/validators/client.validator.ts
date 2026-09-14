import { z } from "zod";

export const createClientSchema = z.object({
  name: z.string().trim().min(1).max(150),
  contactEmail: z.email().optional(),
  contactPhone: z.string().trim().min(1).max(30).optional(),
});

export const updateClientSchema = z
  .object({
    name: z.string().trim().min(1).max(150).optional(),
    contactEmail: z.email().optional(),
    contactPhone: z.string().trim().min(1).max(30).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided.",
  });

export const clientIdSchema = z.uuid();

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
