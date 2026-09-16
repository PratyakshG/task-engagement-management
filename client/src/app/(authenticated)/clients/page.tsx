"use client";

import { SubmitEvent, useEffect, useState } from "react";

import { apiFetch } from "@/lib/api";
import type { Client, ClientListResponse } from "@/types/client";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  const [creating, setCreating] = useState(false);
  const [actionClientId, setActionClientId] = useState<string | null>(null);

  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (
      !authLoading &&
      user &&
      user.role !== "ADMIN" &&
      user.role !== "MANAGER"
    ) {
      router.replace("/dashboard");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    let cancelled = false;

    async function fetchClients() {
      try {
        const data = await apiFetch<ClientListResponse>("/clients");

        if (cancelled) {
          return;
        }

        setClients(data.clients);
        setError("");
      } catch (error) {
        if (cancelled) {
          return;
        }

        setError(
          error instanceof Error ? error.message : "Unable to load clients.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchClients();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCreate(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    setCreating(true);
    setError("");

    try {
      const client = await apiFetch<Client>("/clients", {
        method: "POST",
        body: JSON.stringify({
          name,
          ...(contactEmail ? { contactEmail } : {}),
          ...(contactPhone ? { contactPhone } : {}),
        }),
      });

      setClients((current) => [client, ...current]);

      setName("");
      setContactEmail("");
      setContactPhone("");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to create client.",
      );
    } finally {
      setCreating(false);
    }
  }

  async function toggleActive(client: Client) {
    setActionClientId(client.id);
    setError("");

    try {
      const updatedClient = await apiFetch<Client>(`/clients/${client.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          isActive: !client.isActive,
        }),
      });

      setClients((current) =>
        current.map((item) =>
          item.id === updatedClient.id ? updatedClient : item,
        ),
      );
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to update client.",
      );
    } finally {
      setActionClientId(null);
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Clients</h1>

        <p className="mt-1 text-sm text-gray-500">
          Manage clients and their active status.
        </p>
      </div>

      {error && (
        <p className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      )}

      <section className="mb-8 rounded-lg border bg-white p-6">
        <h2 className="mb-4 text-lg font-medium">Add Client</h2>

        <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-4">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Client name"
            required
            className="rounded-md border px-3 py-2 text-sm"
          />

          <input
            type="email"
            value={contactEmail}
            onChange={(event) => setContactEmail(event.target.value)}
            placeholder="Email"
            className="rounded-md border px-3 py-2 text-sm"
          />

          <input
            value={contactPhone}
            onChange={(event) => setContactPhone(event.target.value)}
            placeholder="Phone"
            className="rounded-md border px-3 py-2 text-sm"
          />

          <button
            type="submit"
            disabled={creating}
            className="rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {creating ? "Adding..." : "Add Client"}
          </button>
        </form>
      </section>

      <section className="rounded-lg border bg-white">
        {loading ? (
          <p className="p-6 text-sm text-gray-500">Loading clients...</p>
        ) : clients.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">No clients found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>

              <tbody>
                {clients.map((client) => (
                  <tr key={client.id} className="border-b last:border-b-0">
                    <td className="px-4 py-3 font-medium">{client.name}</td>

                    <td className="px-4 py-3 text-gray-600">
                      {client.contactEmail ?? "—"}
                    </td>

                    <td className="px-4 py-3 text-gray-600">
                      {client.contactPhone ?? "—"}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={
                          client.isActive ? "text-green-700" : "text-gray-500"
                        }
                      >
                        {client.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => void toggleActive(client)}
                        disabled={actionClientId === client.id}
                        className="rounded-md border px-3 py-1.5 text-xs hover:bg-gray-50 disabled:opacity-50"
                      >
                        {actionClientId === client.id
                          ? "Updating..."
                          : client.isActive
                            ? "Deactivate"
                            : "Activate"}
                      </button>
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
