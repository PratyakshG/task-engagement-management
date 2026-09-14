import { prisma } from "../lib/prisma.js";
import type {
  CreateServiceTypeInput,
  UpdateServiceTypeInput,
} from "../validators/service-type.validator.js";

const serviceTypeSelect = {
  id: true,
  name: true,
  description: true,
  isRecurring: true,
  recurrenceInterval: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function createServiceType(input: CreateServiceTypeInput) {
  const existingServiceType = await prisma.serviceType.findUnique({
    where: {
      name: input.name,
    },
  });

  if (existingServiceType) {
    throw new Error("A service type with this name already exists.");
  }

  return prisma.serviceType.create({
    data: {
      name: input.name,
      description: input.description,
      isRecurring: input.isRecurring,
      recurrenceInterval: input.isRecurring ? input.recurrenceInterval : null,
    },
    select: serviceTypeSelect,
  });
}

export async function listServiceTypes() {
  return prisma.serviceType.findMany({
    select: serviceTypeSelect,
    orderBy: {
      name: "asc",
    },
  });
}

export async function getServiceTypeById(id: string) {
  const serviceType = await prisma.serviceType.findUnique({
    where: { id },
    select: {
      ...serviceTypeSelect,
      taskTemplates: {
        select: {
          id: true,
          title: true,
          description: true,
          sequence: true,
        },
        orderBy: {
          sequence: "asc",
        },
      },
    },
  });

  if (!serviceType) {
    throw new Error("Service type not found.");
  }

  return serviceType;
}

export async function updateServiceType(
  id: string,
  input: UpdateServiceTypeInput,
) {
  const existingServiceType = await prisma.serviceType.findUnique({
    where: { id },
  });

  if (!existingServiceType) {
    throw new Error("Service type not found.");
  }

  const name = input.name;

  if (name && name !== existingServiceType.name) {
    const nameOwner = await prisma.serviceType.findUnique({
      where: { name },
    });

    if (nameOwner && nameOwner.id !== id) {
      throw new Error("A service type with this name already exists.");
    }
  }

  const isRecurring = input.isRecurring ?? existingServiceType.isRecurring;

  const recurrenceInterval =
    input.recurrenceInterval !== undefined
      ? input.recurrenceInterval
      : existingServiceType.recurrenceInterval;

  if (isRecurring && !recurrenceInterval) {
    throw new Error("Recurrence interval is required for recurring services.");
  }

  if (!isRecurring && recurrenceInterval) {
    throw new Error(
      "Recurrence interval must be null for non-recurring services.",
    );
  }

  return prisma.serviceType.update({
    where: { id },
    data: {
      ...(name !== undefined && {
        name,
      }),
      ...(input.description !== undefined && {
        description: input.description,
      }),
      ...(input.isRecurring !== undefined && {
        isRecurring,
      }),
      ...(input.recurrenceInterval !== undefined && {
        recurrenceInterval,
      }),
    },
    select: serviceTypeSelect,
  });
}
