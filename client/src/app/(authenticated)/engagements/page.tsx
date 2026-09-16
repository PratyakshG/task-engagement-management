"use client";

import { SubmitEvent, useEffect, useState } from "react";

import { apiFetch } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import type { ClientListResponse } from "@/types/client";
import type {
  CreateEngagementInput,
  Engagement,
  EngagementListResponse,
} from "@/types/engagement";
import { ServiceType, ServiceTypeListResponse } from "@/types/service-type";

function formatStatus(status: Engagement["status"]) {
  return status.replace("_", " ");
}

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleDateString();
}

export default function EngagementsPage() {
  const { user, loading: authLoading } = useAuth();

  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [clients, setClients] = useState<ClientListResponse["clients"]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [clientId, setClientId] = useState("");
  const [serviceTypeId, setServiceTypeId] = useState("");
  const [period, setPeriod] = useState("");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");

  const [creating, setCreating] = useState(false);

  const [generatingId, setGeneratingId] = useState<string | null>(null);

  async function generateNext(engagement: Engagement) {
    setGeneratingId(engagement.id);
    setError("");

    try {
      await apiFetch<Engagement>(
        `/engagements/${engagement.id}/generate-next`,
        {
          method: "POST",
        },
      );

      const data = await apiFetch<EngagementListResponse>("/engagements");

      setEngagements(data.engagements);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to generate the next engagement.",
      );
    } finally {
      setGeneratingId(null);
    }
  }

  const selectedService = serviceTypes.find(
    (service) => service.id === serviceTypeId,
  );

  useEffect(() => {
    if (authLoading || !user) {
      return;
    }

    let cancelled = false;

    async function fetchData() {
      try {
        const [engagementData, clientData, serviceData] = await Promise.all([
          apiFetch<EngagementListResponse>("/engagements"),
          apiFetch<ClientListResponse>("/clients"),
          apiFetch<ServiceTypeListResponse>("/service-types"),
        ]);

        if (cancelled) {
          return;
        }

        setEngagements(engagementData.engagements);
        setClients(clientData.clients);
        setServiceTypes(serviceData.serviceTypes);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load engagements.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchData();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  async function handleCreate(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    setCreating(true);
    setError("");

    const input: CreateEngagementInput = {
      clientId,
      serviceTypeId,
      ...(period ? { period } : {}),
      ...(startDate ? { startDate: new Date(startDate).toISOString() } : {}),
      ...(dueDate ? { dueDate: new Date(dueDate).toISOString() } : {}),
    };

    try {
      const engagement = await apiFetch<Engagement>("/engagements", {
        method: "POST",
        body: JSON.stringify(input),
      });

      setEngagements((current) => [engagement, ...current]);

      setClientId("");
      setServiceTypeId("");
      setPeriod("");
      setStartDate("");
      setDueDate("");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to create engagement.",
      );
    } finally {
      setCreating(false);
    }
  }

  if (
    !authLoading &&
    user &&
    user.role !== "ADMIN" &&
    user.role !== "MANAGER"
  ) {
    return null;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Engagements</h1>

        <p className="mt-1 text-sm text-gray-500">
          Manage client engagements and generated tasks.
        </p>
      </div>

      {error && (
        <p className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      )}

      <section className="mb-8 rounded-lg border bg-white p-6">
        <h2 className="mb-4 text-lg font-medium">Create Engagement</h2>

        <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="client" className="mb-2 block text-sm font-medium">
              Client
            </label>

            <select
              id="client"
              value={clientId}
              onChange={(event) => setClientId(event.target.value)}
              required
              className="w-full rounded-md border px-3 py-2 text-sm"
            >
              <option value="">Select client</option>

              {clients
                .filter((client) => client.isActive)
                .map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label htmlFor="service" className="mb-2 block text-sm font-medium">
              Service Type
            </label>

            <select
              id="service"
              value={serviceTypeId}
              onChange={(event) => {
                setServiceTypeId(event.target.value);
                setPeriod("");
              }}
              required
              className="w-full rounded-md border px-3 py-2 text-sm"
            >
              <option value="">Select service</option>

              {serviceTypes.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </div>

          {selectedService?.isRecurring && (
            <div>
              <label
                htmlFor="period"
                className="mb-2 block text-sm font-medium"
              >
                Period
              </label>

              <input
                id="period"
                value={period}
                onChange={(event) => setPeriod(event.target.value)}
                placeholder={
                  selectedService.recurrenceInterval === "MONTHLY"
                    ? "YYYY-MM"
                    : selectedService.recurrenceInterval === "QUARTERLY"
                      ? "YYYY-QN"
                      : "YYYY"
                }
                required
                className="w-full rounded-md border px-3 py-2 text-sm"
              />

              <p className="mt-1 text-xs text-gray-500">
                {selectedService.recurrenceInterval?.toLowerCase()} service
              </p>
            </div>
          )}

          <div>
            <label
              htmlFor="startDate"
              className="mb-2 block text-sm font-medium"
            >
              Start Date
            </label>

            <input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="dueDate" className="mb-2 block text-sm font-medium">
              Due Date
            </label>

            <input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={creating}
              className="rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              {creating ? "Creating..." : "Create Engagement"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-lg border bg-white">
        {loading ? (
          <p className="p-6 text-sm text-gray-500">Loading engagements...</p>
        ) : engagements.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">No engagements found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-4 py-3 font-medium">Client</th>

                  <th className="px-4 py-3 font-medium">Service</th>

                  <th className="px-4 py-3 font-medium">Period</th>

                  <th className="px-4 py-3 font-medium">Due Date</th>

                  <th className="px-4 py-3 font-medium">Status</th>

                  <th className="px-4 py-3 font-medium">Tasks</th>

                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>

              <tbody>
                {engagements.map((engagement) => (
                  <tr key={engagement.id} className="border-b last:border-b-0">
                    <td className="px-4 py-3 font-medium">
                      {engagement.client.name}
                    </td>

                    <td className="px-4 py-3">{engagement.serviceType.name}</td>

                    <td className="px-4 py-3 text-gray-600">
                      {engagement.period ?? "One-time"}
                    </td>

                    <td className="px-4 py-3 text-gray-600">
                      {formatDate(engagement.dueDate)}
                    </td>

                    <td className="px-4 py-3">
                      {formatStatus(engagement.status)}
                    </td>

                    <td className="px-4 py-3">{engagement._count.tasks}</td>

                    <td className="px-4 py-3">
                      {engagement.serviceType.isRecurring &&
                        engagement.period && (
                          <button
                            type="button"
                            onClick={() => void generateNext(engagement)}
                            disabled={generatingId === engagement.id}
                            className="rounded-md border px-3 py-1.5 text-xs hover:bg-gray-50 disabled:opacity-50"
                          >
                            {generatingId === engagement.id
                              ? "Generating..."
                              : "Generate Next"}
                          </button>
                        )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
