"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AuthContext } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import { clearToken, getToken } from "@/lib/auth";
import type { User } from "@/types/auth";

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const token = getToken();

      if (!token) {
        setLoading(false);
        router.replace("/login");
        return;
      }

      try {
        const response = await apiFetch<{ user: User }>("/auth/current-user");

        setUser(response.user);
      } catch {
        clearToken();
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    }

    void loadUser();
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
