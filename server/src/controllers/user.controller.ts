import type { Request, Response } from "express";

import {
  createUser,
  getUserById,
  listUsers,
  updateUser,
} from "../services/user.service.js";
import {
  createUserSchema,
  updateUserSchema,
  userIdSchema,
} from "../validators/user.validator.js";

export async function createUserController(req: Request, res: Response) {
  const validationResult = createUserSchema.safeParse(req.body);

  if (!validationResult.success) {
    return res.status(400).json({
      error: "Invalid request body.",
      details: validationResult.error.flatten().fieldErrors,
    });
  }

  try {
    const user = await createUser(validationResult.data);

    return res.status(201).json({ user });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "A user with this email already exists."
    ) {
      return res.status(409).json({
        error: error.message,
      });
    }

    throw error;
  }
}

export async function listUsersController(_req: Request, res: Response) {
  const users = await listUsers();

  return res.status(200).json({
    users,
  });
}

export async function getUserController(req: Request, res: Response) {
  const idResult = userIdSchema.safeParse(req.params.id);

  if (!idResult.success) {
    return res.status(400).json({
      error: "Invalid user ID.",
    });
  }

  try {
    const user = await getUserById(idResult.data);

    return res.status(200).json({
      user,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "User not found.") {
      return res.status(404).json({
        error: error.message,
      });
    }

    throw error;
  }
}

export async function updateUserController(req: Request, res: Response) {
  const idResult = userIdSchema.safeParse(req.params.id);

  if (!idResult.success) {
    return res.status(400).json({
      error: "Invalid user ID.",
    });
  }

  const validationResult = updateUserSchema.safeParse(req.body);

  if (!validationResult.success) {
    return res.status(400).json({
      error: "Invalid request body.",
      details: validationResult.error.flatten().fieldErrors,
    });
  }

  try {
    const user = await updateUser(idResult.data, validationResult.data);

    return res.status(200).json({
      user,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "User not found.") {
      return res.status(404).json({
        error: error.message,
      });
    }

    if (
      error instanceof Error &&
      error.message === "A user with this email already exists."
    ) {
      return res.status(409).json({
        error: error.message,
      });
    }

    throw error;
  }
}
