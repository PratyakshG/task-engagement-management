"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type HealthResponse = {
  status: string;
};

export default function Home() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<HealthResponse>("/api/health")
      .then(setHealth)
      .catch(() => {
        setError("Unable to connect to API server");
      });
  }, []);

  return (
    <main className="flex flex-1 w-full flex-col items-center justify-start sm:items-start bg-white dark:bg-neutral-950 mx-auto px-32 py-6">
      <h1 className="text-2xl font-sans">
        Task & Engagement Management System
      </h1>

      {health && <p>API status: {health.status}</p>}

      {error && <p>{error}</p>}
    </main>
  );
}
