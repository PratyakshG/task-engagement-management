import { Router } from "express";

import {
  createUserController,
  getUserController,
  listUsersController,
  updateUserController,
} from "../controllers/user.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";
import { Role } from "../generated/prisma/client.js";

export const usersRouter = Router();

// Every route must go through auth check first
usersRouter.use(requireAuth);

// List all users
usersRouter.get(
  "/",
  requireRole(Role.ADMIN, Role.MANAGER),
  listUsersController,
);

// Find unique user
usersRouter.get(
  "/:id",
  requireRole(Role.ADMIN, Role.MANAGER),
  getUserController,
);

// Create new user
usersRouter.post("/", requireRole(Role.ADMIN), createUserController);

// Update existing user
usersRouter.patch("/:id", requireRole(Role.ADMIN), updateUserController);
