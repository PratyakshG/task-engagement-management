import { Router } from "express";

import { updateTaskTemplateController } from "../controllers/task-template.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";
import { Role } from "../generated/prisma/client.js";

export const taskTemplatesRouter = Router();

taskTemplatesRouter.use(requireAuth);

taskTemplatesRouter.patch(
  "/:id",
  requireRole(Role.ADMIN),
  updateTaskTemplateController,
);
