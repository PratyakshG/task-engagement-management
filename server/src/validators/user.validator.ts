import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.email().trim(),
  password: z.string().min(8),
  role: z.enum(["ADMIN", "MANAGER", "TEAM_MEMBER"]),
});

export const updateUserSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    email: z.email().trim().optional(),
    role: z.enum(["ADMIN", "MANAGER", "TEAM_MEMBER"]).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided.",
  });

export const userIdSchema = z.uuid();

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
