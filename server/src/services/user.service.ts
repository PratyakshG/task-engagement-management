import bcrypt from "bcrypt";

import { prisma } from "../lib/prisma.js";
import type {
  CreateUserInput,
  UpdateUserInput,
} from "../validators/user.validator.js";

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function createUser(input: CreateUserInput) {
  const email = input.email.toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (existingUser) {
    throw new Error("A user with this email already exists.");
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  return prisma.user.create({
    data: {
      name: input.name,
      email,
      passwordHash,
      role: input.role,
    },
    select: userSelect,
  });
}

export async function listUsers() {
  return prisma.user.findMany({
    select: userSelect,
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: userSelect,
  });

  if (!user) {
    throw new Error("User not found.");
  }

  return user;
}

export async function updateUser(id: string, input: UpdateUserInput) {
  const existingUser = await prisma.user.findUnique({
    where: { id },
  });

  if (!existingUser) {
    throw new Error("User not found.");
  }

  const email = input.email?.toLowerCase();

  if (email && email !== existingUser.email) {
    const emailOwner = await prisma.user.findUnique({
      where: { email },
    });

    if (emailOwner && emailOwner.id !== id) {
      throw new Error("A user with this email already exists.");
    }
  }

  return prisma.user.update({
    where: { id },
    data: {
      ...(input.name !== undefined && {
        name: input.name,
      }),
      ...(email !== undefined && {
        email,
      }),
      ...(input.role !== undefined && {
        role: input.role,
      }),
      ...(input.isActive !== undefined && {
        isActive: input.isActive,
      }),
    },
    select: userSelect,
  });
}
