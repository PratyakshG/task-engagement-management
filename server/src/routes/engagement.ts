import { Router } from "express";

import {
  createEngagementController,
  getEngagementController,
  listEngagementsController,
  updateEngagementController,
} from "../controllers/engagement.controller.js";

import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";
import { Role } from "../generated/prisma/client.js";

export const engagementsRouter = Router();

engagementsRouter.use(requireAuth);

engagementsRouter.get(
  "/",
  requireRole(Role.ADMIN, Role.MANAGER),
  listEngagementsController,
);

engagementsRouter.get(
  "/:id",
  requireRole(Role.ADMIN, Role.MANAGER),
  getEngagementController,
);

engagementsRouter.post(
  "/",
  requireRole(Role.ADMIN, Role.MANAGER),
  createEngagementController,
);

engagementsRouter.patch(
  "/:id",
  requireRole(Role.ADMIN, Role.MANAGER),
  updateEngagementController,
);
