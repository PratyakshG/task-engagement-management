import type { Request, Response } from "express";

import { getDashboard } from "../services/dashboard.service.js";

export async function getDashboardController(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({
      error: "Authentication required.",
    });
  }

  try {
    const dashboard = await getDashboard(req.user.id, req.user.role);

    return res.json(dashboard);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Failed to load dashboard.",
    });
  }
}
