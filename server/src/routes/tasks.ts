import { Router } from "express";

import {
  assignTaskController,
  getTaskController,
  listTasksController,
} from "../controllers/task.controller.js";

import {
  changeTaskStatusController,
  reviewTaskController,
} from "../controllers/task.controller.js";

import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";
import { Role } from "../generated/prisma/client.js";

export const tasksRouter = Router();

tasksRouter.use(requireAuth);

tasksRouter.get("/", listTasksController);

tasksRouter.get("/:id", getTaskController);

tasksRouter.patch(
  "/:id/assignment",
  requireRole(Role.ADMIN, Role.MANAGER),
  assignTaskController,
);

tasksRouter.patch("/:id/status", changeTaskStatusController);

tasksRouter.post(
  "/:id/review",
  requireRole(Role.ADMIN, Role.MANAGER),
  reviewTaskController,
);
