"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

interface DashboardMetrics {
  openTasks: number;
  overdueTasks: number;
  dueToday: number;
  waitingForClient: number;
  waitingForReview: number;
}

const metrics = [
  {
    key: "openTasks",
    label: "Open Tasks",
  },
  {
    key: "overdueTasks",
    label: "Overdue",
  },
  {
    key: "dueToday",
    label: "Due Today",
  },
  {
    key: "waitingForClient",
    label: "Waiting for Client",
  },
  {
    key: "waitingForReview",
    label: "Waiting for Review",
  },
] as const;

const DashboardPage = () => {
  const [dashboard, setDashboard] = useState<DashboardMetrics | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const data = await apiFetch<DashboardMetrics>("/dashboard");

        setDashboard(data);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Unable to load dashboard.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadDashboard();
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Dashboard</h1>

        <p className="mt-1 text-sm text-gray-500">
          Overview of your current workload.
        </p>
      </div>

      {loading && <p className="text-sm text-gray-500">Loading dashboard...</p>}

      {error && (
        <p className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</p>
      )}

      {!loading && !error && dashboard && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {metrics.map((metric) => (
            <div key={metric.key} className="rounded-lg border bg-white p-5">
              <p className="text-sm text-gray-500">{metric.label}</p>

              <p className="mt-2 text-3xl font-semibold">
                {dashboard[metric.key]}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
