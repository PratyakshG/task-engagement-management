import type { Client } from "@/types/client";
import { ServiceType } from "./service-type";

export type EngagementStatus = "ACTIVE" | "COMPLETED" | "CANCELLED";

export interface EngagementTask {
  id: string;
  title: string;
  status:
    | "NOT_STARTED"
    | "IN_PROGRESS"
    | "WAITING_FOR_CLIENT"
    | "READY_FOR_REVIEW"
    | "CHANGES_REQUESTED"
    | "COMPLETED";
  assignedToId: string | null;
}

export interface Engagement {
  id: string;
  clientId: string;
  serviceTypeId: string;
  period: string | null;
  status: EngagementStatus;
  startDate: string;
  dueDate: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    tasks: number;
  };

  client: Pick<Client, "id" | "name">;
  serviceType: Pick<
    ServiceType,
    "id" | "name" | "isRecurring" | "recurrenceInterval"
  >;
}

export interface EngagementListResponse {
  engagements: Engagement[];
}

export interface CreateEngagementInput {
  clientId: string;
  serviceTypeId: string;
  period?: string | null;
  startDate?: string;
  dueDate?: string;
}
