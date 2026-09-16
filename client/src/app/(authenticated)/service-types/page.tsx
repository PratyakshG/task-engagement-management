"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type {
  CreateServiceTypeInput,
  RecurrenceInterval,
  ServiceType,
  ServiceTypeListResponse,
  UpdateServiceTypeInput,
} from "@/types/service-type";

const recurrenceOptions: RecurrenceInterval[] = [
  "MONTHLY",
  "QUARTERLY",
  "YEARLY",
];

const emptyForm: CreateServiceTypeInput = {
  name: "",
  description: "",
  isRecurring: false,
  recurrenceInterval: null,
};

export default function ServiceTypesPage() {
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [form, setForm] = useState<CreateServiceTypeInput>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadServiceTypes() {
      try {
        const data = await apiFetch<ServiceTypeListResponse>("/service-types");

        if (cancelled) return;

        setServiceTypes(data.serviceTypes);
        setError("");
      } catch (err) {
        if (cancelled) return;

        setError(
          err instanceof Error ? err.message : "Unable to load service types.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadServiceTypes();

    return () => {
      cancelled = true;
    };
  }, []);

  async function refreshServiceTypes() {
    const data = await apiFetch<ServiceTypeListResponse>("/service-types");

    setServiceTypes(data.serviceTypes);
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
  }

  function handleRecurringChange(isRecurring: boolean) {
    setForm((current) => ({
      ...current,
      isRecurring,
      recurrenceInterval: isRecurring
        ? (current.recurrenceInterval ?? "MONTHLY")
        : null,
    }));
  }

  function handleEdit(serviceType: ServiceType) {
    setEditingId(serviceType.id);

    setForm({
      name: serviceType.name,
      description: serviceType.description ?? "",
      isRecurring: serviceType.isRecurring,
      recurrenceInterval: serviceType.recurrenceInterval,
    });

    setError("");
    setSuccess("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (editingId) {
        const payload: UpdateServiceTypeInput = {
          name: form.name,
          description: form.description || null,
          isRecurring: form.isRecurring,
          recurrenceInterval: form.isRecurring ? form.recurrenceInterval : null,
        };

        await apiFetch(`/service-types/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });

        setSuccess("Service type updated successfully.");
      } else {
        const payload: CreateServiceTypeInput = {
          name: form.name,
          description: form.description,
          isRecurring: form.isRecurring,
          recurrenceInterval: form.isRecurring ? form.recurrenceInterval : null,
        };

        await apiFetch("/service-types", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        setSuccess("Service type created successfully.");
      }

      resetForm();
      await refreshServiceTypes();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save service type.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Service Types</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage services and their recurrence settings.
        </p>
      </div>

      <section className="rounded-lg border bg-white p-6">
        <h2 className="text-lg font-medium">
          {editingId ? "Edit Service Type" : "Create Service Type"}
        </h2>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium">
              Name
            </label>

            <input
              id="name"
              type="text"
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              required
              className="mt-1 w-full rounded-md border px-3 py-2"
              placeholder="e.g. Monthly Accounting"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium">
              Description
            </label>

            <textarea
              id="description"
              value={form.description ?? ""}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              rows={3}
              className="mt-1 w-full rounded-md border px-3 py-2"
              placeholder="Describe the service..."
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="isRecurring"
              type="checkbox"
              checked={form.isRecurring}
              onChange={(event) => handleRecurringChange(event.target.checked)}
            />

            <label htmlFor="isRecurring" className="text-sm font-medium">
              Recurring service
            </label>
          </div>

          {form.isRecurring && (
            <div>
              <label
                htmlFor="recurrenceInterval"
                className="block text-sm font-medium"
              >
                Recurrence Interval
              </label>

              <select
                id="recurrenceInterval"
                value={form.recurrenceInterval ?? "MONTHLY"}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    recurrenceInterval: event.target
                      .value as RecurrenceInterval,
                  }))
                }
                className="mt-1 w-full rounded-md border px-3 py-2"
              >
                {recurrenceOptions.map((interval) => (
                  <option key={interval} value={interval}>
                    {interval}
                  </option>
                ))}
              </select>
            </div>
          )}

          {error && (
            <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          {success && (
            <p className="rounded-md bg-green-50 p-3 text-sm text-green-700">
              {success}
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : editingId
                  ? "Update Service Type"
                  : "Create Service Type"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                disabled={saving}
                className="rounded-md border px-4 py-2 text-sm font-medium"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="rounded-lg border bg-white">
        <div className="border-b px-6 py-4">
          <h2 className="text-lg font-medium">Existing Service Types</h2>
        </div>

        {loading ? (
          <div className="p-6 text-sm text-gray-500">
            Loading service types...
          </div>
        ) : serviceTypes.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">
            No service types found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Description</th>
                  <th className="px-6 py-3 font-medium">Recurring</th>
                  <th className="px-6 py-3 font-medium">Interval</th>
                  <th className="px-6 py-3 font-medium">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {serviceTypes.map((serviceType) => (
                  <tr key={serviceType.id}>
                    <td className="px-6 py-4 font-medium">
                      {serviceType.name}
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {serviceType.description || "—"}
                    </td>

                    <td className="px-6 py-4">
                      {serviceType.isRecurring ? "Yes" : "No"}
                    </td>

                    <td className="px-6 py-4">
                      {serviceType.recurrenceInterval || "—"}
                    </td>

                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => handleEdit(serviceType)}
                        className="rounded-md border px-3 py-1.5 text-sm font-medium"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
