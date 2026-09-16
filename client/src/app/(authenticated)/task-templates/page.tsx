"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type {
  CreateTaskTemplateInput,
  TaskTemplate,
  TaskTemplateListResponse,
  UpdateTaskTemplateInput,
} from "@/types/task-template";
import type {
  ServiceType,
  ServiceTypeListResponse,
} from "@/types/service-type";

const emptyForm: CreateTaskTemplateInput = {
  title: "",
  description: "",
  sequence: 1,
};

export default function TaskTemplatesPage() {
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [taskTemplates, setTaskTemplates] = useState<TaskTemplate[]>([]);

  const [selectedServiceTypeId, setSelectedServiceTypeId] = useState("");

  const [form, setForm] = useState<CreateTaskTemplateInput>(emptyForm);

  const [editingId, setEditingId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /*
   * Initial service type load.
   *
   * Keep the async operation inside the effect so the React
   * Compiler does not complain about synchronous state updates.
   */
  useEffect(() => {
    let cancelled = false;

    async function loadServiceTypes() {
      try {
        const data = await apiFetch<ServiceTypeListResponse>("/service-types");

        if (cancelled) return;

        setServiceTypes(data.serviceTypes);

        if (data.serviceTypes.length > 0) {
          setSelectedServiceTypeId(data.serviceTypes[0].id);
        }

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

  /*
   * Load templates whenever the selected service type changes.
   */
  useEffect(() => {
    if (!selectedServiceTypeId) {
      return;
    }

    let cancelled = false;

    async function loadTaskTemplates() {
      try {
        setTemplatesLoading(true);

        const data = await apiFetch<TaskTemplateListResponse>(
          `/service-types/${selectedServiceTypeId}/templates`,
        );

        if (cancelled) return;

        setTaskTemplates(
          [...data.taskTemplates].sort((a, b) => a.sequence - b.sequence),
        );

        setError("");
      } catch (err) {
        if (cancelled) return;

        setError(
          err instanceof Error ? err.message : "Unable to load task templates.",
        );
      } finally {
        if (!cancelled) {
          setTemplatesLoading(false);
        }
      }
    }

    void loadTaskTemplates();

    return () => {
      cancelled = true;
    };
  }, [selectedServiceTypeId]);

  async function refreshTaskTemplates() {
    if (!selectedServiceTypeId) {
      setTaskTemplates([]);
      return;
    }

    const data = await apiFetch<TaskTemplateListResponse>(
      `/service-types/${selectedServiceTypeId}/templates`,
    );

    setTaskTemplates(
      [...data.taskTemplates].sort((a, b) => a.sequence - b.sequence),
    );
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
    setSuccess("");
  }

  function handleEdit(taskTemplate: TaskTemplate) {
    setEditingId(taskTemplate.id);

    setForm({
      title: taskTemplate.title,
      description: taskTemplate.description ?? "",
      sequence: taskTemplate.sequence,
    });

    setError("");
    setSuccess("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedServiceTypeId) {
      setError("Please select a service type.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (editingId) {
        const payload: UpdateTaskTemplateInput = {
          title: form.title,
          description: form.description || null,
          sequence: form.sequence,
        };

        await apiFetch(`/task-templates/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });

        await refreshTaskTemplates();

        setSuccess("Task template updated successfully.");
      } else {
        const payload: CreateTaskTemplateInput = {
          title: form.title,
          description: form.description,
          sequence: form.sequence,
        };

        await apiFetch(`/service-types/${selectedServiceTypeId}/templates`, {
          method: "POST",
          body: JSON.stringify(payload),
        });

        await refreshTaskTemplates();

        setSuccess("Task template created successfully.");
      }

      setForm(emptyForm);
      setEditingId(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save task template.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main>
        <p className="text-sm text-gray-500">Loading task templates...</p>
      </main>
    );
  }

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Task Templates</h1>

        <p className="mt-1 text-sm text-gray-500">
          Define the tasks that are generated when an engagement is created.
        </p>
      </div>

      <section className="rounded-lg border bg-white p-6">
        <h2 className="text-lg font-medium">
          {editingId ? "Edit Task Template" : "Create Task Template"}
        </h2>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="serviceType" className="block text-sm font-medium">
              Service Type
            </label>

            <select
              id="serviceType"
              value={selectedServiceTypeId}
              onChange={(event) => {
                setSelectedServiceTypeId(event.target.value);
                resetForm();
              }}
              className="mt-1 w-full rounded-md border px-3 py-2"
            >
              <option value="">Select a service type</option>

              {serviceTypes.map((serviceType) => (
                <option key={serviceType.id} value={serviceType.id}>
                  {serviceType.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium">
              Task Title
            </label>

            <input
              id="title"
              type="text"
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              required
              className="mt-1 w-full rounded-md border px-3 py-2"
              placeholder="e.g. Prepare financial statements"
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
              placeholder="Describe the task..."
            />
          </div>

          <div>
            <label htmlFor="sequence" className="block text-sm font-medium">
              Sequence
            </label>

            <input
              id="sequence"
              type="number"
              min={1}
              step={1}
              value={form.sequence}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  sequence: Number(event.target.value),
                }))
              }
              required
              className="mt-1 w-full rounded-md border px-3 py-2"
            />

            <p className="mt-1 text-xs text-gray-500">
              Determines the order in which tasks are generated.
            </p>
          </div>

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
              disabled={saving || !selectedServiceTypeId}
              className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : editingId
                  ? "Update Task Template"
                  : "Create Task Template"}
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
          <h2 className="text-lg font-medium">Task Templates</h2>

          {selectedServiceTypeId && (
            <p className="mt-1 text-sm text-gray-500">
              {
                serviceTypes.find(
                  (serviceType) => serviceType.id === selectedServiceTypeId,
                )?.name
              }
            </p>
          )}
        </div>

        {templatesLoading ? (
          <div className="p-6 text-sm text-gray-500">Loading templates...</div>
        ) : taskTemplates.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">
            No task templates found for this service type.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-6 py-3 font-medium">Sequence</th>

                  <th className="px-6 py-3 font-medium">Task</th>

                  <th className="px-6 py-3 font-medium">Description</th>

                  <th className="px-6 py-3 font-medium">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {taskTemplates.map((taskTemplate) => (
                  <tr key={taskTemplate.id}>
                    <td className="px-6 py-4">{taskTemplate.sequence}</td>

                    <td className="px-6 py-4 font-medium">
                      {taskTemplate.title}
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {taskTemplate.description || "—"}
                    </td>

                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => handleEdit(taskTemplate)}
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
