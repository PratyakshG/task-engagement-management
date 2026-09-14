import { Router } from "express";

import {
  createServiceTypeController,
  getServiceTypeController,
  listServiceTypesController,
  updateServiceTypeController,
} from "../controllers/service-type.controller.js";

import {
  createTaskTemplateController,
  listTaskTemplatesController,
} from "../controllers/task-template.controller.js";

import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";
import { Role } from "../generated/prisma/client.js";

export const serviceTypesRouter = Router();

serviceTypesRouter.use(requireAuth);

serviceTypesRouter.get(
  "/",
  requireRole(Role.ADMIN, Role.MANAGER),
  listServiceTypesController,
);

serviceTypesRouter.get(
  "/:serviceTypeId/templates",
  requireRole(Role.ADMIN, Role.MANAGER),
  listTaskTemplatesController,
);

serviceTypesRouter.post(
  "/:serviceTypeId/templates",
  requireRole(Role.ADMIN),
  createTaskTemplateController,
);

serviceTypesRouter.get(
  "/:id",
  requireRole(Role.ADMIN, Role.MANAGER),
  getServiceTypeController,
);

serviceTypesRouter.post(
  "/",
  requireRole(Role.ADMIN),
  createServiceTypeController,
);

serviceTypesRouter.patch(
  "/:id",
  requireRole(Role.ADMIN),
  updateServiceTypeController,
);
