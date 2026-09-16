"use client";

import { FormEvent, useEffect, useState } from "react";

import { apiFetch } from "@/lib/api";
import { Role } from "@/types/auth";
import type { ManagedUser, UserListResponse } from "@/types/user";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

const roles: Role[] = ["ADMIN", "MANAGER", "TEAM_MEMBER"];

function formatRole(role: Role) {
  return role.replace("_", " ");
}

export default function UsersPage() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("TEAM_MEMBER");

  const [creating, setCreating] = useState(false);
  const [actionUserId, setActionUserId] = useState<string | null>(null);

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

    async function fetchUsers() {
      try {
        const data = await apiFetch<UserListResponse>("/users");

        if (cancelled) {
          return;
        }

        setUsers(data.users);
        setError("");
      } catch (error) {
        if (cancelled) {
          return;
        }

        setError(
          error instanceof Error ? error.message : "Unable to load users.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchUsers();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setCreating(true);
    setError("");

    try {
      const user = await apiFetch<ManagedUser>("/users", {
        method: "POST",
        body: JSON.stringify({
          name,
          email,
          password,
          role,
        }),
      });

      setUsers((current) => [user, ...current]);

      setName("");
      setEmail("");
      setPassword("");
      setRole("TEAM_MEMBER");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to create user.",
      );
    } finally {
      setCreating(false);
    }
  }

  async function updateUser(
    user: ManagedUser,
    changes: {
      role?: Role;
      isActive?: boolean;
    },
  ) {
    setActionUserId(user.id);
    setError("");

    try {
      const updatedUser = await apiFetch<ManagedUser>(`/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify(changes),
      });

      setUsers((current) =>
        current.map((item) =>
          item.id === updatedUser.id ? updatedUser : item,
        ),
      );
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to update user.",
      );
    } finally {
      setActionUserId(null);
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Users</h1>

        <p className="mt-1 text-sm text-gray-500">
          Manage users, roles, and account status.
        </p>
      </div>

      {error && (
        <p className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      )}

      <section className="mb-8 rounded-lg border bg-white p-6">
        <h2 className="mb-4 text-lg font-medium">Add User</h2>

        <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-5">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Name"
            required
            className="rounded-md border px-3 py-2 text-sm"
          />

          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            required
            className="rounded-md border px-3 py-2 text-sm"
          />

          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            minLength={8}
            required
            className="rounded-md border px-3 py-2 text-sm"
          />

          <select
            value={role}
            onChange={(event) => setRole(event.target.value as Role)}
            className="rounded-md border px-3 py-2 text-sm"
          >
            {roles.map((item) => (
              <option key={item} value={item}>
                {formatRole(item)}
              </option>
            ))}
          </select>

          <button
            type="submit"
            disabled={creating}
            className="rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {creating ? "Adding..." : "Add User"}
          </button>
        </form>
      </section>

      <section className="rounded-lg border bg-white">
        {loading ? (
          <p className="p-6 text-sm text-gray-500">Loading users...</p>
        ) : users.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">No users found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>

                  <th className="px-4 py-3 font-medium">Email</th>

                  <th className="px-4 py-3 font-medium">Role</th>

                  <th className="px-4 py-3 font-medium">Status</th>

                  <th className="px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>

              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b last:border-b-0">
                    <td className="px-4 py-3 font-medium">{user.name}</td>

                    <td className="px-4 py-3 text-gray-600">{user.email}</td>

                    <td className="px-4 py-3">
                      <select
                        value={user.role}
                        disabled={actionUserId === user.id}
                        onChange={(event) =>
                          void updateUser(user, {
                            role: event.target.value as Role,
                          })
                        }
                        className="rounded-md border px-2 py-1 text-sm"
                      >
                        {roles.map((item) => (
                          <option key={item} value={item}>
                            {formatRole(item)}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={
                          user.isActive ? "text-green-700" : "text-gray-500"
                        }
                      >
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() =>
                          void updateUser(user, {
                            isActive: !user.isActive,
                          })
                        }
                        disabled={actionUserId === user.id}
                        className="rounded-md border px-3 py-1.5 text-xs hover:bg-gray-50 disabled:opacity-50"
                      >
                        {actionUserId === user.id
                          ? "Updating..."
                          : user.isActive
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
