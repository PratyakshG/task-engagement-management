import type { Request, Response } from "express";

import {
  assignTask,
  getTaskById,
  listTasks,
} from "../services/task.service.js";

import {
  assignTaskSchema,
  listTasksQuerySchema,
  taskIdSchema,
} from "../validators/task.validator.js";
import {
  changeTaskStatusSchema,
  reviewTaskSchema,
} from "../validators/task-workflow.validator.js";
import {
  changeTaskStatus,
  reviewTask,
} from "../services/task-workflow.service.js";

export async function listTasksController(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({
      error: "Authentication required.",
    });
  }

  const validationResult = listTasksQuerySchema.safeParse(req.query);

  if (!validationResult.success) {
    return res.status(400).json({
      error: "Invalid query parameters.",
      details: validationResult.error.flatten().fieldErrors,
    });
  }

  const tasks = await listTasks(
    req.user.id,
    req.user.role,
    validationResult.data,
  );

  return res.status(200).json({
    tasks,
  });
}

export async function getTaskController(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({
      error: "Authentication required.",
    });
  }

  const idResult = taskIdSchema.safeParse(req.params.id);

  if (!idResult.success) {
    return res.status(400).json({
      error: "Invalid task ID.",
    });
  }

  try {
    const task = await getTaskById(idResult.data, req.user.id, req.user.role);

    return res.status(200).json({
      task,
    });
  } catch (error) {
    if (!(error instanceof Error)) {
      throw error;
    }

    if (error.message === "Task not found.") {
      return res.status(404).json({
        error: error.message,
      });
    }

    if (error.message === "You do not have access to this task.") {
      return res.status(403).json({
        error: error.message,
      });
    }

    throw error;
  }
}

export async function assignTaskController(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({
      error: "Authentication required.",
    });
  }

  const idResult = taskIdSchema.safeParse(req.params.id);

  if (!idResult.success) {
    return res.status(400).json({
      error: "Invalid task ID.",
    });
  }

  const validationResult = assignTaskSchema.safeParse(req.body);

  if (!validationResult.success) {
    return res.status(400).json({
      error: "Invalid request body.",
      details: validationResult.error.flatten().fieldErrors,
    });
  }

  try {
    const task = await assignTask(
      idResult.data,
      validationResult.data,
      req.user.id,
    );

    return res.status(200).json({
      task,
    });
  } catch (error) {
    if (!(error instanceof Error)) {
      throw error;
    }

    if (
      error.message === "Task not found." ||
      error.message === "Assignee not found."
    ) {
      return res.status(404).json({
        error: error.message,
      });
    }

    if (
      error.message === "Assignee is inactive." ||
      error.message === "Tasks can only be assigned to team members."
    ) {
      return res.status(400).json({
        error: error.message,
      });
    }

    throw error;
  }
}

export async function changeTaskStatusController(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({
      error: "Authentication required.",
    });
  }

  const idResult = taskIdSchema.safeParse(req.params.id);

  if (!idResult.success) {
    return res.status(400).json({
      error: "Invalid task ID.",
    });
  }

  const validationResult = changeTaskStatusSchema.safeParse(req.body);

  if (!validationResult.success) {
    return res.status(400).json({
      error: "Invalid request body.",
      details: validationResult.error.flatten().fieldErrors,
    });
  }

  try {
    const task = await changeTaskStatus(
      idResult.data,
      req.user.id,
      req.user.role,
      validationResult.data,
    );

    return res.status(200).json({
      task,
    });
  } catch (error) {
    if (!(error instanceof Error)) {
      throw error;
    }

    if (error.message === "Task not found.") {
      return res.status(404).json({
        error: error.message,
      });
    }

    if (
      error.message === "Managers and Admins are not allowed to change task status."
    ) {
      return res.status(403).json({
        error: error.message,
      });
    }

    if (error.message === "You do not have permission to update this task.") {
      return res.status(403).json({
        error: error.message,
      });
    }

    if (error.message === "Use the review endpoint for review decisions.") {
      return res.status(400).json({
        error: error.message,
      });
    }

    if (error.message.startsWith("Invalid task status transition")) {
      return res.status(400).json({
        error: error.message,
      });
    }

    throw error;
  }
}

export async function reviewTaskController(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({
      error: "Authentication required.",
    });
  }

  const idResult = taskIdSchema.safeParse(req.params.id);

  if (!idResult.success) {
    return res.status(400).json({
      error: "Invalid task ID.",
    });
  }

  const validationResult = reviewTaskSchema.safeParse(req.body);

  if (!validationResult.success) {
    return res.status(400).json({
      error: "Invalid request body.",
      details: validationResult.error.flatten().fieldErrors,
    });
  }

  try {
    const task = await reviewTask(
      idResult.data,
      req.user.id,
      req.user.role,
      validationResult.data,
    );

    return res.status(200).json({
      task,
    });
  } catch (error) {
    if (!(error instanceof Error)) {
      throw error;
    }

    if (error.message === "Task not found.") {
      return res.status(404).json({
        error: error.message,
      });
    }

    if (error.message === "Only managers can review tasks.") {
      return res.status(403).json({
        error: error.message,
      });
    }

    if (error.message === "You cannot review your own work.") {
      return res.status(403).json({
        error: error.message,
      });
    }

    if (error.message === "Only tasks ready for review can be reviewed.") {
      return res.status(400).json({
        error: error.message,
      });
    }

    throw error;
  }
}
