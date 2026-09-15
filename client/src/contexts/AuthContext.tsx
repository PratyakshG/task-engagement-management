"use client";

import { createContext } from "react";

import type { User } from "@/types/auth";

export interface AuthContextValue {
  user: User | null;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
});
