import { prisma } from "../lib/prisma.js";
import type {
  CreateClientInput,
  UpdateClientInput,
} from "../validators/client.validator.js";

const clientSelect = {
  id: true,
  name: true,
  contactEmail: true,
  contactPhone: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function createClient(input: CreateClientInput) {
  return prisma.client.create({
    data: {
      name: input.name,
      contactEmail: input.contactEmail?.toLowerCase(),
      contactPhone: input.contactPhone,
    },
    select: clientSelect,
  });
}

export async function listClients() {
  return prisma.client.findMany({
    select: clientSelect,
    orderBy: {
      name: "asc",
    },
  });
}

export async function getClientById(id: string) {
  const client = await prisma.client.findUnique({
    where: { id },
    select: clientSelect,
  });

  if (!client) {
    throw new Error("Client not found.");
  }

  return client;
}

export async function updateClient(id: string, input: UpdateClientInput) {
  const existingClient = await prisma.client.findUnique({
    where: { id },
  });

  if (!existingClient) {
    throw new Error("Client not found.");
  }

  return prisma.client.update({
    where: { id },
    data: {
      ...(input.name !== undefined && {
        name: input.name,
      }),
      ...(input.contactEmail !== undefined && {
        contactEmail: input.contactEmail.toLowerCase(),
      }),
      ...(input.contactPhone !== undefined && {
        contactPhone: input.contactPhone,
      }),
      ...(input.isActive !== undefined && {
        isActive: input.isActive,
      }),
    },
    select: clientSelect,
  });
}
