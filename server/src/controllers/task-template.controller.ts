import type { Request, Response } from "express";

import {
  createTaskTemplate,
  listTaskTemplates,
  updateTaskTemplate,
} from "../services/task-template.service.js";

import {
  createTaskTemplateSchema,
  taskTemplateIdSchema,
  updateTaskTemplateSchema,
} from "../validators/task-template.validator.js";

import { serviceTypeIdSchema } from "../validators/service-type.validator.js";

export async function createTaskTemplateController(
  req: Request,
  res: Response,
) {
  const serviceTypeIdResult = serviceTypeIdSchema.safeParse(
    req.params.serviceTypeId,
  );

  if (!serviceTypeIdResult.success) {
    return res.status(400).json({
      error: "Invalid service type ID.",
    });
  }

  const validationResult = createTaskTemplateSchema.safeParse(req.body);

  if (!validationResult.success) {
    return res.status(400).json({
      error: "Invalid request body.",
      details: validationResult.error.flatten().fieldErrors,
    });
  }

  try {
    const taskTemplate = await createTaskTemplate(
      serviceTypeIdResult.data,
      validationResult.data,
    );

    return res.status(201).json({
      taskTemplate,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Service type not found.") {
      return res.status(404).json({
        error: error.message,
      });
    }

    if (
      error instanceof Error &&
      error.message ===
        "A task template with this sequence already exists for this service type."
    ) {
      return res.status(409).json({
        error: error.message,
      });
    }

    throw error;
  }
}

export async function listTaskTemplatesController(req: Request, res: Response) {
  const serviceTypeIdResult = serviceTypeIdSchema.safeParse(
    req.params.serviceTypeId,
  );

  if (!serviceTypeIdResult.success) {
    return res.status(400).json({
      error: "Invalid service type ID.",
    });
  }

  try {
    const taskTemplates = await listTaskTemplates(serviceTypeIdResult.data);

    return res.status(200).json({
      taskTemplates,
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

export async function updateTaskTemplateController(
  req: Request,
  res: Response,
) {
  const idResult = taskTemplateIdSchema.safeParse(req.params.id);

  if (!idResult.success) {
    return res.status(400).json({
      error: "Invalid task template ID.",
    });
  }

  const validationResult = updateTaskTemplateSchema.safeParse(req.body);

  if (!validationResult.success) {
    return res.status(400).json({
      error: "Invalid request body.",
      details: validationResult.error.flatten().fieldErrors,
    });
  }

  try {
    const taskTemplate = await updateTaskTemplate(
      idResult.data,
      validationResult.data,
    );

    return res.status(200).json({
      taskTemplate,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Task template not found."
    ) {
      return res.status(404).json({
        error: error.message,
      });
    }

    if (
      error instanceof Error &&
      error.message ===
        "A task template with this sequence already exists for this service type."
    ) {
      return res.status(409).json({
        error: error.message,
      });
    }

    throw error;
  }
}
