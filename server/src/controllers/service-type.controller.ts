import type { Request, Response } from "express";

import {
  createServiceType,
  getServiceTypeById,
  listServiceTypes,
  updateServiceType,
} from "../services/service-type.service.js";

import {
  createServiceTypeSchema,
  serviceTypeIdSchema,
  updateServiceTypeSchema,
} from "../validators/service-type.validator.js";

export async function createServiceTypeController(req: Request, res: Response) {
  const validationResult = createServiceTypeSchema.safeParse(req.body);

  if (!validationResult.success) {
    return res.status(400).json({
      error: "Invalid request body.",
      details: validationResult.error.flatten().fieldErrors,
    });
  }

  try {
    const serviceType = await createServiceType(validationResult.data);

    return res.status(201).json({
      serviceType,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "A service type with this name already exists."
    ) {
      return res.status(409).json({
        error: error.message,
      });
    }

    throw error;
  }
}

export async function listServiceTypesController(_req: Request, res: Response) {
  const serviceTypes = await listServiceTypes();

  return res.status(200).json({
    serviceTypes,
  });
}

export async function getServiceTypeController(req: Request, res: Response) {
  const idResult = serviceTypeIdSchema.safeParse(req.params.id);

  if (!idResult.success) {
    return res.status(400).json({
      error: "Invalid service type ID.",
    });
  }

  try {
    const serviceType = await getServiceTypeById(idResult.data);

    return res.status(200).json({
      serviceType,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Service type not found.") {
      return res.status(404).json({
        error: error.message,
      });
    }

    throw error;
  }
}

export async function updateServiceTypeController(req: Request, res: Response) {
  const idResult = serviceTypeIdSchema.safeParse(req.params.id);

  if (!idResult.success) {
    return res.status(400).json({
      error: "Invalid service type ID.",
    });
  }

  const validationResult = updateServiceTypeSchema.safeParse(req.body);

  if (!validationResult.success) {
    return res.status(400).json({
      error: "Invalid request body.",
      details: validationResult.error.flatten().fieldErrors,
    });
  }

  try {
    const serviceType = await updateServiceType(
      idResult.data,
      validationResult.data,
    );

    return res.status(200).json({
      serviceType,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "Service type not found." ||
        error.message ===
          "Recurrence interval is required for recurring services." ||
        error.message ===
          "Recurrence interval must be null for non-recurring services.")
    ) {
      return res
        .status(error.message === "Service type not found." ? 404 : 400)
        .json({
          error: error.message,
        });
    }

    if (
      error instanceof Error &&
      error.message === "A service type with this name already exists."
    ) {
      return res.status(409).json({
        error: error.message,
      });
    }

    throw error;
  }
}
