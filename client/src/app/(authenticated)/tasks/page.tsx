"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/lib/api";
import type { Task, TaskListResponse, TaskStatus } from "@/types/task";

interface UserOption {
  id: string;
  name: string;
  email: string;
}

const statusOptions: {
  value: TaskStatus;
  label: string;
}[] = [
  { value: "NOT_STARTED", label: "Not Started" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "WAITING_FOR_CLIENT", label: "Waiting for Client" },
  { value: "READY_FOR_REVIEW", label: "Ready for Review" },
  { value: "CHANGES_REQUESTED", label: "Changes Requested" },
  { value: "COMPLETED", label: "Completed" },
];

function formatDate(date: string | null): string {
  if (!date) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
  }).format(new Date(date));
}

function formatStatus(status: Task["status"]): string {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getAvailableStatusActions(
  status: TaskStatus,
): { value: TaskStatus; label: string }[] {
  switch (status) {
    case "NOT_STARTED":
      return [
        {
          value: "IN_PROGRESS",
          label: "Start",
        },
      ];

    case "IN_PROGRESS":
      return [
        {
          value: "WAITING_FOR_CLIENT",
          label: "Waiting for Client",
        },
        {
          value: "READY_FOR_REVIEW",
          label: "Submit for Review",
        },
      ];

    case "WAITING_FOR_CLIENT":
      return [
        {
          value: "IN_PROGRESS",
          label: "Resume",
        },
      ];

    case "CHANGES_REQUESTED":
      return [
        {
          value: "IN_PROGRESS",
          label: "Resume",
        },
      ];

    case "READY_FOR_REVIEW":
    case "COMPLETED":
      return [];

    default:
      return [];
  }
}

export default function TasksPage() {
  const { user } = useAuth();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [pagination, setPagination] = useState<
    TaskListResponse["pagination"] | null
  >(null);

  const [status, setStatus] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [overdue, setOverdue] = useState("");

  const [users, setUsers] = useState<UserOption[]>([]);
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionTaskId, setActionTaskId] = useState<string | null>(null);

  const canFilterByAssignee =
    user?.role === "ADMIN" || user?.role === "MANAGER";

  const canReview = user?.role === "ADMIN" || user?.role === "MANAGER";

  const isTeamMember = user?.role === "TEAM_MEMBER";

  useEffect(() => {
    async function loadUsers() {
      if (!canFilterByAssignee) {
        return;
      }

      try {
        const response = await apiFetch<{
          users: UserOption[];
        }>("/users");

        setUsers(response.users);
      } catch {
        // The task list remains usable if the optional assignee filter fails.
      }
    }

    void loadUsers();
  }, [canFilterByAssignee]);

  useEffect(() => {
    let cancelled = false;

    async function fetchTasks() {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: "20",
      });

      if (status) {
        params.set("status", status);
      }

      if (assignedToId) {
        params.set("assignedToId", assignedToId);
      }

      if (overdue) {
        params.set("overdue", overdue);
      }

      try {
        const data = await apiFetch<TaskListResponse>(
          `/tasks?${params.toString()}`,
        );

        if (cancelled) {
          return;
        }

        setTasks(data.tasks);
        setPagination(data.pagination);
        setError("");
      } catch (error) {
        if (cancelled) {
          return;
        }

        setError(
          error instanceof Error ? error.message : "Unable to load tasks.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchTasks();

    return () => {
      cancelled = true;
    };
  }, [page, status, assignedToId, overdue]);

  async function changeStatus(taskId: string, nextStatus: TaskStatus) {
    setActionTaskId(taskId);
    setError("");

    try {
      await apiFetch<Task>(`/tasks/${taskId}/status`, {
        method: "PATCH",
        body: JSON.stringify({
          status: nextStatus,
        }),
      });

      window.location.reload();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to update task status.",
      );
    } finally {
      setActionTaskId(null);
    }
  }

  async function reviewTask(
    taskId: string,
    decision: "APPROVE" | "REQUEST_CHANGES",
  ) {
    setActionTaskId(taskId);
    setError("");

    try {
      await apiFetch<Task>(`/tasks/${taskId}/review`, {
        method: "POST",
        body: JSON.stringify({
          decision,
        }),
      });

      window.location.reload();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to review task.",
      );
    } finally {
      setActionTaskId(null);
    }
  }

  async function assignTask(taskId: string, assignedToId: string | null) {
    setActionTaskId(taskId);
    setError("");

    try {
      await apiFetch<Task>(`/tasks/${taskId}/assignment`, {
        method: "PATCH",
        body: JSON.stringify({
          assignedToId,
        }),
      });

      window.location.reload();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to assign task.",
      );
    } finally {
      setActionTaskId(null);
    }
  }

  function handleStatusChange(value: string) {
    setStatus(value);
    setPage(1);
  }

  function handleAssigneeChange(value: string) {
    setAssignedToId(value);
    setPage(1);
  }

  function handleOverdueChange(value: string) {
    setOverdue(value);
    setPage(1);
  }

  function clearFilters() {
    setStatus("");
    setAssignedToId("");
    setOverdue("");
    setPage(1);
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Tasks</h1>

        <p className="mt-1 text-sm text-gray-500">
          View and manage assigned tasks.
        </p>
      </div>

      <div className="mb-6 rounded-lg border bg-white p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label htmlFor="status" className="mb-2 block text-sm font-medium">
              Status
            </label>

            <select
              id="status"
              value={status}
              onChange={(event) => handleStatusChange(event.target.value)}
              className="rounded-md border px-3 py-2 text-sm"
            >
              <option value="">All statuses</option>

              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {canFilterByAssignee && (
            <div>
              <label
                htmlFor="assignee"
                className="mb-2 block text-sm font-medium"
              >
                Assignee
              </label>

              <select
                id="assignee"
                value={assignedToId}
                onChange={(event) => handleAssigneeChange(event.target.value)}
                className="rounded-md border px-3 py-2 text-sm"
              >
                <option value="">All assignees</option>

                {users.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label htmlFor="overdue" className="mb-2 block text-sm font-medium">
              Due Date
            </label>

            <select
              id="overdue"
              value={overdue}
              onChange={(event) => handleOverdueChange(event.target.value)}
              className="rounded-md border px-3 py-2 text-sm"
            >
              <option value="">All tasks</option>
              <option value="true">Overdue</option>
              <option value="false">Not overdue</option>
            </select>
          </div>

          {(status || assignedToId || overdue) && (
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {loading && <p className="text-sm text-gray-500">Loading tasks...</p>}

      {error && (
        <p className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      )}

      {!loading && (
        <>
          <div className="overflow-hidden rounded-lg border bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 font-medium">Task</th>
                    <th className="px-4 py-3 font-medium">Client</th>
                    <th className="px-4 py-3 font-medium">Service</th>
                    <th className="px-4 py-3 font-medium">Assignee</th>
                    <th className="px-4 py-3 font-medium">Due Date</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {tasks.map((task) => {
                    const statusActions = isTeamMember
                      ? getAvailableStatusActions(task.status)
                      : [];

                    const isReviewable =
                      canReview && task.status === "READY_FOR_REVIEW";

                    return (
                      <tr key={task.id}>
                        <td className="px-4 py-4">
                          <div>
                            <p className="font-medium">{task.title}</p>

                            {task.description && (
                              <p className="mt-1 max-w-md truncate text-gray-500">
                                {task.description}
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          {task.engagement.client.name}
                        </td>

                        <td className="px-4 py-4">
                          {task.engagement.serviceType.name}
                        </td>

                        <td className="px-4 py-4">
                          {canFilterByAssignee ? (
                            <select
                              value={task.assignedToId ?? ""}
                              disabled={actionTaskId === task.id}
                              onChange={(event) =>
                                assignTask(task.id, event.target.value || null)
                              }
                              className="rounded-md border px-2 py-1.5 text-sm disabled:opacity-50"
                            >
                              <option value="">Unassigned</option>

                              {users.map((item) => (
                                <option key={item.id} value={item.id}>
                                  {item.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span>{task.assignedTo?.name ?? "Unassigned"}</span>
                          )}
                        </td>

                        <td className="px-4 py-4">
                          {formatDate(task.dueDate)}
                        </td>

                        <td className="px-4 py-4">
                          <span className="rounded-full border px-2.5 py-1 text-xs">
                            {formatStatus(task.status)}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            {statusActions.map((action) => (
                              <button
                                key={action.value}
                                type="button"
                                disabled={actionTaskId === task.id}
                                onClick={() =>
                                  changeStatus(task.id, action.value)
                                }
                                className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {actionTaskId === task.id
                                  ? "Updating..."
                                  : action.label}
                              </button>
                            ))}

                            {isReviewable && (
                              <>
                                <button
                                  type="button"
                                  disabled={actionTaskId === task.id}
                                  onClick={() => reviewTask(task.id, "APPROVE")}
                                  className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {actionTaskId === task.id
                                    ? "Reviewing..."
                                    : "Approve"}
                                </button>

                                <button
                                  type="button"
                                  disabled={actionTaskId === task.id}
                                  onClick={() =>
                                    reviewTask(task.id, "REQUEST_CHANGES")
                                  }
                                  className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  Request Changes
                                </button>
                              </>
                            )}

                            {statusActions.length === 0 && !isReviewable && (
                              <span className="text-xs text-gray-400">
                                No actions
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {tasks.length === 0 && (
              <div className="p-8 text-center text-sm text-gray-500">
                No tasks match the selected filters.
              </div>
            )}
          </div>

          {pagination && pagination.totalPages > 0 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {tasks.length} of {pagination.total} tasks
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={pagination.page <= 1 || loading}
                  onClick={() => setPage((current) => current - 1)}
                  className="rounded-md border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                <span className="px-2 text-sm text-gray-600">
                  Page {pagination.page} of {pagination.totalPages}
                </span>

                <button
                  type="button"
                  disabled={pagination.page >= pagination.totalPages || loading}
                  onClick={() => setPage((current) => current + 1)}
                  className="rounded-md border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
