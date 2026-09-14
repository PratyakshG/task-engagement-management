import { prisma } from "../lib/prisma.js";
import type {
  CreateTaskTemplateInput,
  UpdateTaskTemplateInput,
} from "../validators/task-template.validator.js";

const taskTemplateSelect = {
  id: true,
  serviceTypeId: true,
  title: true,
  description: true,
  sequence: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function createTaskTemplate(
  serviceTypeId: string,
  input: CreateTaskTemplateInput,
) {
  const serviceType = await prisma.serviceType.findUnique({
    where: {
      id: serviceTypeId,
    },
  });

  if (!serviceType) {
    throw new Error("Service type not found.");
  }

  const existingTemplate = await prisma.taskTemplate.findUnique({
    where: {
      serviceTypeId_sequence: {
        serviceTypeId,
        sequence: input.sequence,
      },
    },
  });

  if (existingTemplate) {
    throw new Error(
      "A task template with this sequence already exists for this service type.",
    );
  }

  return prisma.taskTemplate.create({
    data: {
      serviceTypeId,
      title: input.title,
      description: input.description,
      sequence: input.sequence,
    },
    select: taskTemplateSelect,
  });
}

export async function listTaskTemplates(serviceTypeId: string) {
  const serviceType = await prisma.serviceType.findUnique({
    where: {
      id: serviceTypeId,
    },
  });

  if (!serviceType) {
    throw new Error("Service type not found.");
  }

  return prisma.taskTemplate.findMany({
    where: {
      serviceTypeId,
    },
    select: taskTemplateSelect,
    orderBy: {
      sequence: "asc",
    },
  });
}

export async function updateTaskTemplate(
  id: string,
  input: UpdateTaskTemplateInput,
) {
  const existingTemplate = await prisma.taskTemplate.findUnique({
    where: { id },
  });

  if (!existingTemplate) {
    throw new Error("Task template not found.");
  }

  if (input.sequence !== undefined) {
    const sequenceOwner = await prisma.taskTemplate.findUnique({
      where: {
        serviceTypeId_sequence: {
          serviceTypeId: existingTemplate.serviceTypeId,
          sequence: input.sequence,
        },
      },
    });

    if (sequenceOwner && sequenceOwner.id !== id) {
      throw new Error(
        "A task template with this sequence already exists for this service type.",
      );
    }
  }

  return prisma.taskTemplate.update({
    where: { id },
    data: {
      ...(input.title !== undefined && {
        title: input.title,
      }),
      ...(input.description !== undefined && {
        description: input.description,
      }),
      ...(input.sequence !== undefined && {
        sequence: input.sequence,
      }),
    },
    select: taskTemplateSelect,
  });
}
