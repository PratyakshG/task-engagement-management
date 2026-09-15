"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { AuthProvider } from "@/providers/AuthProvider";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";

function AuthenticatedContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  return <AppShell user={user}>{children}</AppShell>;
}

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AuthenticatedContent>{children}</AuthenticatedContent>
    </AuthProvider>
  );
}
