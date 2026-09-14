import type { Request, Response } from "express";

import {
  createClient,
  getClientById,
  listClients,
  updateClient,
} from "../services/client.service.js";

import {
  clientIdSchema,
  createClientSchema,
  updateClientSchema,
} from "../validators/client.validator.js";

export async function createClientController(req: Request, res: Response) {
  const validationResult = createClientSchema.safeParse(req.body);

  if (!validationResult.success) {
    return res.status(400).json({
      error: "Invalid request body.",
      details: validationResult.error.flatten().fieldErrors,
    });
  }

  const client = await createClient(validationResult.data);

  return res.status(201).json({
    client,
  });
}

export async function listClientsController(_req: Request, res: Response) {
  const clients = await listClients();

  return res.status(200).json({
    clients,
  });
}

export async function getClientController(req: Request, res: Response) {
  const idResult = clientIdSchema.safeParse(req.params.id);

  if (!idResult.success) {
    return res.status(400).json({
      error: "Invalid client ID.",
    });
  }

  try {
    const client = await getClientById(idResult.data);

    return res.status(200).json({
      client,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Client not found.") {
      return res.status(404).json({
        error: error.message,
      });
    }

    throw error;
  }
}

export async function updateClientController(req: Request, res: Response) {
  const idResult = clientIdSchema.safeParse(req.params.id);

  if (!idResult.success) {
    return res.status(400).json({
      error: "Invalid client ID.",
    });
  }

  const validationResult = updateClientSchema.safeParse(req.body);

  if (!validationResult.success) {
    return res.status(400).json({
      error: "Invalid request body.",
      details: validationResult.error.flatten().fieldErrors,
    });
  }

  try {
    const client = await updateClient(idResult.data, validationResult.data);

    return res.status(200).json({
      client,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Client not found.") {
      return res.status(404).json({
        error: error.message,
      });
    }

    throw error;
  }
}
