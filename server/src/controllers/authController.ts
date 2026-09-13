import { z } from "zod";
import { Request, Response } from "express";

const registerSchema = z
  .object({
    email: z.email("A valid email is required."),
    name: z
      .string()
      .trim()
      .min(1, "Name cannot be empty.")
      .max(100, "Name must be at most 100 characters.")
      .optional(),
  })
  .strict();

const loginSchema = z
  .object({
    email: z.email("A valid email is required."),
  })
  .strict();

function validateBody<T extends z.ZodType>(schema: T, body: unknown) {
  const result = schema.safeParse(body);

  if (result.success) return { data: result.data } as const;

  return {
    error: {
      error: "Invalid request body.",
      details: result.error.flatten().fieldErrors,
    },
  } as const;
}

// Register Admin Endpoint
export const registerUser = async (req: Request, res: Response) => {
  const result = validateBody(registerSchema, req.body);

  if ("error" in result) {
    return res.status(400).json(result.error);
  }

  const { email, name } = result.data;

  // Placeholder only: persist users and hash passwords here when real auth is added.
  return res.status(201).json({
    message: "Dummy registration successful.",
    user: { email, name: name ?? null },
  });
};

// User Login Endpoint
export const login = async (req: Request, res: Response) => {
  try {
    const result = validateBody(loginSchema, req.body);

    if ("error" in result) {
      return res.status(400).json(result.error);
    }

    const { email } = result.data;

    return res.json({
      message: "user login successful.",
      token: "demo-token-replace-with-jwt",
      user: { id: "demo-user-id", email },
    });
  } catch (error) {
    console.error(error);
  }
};
