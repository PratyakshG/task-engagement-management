import type { Request, Response } from "express";

import {
  createEngagement,
  getEngagementById,
  listEngagements,
  updateEngagement,
} from "../services/engagement.service.js";

import {
  createEngagementSchema,
  engagementIdSchema,
  updateEngagementSchema,
} from "../validators/engagement.validator.js";

export async function createEngagementController(req: Request, res: Response) {
  const validationResult = createEngagementSchema.safeParse(req.body);

  if (!validationResult.success) {
    return res.status(400).json({
      error: "Invalid request body.",
      details: validationResult.error.flatten().fieldErrors,
    });
  }

  if (!req.user) {
    return res.status(401).json({
      error: "Authentication required.",
    });
  }

  try {
    const engagement = await createEngagement(
      validationResult.data,
      req.user.id,
    );

    return res.status(201).json({
      engagement,
    });
  } catch (error) {
    if (!(error instanceof Error)) {
      throw error;
    }

    switch (error.message) {
      case "Client not found.":
      case "Service type not found.":
      case "Engagement not found.":
        return res.status(404).json({
          error: error.message,
        });

      case "Client is inactive.":
      case "Period must be omitted for non-recurring services.":
      case "Period is required for recurring services.":
      case "Monthly engagement period must use YYYY-MM format.":
      case "Quarterly engagement period must use YYYY-QN format.":
      case "Yearly engagement period must use YYYY format.":
      case "Recurring service must have a recurrence interval.":
      case "Due date cannot be earlier than the start date.":
        return res.status(400).json({
          error: error.message,
        });

      case "An engagement already exists for this client, service type, and period.":
        return res.status(409).json({
          error: error.message,
        });

      default:
        throw error;
    }
  }
}

export async function listEngagementsController(_req: Request, res: Response) {
  const engagements = await listEngagements();

  return res.status(200).json({
    engagements,
  });
}

export async function getEngagementController(req: Request, res: Response) {
  const idResult = engagementIdSchema.safeParse(req.params.id);

  if (!idResult.success) {
    return res.status(400).json({
      error: "Invalid engagement ID.",
    });
  }

  try {
    const engagement = await getEngagementById(idResult.data);

    return res.status(200).json({
      engagement,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Engagement not found.") {
      return res.status(404).json({
        error: error.message,
      });
    }

    throw error;
  }
}

export async function updateEngagementController(req: Request, res: Response) {
  const idResult = engagementIdSchema.safeParse(req.params.id);

  if (!idResult.success) {
    return res.status(400).json({
      error: "Invalid engagement ID.",
    });
  }

  const validationResult = updateEngagementSchema.safeParse(req.body);

  if (!validationResult.success) {
    return res.status(400).json({
      error: "Invalid request body.",
      details: validationResult.error.flatten().fieldErrors,
    });
  }

  try {
    const engagement = await updateEngagement(
      idResult.data,
      validationResult.data,
    );

    return res.status(200).json({
      engagement,
    });
  } catch (error) {
    if (!(error instanceof Error)) {
      throw error;
    }

    if (error.message === "Engagement not found.") {
      return res.status(404).json({
        error: error.message,
      });
    }

    if (error.message === "Due date cannot be earlier than the start date.") {
      return res.status(400).json({
        error: error.message,
      });
    }

    throw error;
  }
}
