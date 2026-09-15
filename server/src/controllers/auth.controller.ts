import type { Request, Response } from "express";

import { getCurrentUser, loginUser } from "../services/auth.service.js";
import { loginSchema } from "../validators/auth.validator.js";

export async function login(req: Request, res: Response) {
  const validationResult = loginSchema.safeParse(req.body);

  if (!validationResult.success) {
    return res.status(400).json({
      error: "Invalid request body.",
      details: validationResult.error.flatten().fieldErrors,
    });
  }

  try {
    const loginResult = await loginUser(validationResult.data);

    return res.status(200).json(loginResult);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Invalid email or password."
    ) {
      return res.status(401).json({
        error: error.message,
      });
    }

    throw error;
  }
}

export async function currentUser(
  req: Request,
  res: Response,
): Promise<Response> {
  if (!req.user) {
    return res.status(401).json({
      error: "Authentication required.",
    });
  }

  try {
    const user = await getCurrentUser(req.user.id);

    return res.json({
      user,
    });
  } catch {
    return res.status(404).json({
      error: "User not found.",
    });
  }
}
