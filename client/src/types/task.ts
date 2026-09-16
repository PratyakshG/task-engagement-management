import type { User } from "@/types/auth";

export type TaskStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "WAITING_FOR_CLIENT"
  | "READY_FOR_REVIEW"
  | "CHANGES_REQUESTED"
  | "COMPLETED";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  assignedToId: string | null;
  reviewerId: string | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;

  engagement: {
    id: string;
    period: string | null;
    client: {
      id: string;
      name: string;
    };
    serviceType: {
      id: string;
      name: string;
    };
  };

  assignedTo: User | null;
}

export interface TaskListResponse {
  tasks: Task[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
