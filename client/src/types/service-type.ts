export type RecurrenceInterval = "MONTHLY" | "QUARTERLY" | "YEARLY";

export interface ServiceType {
  id: string;
  name: string;
  description: string | null;
  isRecurring: boolean;
  recurrenceInterval: RecurrenceInterval | null;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceTypeListResponse {
  serviceTypes: ServiceType[];
}

export interface CreateServiceTypeInput {
  name: string;
  description?: string;
  isRecurring: boolean;
  recurrenceInterval?: RecurrenceInterval | null;
}

export interface UpdateServiceTypeInput {
  name?: string;
  description?: string | null;
  isRecurring?: boolean;
  recurrenceInterval?: RecurrenceInterval | null;
}
