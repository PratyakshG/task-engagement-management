import { Router } from "express";

import {
  createClientController,
  getClientController,
  listClientsController,
  updateClientController,
} from "../controllers/client.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";
import { Role } from "../generated/prisma/client.js";

export const clientsRouter = Router();

clientsRouter.use(requireAuth);

// List all clients
clientsRouter.get(
  "/",
  requireRole(Role.ADMIN, Role.MANAGER),
  listClientsController,
);

// Get unique client
clientsRouter.get(
  "/:id",
  requireRole(Role.ADMIN, Role.MANAGER),
  getClientController,
);

// Create new client
clientsRouter.post(
  "/",
  requireRole(Role.ADMIN, Role.MANAGER),
  createClientController,
);

// Update existing client
clientsRouter.patch(
  "/:id",
  requireRole(Role.ADMIN, Role.MANAGER),
  updateClientController,
);
